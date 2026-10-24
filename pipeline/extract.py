"""Agent 5, extractors: legal text -> one-obligation requirements, one call per chunk of a selected unit.

The model sees numbered paragraphs ([P1], [P2], ...) and the definitions they use, and returns requirements that
each point back to one paragraph. Regulation, version, page and paragraph label are then filled in by code from
the corpus: the model never writes a citation.
"""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor

from pydantic import BaseModel, Field

from pipeline.graph import Graph
from pipeline.llm import ask
from pipeline.profile import ProductProfile

CHUNK_CHARS = 12000


class Extracted(BaseModel):
    paragraph: str = Field(description="the [P..] reference the obligation comes from, e.g. 'P3'")
    text: str = Field(description="one engineering obligation, close to the regulation's wording")
    applies_to: str = Field(description="which product function or part it concerns")
    test_case: str = Field(description="how to verify it: method or annex, condition, pass criterion")


class Extraction(BaseModel):
    requirements: list[Extracted]


SYSTEM = """You turn UN Regulation text into the engineering requirements a specific product must fulfil, in the
style of an expert regulatory requirements list.

Rules:
- One obligation per requirement. A paragraph with two "shall" statements, or one limit per frequency band, per
  colour or per lamp function, gives several requirements.
- Stay close to the regulation's wording. Make each requirement stand alone: name the subject ("The stop lamp
  shall ..." rather than "It shall ..."), and keep the condition it depends on ("When measured according to
  Annex 8, ...", "If the lamp is of category S1, ...").
- Keep every number, unit, tolerance and referenced paragraph or annex exactly.
- Include obligations on the device, its markings, its performance and tests, and its installation on the
  vehicle where the text covers installation.
- Skip: obligations for functions, devices or vehicle categories this product does not have; duties of type
  approval authorities or technical services; application paperwork; definitions; notes and explanations with no
  obligation; pure cross-references with no content of their own.
- Paragraphs may give no requirement at all; return an empty list if none apply.

Examples of the expected style:
- "The markings shall be clearly legible and indelible."
- "The retro-reflective devices shall bear the trade name or mark of the applicant."
- "When measurements are made using the method described in Annex 8, the limit in the 400 to 1,000 MHz frequency
  band shall remain constant at 53 dB microvolts/m."
- "When visual examination of a reversing lamp appears to reveal substantial local variations of intensity, no
  intensity measured between two of the directions of measurement of the grid shall be below 50 per cent of the
  lower minimum intensity of the two prescribed for these directions."
"""


def _chunks(g: Graph, paragraphs: list[str]) -> list[list[str]]:
    out, cur, size = [], [], 0
    for pid in paragraphs:
        n = len(g.nodes[pid]["text"])
        if cur and size + n > CHUNK_CHARS:
            out.append(cur)
            cur, size = [], 0
        cur.append(pid)
        size += n
    if cur:
        out.append(cur)
    return out


def _definitions(g: Graph, pids: list[str], limit: int = 15) -> list[str]:
    terms = list(dict.fromkeys(t for p in pids for t in g.out(p, "USES_TERM")))
    return [g.nodes[t]["definition"][:350] for t in terms[:limit]]


def _profile_brief(profile: ProductProfile) -> str:
    funcs = "; ".join(f.name for f in profile.functions)
    parts = "; ".join(p.name for p in profile.parts)
    return (f"{profile.product_name}: {profile.product_type}. Vehicle categories: {', '.join(profile.vehicle_categories)}. "
            f"Mounting: {profile.mounting_location}.\nFunctions: {funcs}\nParts: {parts}\n"
            f"Electronics: {'; '.join(profile.electronics) or 'none'}")


def extract_chunk(profile: ProductProfile, g: Graph, regulation: str, unit: dict, pids: list[str]) -> list[dict]:
    refs = {f"P{i + 1}": pid for i, pid in enumerate(pids)}
    body = "\n".join(f"[{ref}] {g.nodes[pid]['label']}: {g.nodes[pid]['text']}" for ref, pid in refs.items())
    defs = _definitions(g, pids)
    content = (f"<product>\n{_profile_brief(profile)}\n</product>\n\n"
               f"<regulation>{regulation}, section {unit['key']}: {unit['title']}</regulation>\n\n"
               + (f"<definitions>\n" + "\n".join(defs) + "\n</definitions>\n\n" if defs else "")
               + f"<paragraphs>\n{body}\n</paragraphs>\n\nExtract the requirements.")
    result = ask(Extraction, SYSTEM, content, effort="medium")
    out = []
    for r in result.requirements:
        pid = refs.get(r.paragraph.strip("[] "))
        if not pid:
            continue  # model pointed at no paragraph we gave it: drop rather than guess a citation
        n = g.nodes[pid]
        out.append({"text": r.text.strip(), "applies_to": r.applies_to, "test_case": r.test_case, "node": pid,
                    "source": {"regulation": n["regulation"], "version": n["version"], "page": n["page_start"],
                               "paragraph": n["label"]}, "unit": unit["key"]})
    return out


def extract_all(profile: ProductProfile, g: Graph, sections: list[dict], workers: int = 8) -> list[dict]:
    jobs = [(s["regulation"], u, chunk) for s in sections for u in s["units"] for chunk in _chunks(g, u["paragraphs"])]
    with ThreadPoolExecutor(workers) as pool:
        results = pool.map(lambda j: extract_chunk(profile, g, *j), jobs)
    return [r for batch in results for r in batch]
