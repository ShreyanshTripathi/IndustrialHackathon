"""Orchestrator: plain code that runs the agents in order and saves every intermediate result.

    uv run python -m pipeline.run cases/dev-rear-lamp                   # all stages built so far
    uv run python -m pipeline.run cases/dev-rear-lamp --stop-after profile
    LLM_OFFLINE=1 uv run python -m pipeline.run cases/dev-rear-lamp --resume   # no API calls: saved stages + cache

Writes out/<case_id>/01_profile.json, 02_regulations.json, ... and, when the case ships an expected.json,
prints how each stage compares with it.
"""

from __future__ import annotations

import argparse
import collections
import json
import subprocess
import sys
from pathlib import Path

from pipeline import llm
from pipeline.extract import extract_all
from pipeline.graph import DATA, Graph
from pipeline.profile import ProductProfile, analyse
from pipeline.sections import choose_all
from pipeline.verify import KEEP, kept, verify
from pipeline.select_regs import select

ROOT = Path(__file__).resolve().parent.parent
STAGES = ("profile", "regulations", "sections", "requirements", "verified")


def _save(out: Path, name: str, data) -> None:
    out.mkdir(parents=True, exist_ok=True)
    (out / name).write_text(json.dumps(data, indent=1, ensure_ascii=False))


def _stage(out: Path, name: str, resume: bool, compute):
    """Reuse out/<case>/<name> when resuming and it exists; otherwise compute and save it."""
    path = out / name
    if resume and path.is_file():
        print(f"  (reused {path.relative_to(ROOT)})")
        return json.loads(path.read_text())
    data = compute()
    _save(out, name, data)
    return data


def _eval_regulations(case_dir: Path, result: dict) -> None:
    expected = case_dir / "expected.json"
    if not expected.is_file():
        return
    gold = {r["source"]["regulation"] for r in json.loads(expected.read_text())["requirements"]}
    got = set(result["selected"])
    hit = gold & got
    print(f"  regulations vs expected: precision {len(hit)}/{len(got)}, recall {len(hit)}/{len(gold)}")
    for r in sorted(gold - got):
        a = result["applicability"][r]
        why = result["superseded"].get(r) and f"superseded by {result['superseded'][r]}" or \
            result["verdicts"].get(r, {}).get("reason") or f"applicability={a['applies']}: {a['reason']}"
        print(f"    missed {r}: {why}")
    for r in sorted(got - gold):
        print(f"    extra  {r}: {result['verdicts'][r]['reason']}")


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("case_dir", type=Path)
    ap.add_argument("--stop-after", choices=STAGES, default=STAGES[-1])
    ap.add_argument("--team-id", default="team-08", help="shown on the platform after registering")
    ap.add_argument("--resume", action="store_true", help="reuse saved stage outputs in out/<case>/ where present")
    args = ap.parse_args(argv)
    case_dir = args.case_dir.resolve()
    out = ROOT / "out" / case_dir.name

    print("① product analyst")
    profile = ProductProfile.model_validate(
        _stage(out, "01_profile.json", args.resume, lambda: analyse(case_dir).model_dump()))
    print(f"  {profile.product_name}: {len(profile.functions)} functions, {len(profile.parts)} parts, "
          f"electronics={profile.electronics}")
    if args.stop_after == "profile":
        print(llm.summary())
        return 0

    print("②③ regulation selection")
    g = Graph.load(DATA / "graph.json")
    result = _stage(out, "02_regulations.json", args.resume, lambda: select(profile, g))
    print(f"  selected: {result['selected']}")
    print(f"  superseded: {result['superseded']}")
    _eval_regulations(case_dir, result)
    if args.stop_after == "regulations":
        print(llm.summary())
        return 0

    print("④ section selectors")
    sections = _stage(out, "03_sections.json", args.resume, lambda: choose_all(profile, g, result))
    for s in sections:
        n = sum(len(u["paragraphs"]) for u in s["units"])
        print(f"  {s['regulation']}: {len(s['units'])} units ({n} paragraphs) of {len(s['units']) + len(s['skipped'])}")
    if args.stop_after == "sections":
        print(llm.summary())
        return 0

    print("⑤ extractors")
    reqs = _stage(out, "04_requirements.json", args.resume, lambda: extract_all(profile, g, sections))
    print(f"  {len(reqs)} requirements: {dict(collections.Counter(r['source']['regulation'] for r in reqs))}")
    if args.stop_after == "requirements":
        print(llm.summary())
        return 0

    print("⑥ verifier and critic")
    reqs = _stage(out, "05_verified.json", args.resume, lambda: verify(profile, g, reqs))
    print(f"  kinds: {dict(collections.Counter(r['kind'] for r in reqs))}")
    print(f"  low traceability (<50% shared wording with source): {sum(r['trace'] < 50 for r in reqs)}")
    reqs = kept(reqs)
    print(f"  kept {len(reqs)} ({', '.join(sorted(KEEP))})")
    submission = {
        "team_id": args.team_id,
        "case_id": case_dir.name,
        "requirements": [{"id": f"R-{i + 1:04d}", "text": r["text"], "source": r["source"],
                          **({"test_case": r["test_case"]} if r["test_case"] else {})} for i, r in enumerate(reqs)],
    }
    sub_path = out / "submission.json"
    _save(out, "submission.json", submission)
    print(f"  wrote {sub_path.relative_to(ROOT)}")
    subprocess.run([sys.executable, str(ROOT / "tools" / "validate.py"), str(sub_path)])
    if (case_dir / "expected.json").is_file():
        subprocess.run([sys.executable, str(ROOT / "tools" / "score_local.py"), str(sub_path),
                        "--expected", str(case_dir / "expected.json")])
    print(llm.summary())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
