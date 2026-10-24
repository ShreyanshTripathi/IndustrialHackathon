"""Orchestrator: plain code that runs the agents in order and saves every intermediate result.

    uv run python -m pipeline.run cases/dev-rear-lamp                   # all stages built so far
    uv run python -m pipeline.run cases/dev-rear-lamp --stop-after profile

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
    ap.add_argument("--team-id", default="team-tbd", help="shown on the platform after registering")
    args = ap.parse_args(argv)
    case_dir = args.case_dir.resolve()
    out = ROOT / "out" / case_dir.name

    print("① product analyst")
    profile: ProductProfile = analyse(case_dir)
    _save(out, "01_profile.json", profile.model_dump())
    print(f"  {profile.product_name}: {len(profile.functions)} functions, {len(profile.parts)} parts, "
          f"electronics={profile.electronics}")
    if args.stop_after == "profile":
        print(llm.summary())
        return 0

    print("②③ regulation selection")
    g = Graph.load(DATA / "graph.json")
    result = select(profile, g)
    _save(out, "02_regulations.json", result)
    print(f"  selected: {result['selected']}")
    print(f"  superseded: {result['superseded']}")
    _eval_regulations(case_dir, result)
    if args.stop_after == "regulations":
        print(llm.summary())
        return 0

    print("④ section selectors")
    sections = choose_all(profile, g, result)
    _save(out, "03_sections.json", sections)
    for s in sections:
        n = sum(len(u["paragraphs"]) for u in s["units"])
        print(f"  {s['regulation']}: {len(s['units'])} units ({n} paragraphs) of {len(s['units']) + len(s['skipped'])}")
    if args.stop_after == "sections":
        print(llm.summary())
        return 0

    print("⑤ extractors")
    reqs = extract_all(profile, g, sections)
    _save(out, "04_requirements.json", reqs)
    print(f"  {len(reqs)} requirements: {dict(collections.Counter(r['source']['regulation'] for r in reqs))}")
    if args.stop_after == "requirements":
        print(llm.summary())
        return 0

    print("⑥ verifier and critic")
    reqs = verify(profile, g, reqs)
    _save(out, "05_verified.json", reqs)
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
