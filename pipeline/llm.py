"""One way to call Claude for every agent: structured output, on-disk cache, cost tally.

Every call is cached under data/llm_cache/ by a hash of (model, system, content, schema, effort), so a rerun of the
pipeline costs nothing and gives the same answer. Delete the folder, pass fresh=True, or set LLM_FRESH=1 to force new calls
(the new answer then replaces the cached one).
"""

from __future__ import annotations

import hashlib
import json
import os
import threading
from pathlib import Path
from typing import TypeVar

import anthropic
from dotenv import load_dotenv
from pydantic import BaseModel

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "data" / "llm_cache"
MODEL = "claude-opus-5-5"
PRICE = {"input": 4.00, "output": 20.00, "cache_read": 0.20, "cache_write": 5.00}  # $ per 1M tokens, Opus 5.5

load_dotenv(ROOT / ".env")
if not os.environ.get("ANTHROPIC_API_KEY") and os.environ.get("CLAUDE_KEY"):
    os.environ["ANTHROPIC_API_KEY"] = os.environ["CLAUDE_KEY"].strip().strip('"')

T = TypeVar("T", bound=BaseModel)
_client: anthropic.Anthropic | None = None
_lock = threading.Lock()
spent = {"calls": 0, "cached": 0, "usd": 0.0}


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(max_retries=4)
    return _client


def _cost(usage) -> float:
    return (usage.input_tokens * PRICE["input"] + usage.output_tokens * PRICE["output"]
            + (usage.cache_read_input_tokens or 0) * PRICE["cache_read"]
            + (usage.cache_creation_input_tokens or 0) * PRICE["cache_write"]) / 1e6


def ask(schema: type[T], system: str, content: str | list, *, effort: str = "medium", max_tokens: int = 16000,
        fresh: bool = False) -> T:
    """Send one request and return the response parsed into `schema`."""
    messages = [{"role": "user", "content": content}]
    key = hashlib.sha256(json.dumps([MODEL, system, messages, schema.model_json_schema(), effort],
                                    sort_keys=True, default=str).encode()).hexdigest()
    path = CACHE / f"{key}.json"
    if path.is_file() and not fresh and not os.environ.get("LLM_FRESH"):
        with _lock:
            spent["cached"] += 1
        return schema.model_validate_json(json.loads(path.read_text())["output"])
    if os.environ.get("LLM_OFFLINE"):
        raise RuntimeError(f"LLM_OFFLINE is set and this {schema.__name__} request is not cached ({key[:12]})")

    response = _get_client().beta.messages.parse(
        model=MODEL,
        max_tokens=max_tokens,
        betas=["server-side-fallback-2026-07-01"],
        fallbacks="default",  # on a safety decline, the API re-runs the request on a fallback model
        system=system,
        messages=messages,
        output_config={"effort": effort},
        output_format=schema,
    )
    if response.stop_reason in ("refusal", "max_tokens"):
        raise RuntimeError(f"model stopped with {response.stop_reason} (request {response._request_id})")
    parsed = response.parsed_output
    cost = _cost(response.usage)
    with _lock:
        spent["calls"] += 1
        spent["usd"] += cost
    CACHE.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps({"output": parsed.model_dump_json(), "usd": cost, "request_id": response._request_id}))
    return parsed


def summary() -> str:
    return f"{spent['calls']} model calls (${spent['usd']:.2f}), {spent['cached']} served from cache"
