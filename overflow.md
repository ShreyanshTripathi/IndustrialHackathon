# Pipeline flow

How a case goes from inputs to a submission file: what each stage reads, does and writes, and what is built so far. For the reasoning behind the design, see `docs/DESIGN.md`.

```
 ┌──────────────── data layer (code, once per package) ────────────────┐
 │  regulations/pdf/*.pdf ──► ingest ──► data/corpus.jsonl ──► graph ──► data/graph.json
 └─────────────────────────────────────────────────────────────────────┘
                                                                 │
 cases/<case>/spec.md ─┐                                         │
 exploded_view.png ────┴► ① product analyst ──► ② applicability ×56 ──► ③ reconciler
                                                                 │
                               ④ section selectors ──► ⑤ extractors ──► ⑥ verifier/critic
                                                                 │
                                         out/<case>/submission.json ──► tools/validate.py ──► platform
                                                                 │
 subgoal/<case>/ old.pdf, new.pdf, requirements_old.json ──► ⑦ change analyst ──► out/<case>/changes.json
```

The orchestrator (`pipeline/run.py`) is plain code. It runs the stages in order, runs agents in parallel where they don't depend on each other, and saves every intermediate result to `out/<case_id>/`.

## Stages

| # | Stage | Kind | Reads | Writes | Status |
|---|---|---|---|---|---|
| 0a | Ingest (`pipeline/ingest.py`) | code | regulation PDFs, subgoal PDFs | `data/corpus.jsonl`, `data/cards.json` | ✅ 284/284 dev citations resolve |
| 0b | Graph (`pipeline/graph.py`) | code | corpus | `data/graph.json` | ✅ |
| ① | Product analyst (`pipeline/profile.py`) | Claude, vision | `spec.md`, `exploded_view.png` | `01_profile.json` | ✅ |
| ② | Applicability ×56 (`pipeline/select_regs.py`) | Claude, parallel | profile + one regulation brief each | `02_regulations.json` (`applicability`) | ✅ |
| ③ | Reconciler (`pipeline/select_regs.py`) | code rule + Claude | all candidate decisions | `02_regulations.json` (`superseded`, `verdicts`, `selected`) | ✅ dev: 4/4 exact |
| ④ | Section selectors | Claude, one per regulation | profile + heading tree + graph references | `03_sections.json` | ⏳ next |
| ⑤ | Extractors | Claude, one per section | paragraphs + definitions | `04_requirements.json` | ⏳ next |
| ⑥ | Verifier and critic | code + Claude | requirements + corpus | `05_verified.json`, `submission.json` | ⏳ |
| ⑦ | Change analyst (sub-goal) | code + Claude | graph `ALIGNS` edges + `requirements_old.json` | `changes.json` | ⏳ alignment done |

## Data layer

**Ingest.** Splits each PDF into paragraphs using layout rules that hold for every hosted file:
- headings are Helvetica-Bold and body text is Times;
- `Part N -` inside an annex is Times-Bold;
- the `page N of M` header is printed at the bottom of each page.

Each record holds the regulation, version, role (`base`, `latest`, `old`, `new`), page range, section and text. It also holds a paragraph label in the format the expected answers use: `6.2`, `Annex 3 1.2`, `Annex 4 Part 1 1.2`. Page numbers come only from the page header, never from a model.

**Graph.** Built from the corpus by code, with no model calls.

| Nodes | Edges |
|---|---|
| regulation, version, paragraph, annex, defined term | `HAS_VERSION`, `CONTAINS`, `CHILD_OF`, `IN_ANNEX`, `REFERS_TO` (paragraph and annex cross-references), `CITES_REG`, `CONSOLIDATES` (e.g. R148 → R6, R7, R23, R38), `DEFINES`, `USES_TERM`, `NEXT_VERSION`, `ALIGNS` (same / changed / moved / split) |

Measured on the dev case:
- Following references from the golden main-text paragraphs reaches 12 of the 16 golden annex paragraphs within 2 hops.
- Paragraph alignment flags every requirement the sub-goal answer changes. Old 6.5 is detected as split into 6.5.2 and 6.5.3.

## Agents

Every call goes through `pipeline/llm.ask()`:
- model `claude-opus-5-5`, with output parsed into a Pydantic schema;
- server-side refusal fallback turned on;
- each response cached on disk in `data/llm_cache/`, so a rerun is free and gives the same output;
- the run prints its cost at the end.

**① Product analyst.** Turns the spec and drawing into a product profile: functions (each light function listed separately), parts with materials, electronics, mounting, vehicle interfaces, what only the drawing shows, and open questions. Facts stated in the spec override guesses from the drawing.

**② Applicability.** One call per regulation, 56 in total, run 8 at a time. Each call sees:
- the product profile;
- that regulation's brief: scope text, introduction, contents, what it consolidates or is consolidated by, and which regulations it cites;
- "mentions": the paragraphs of that regulation that name the product's own parts and functions. These show dedicated sections (R26 6.5 Bumpers) and exclusions that a scope paragraph doesn't.

Each call returns yes, maybe or no, with a basis, the functions covered, a quote from the scope and a reason.

**③ Reconciler.**
1. Code drops any candidate that a selected consolidating regulation replaces.
2. One Claude call sees all remaining candidates together and gives an in or out verdict with a reason for each.
3. Any candidate without a verdict stays in, because missing a regulation costs more than an extra one.

The main rules:
- prefer consolidated regulations over the old single-device ones;
- keep the installation regulation and the EMC regulation where they apply;
- keep a whole-vehicle regulation only if it has provisions written for this component type;
- never include a regulation on an assumption the spec contradicts.

## Results so far

| Case | Selected | vs expected | Cost |
|---|---|---|---|
| dev-rear-lamp | R10, R148, R150, R48 (superseded: R3, R7, R23) | precision 4/4, recall 4/4 | $1.41 |
| dry run: invented front bumper | R10, R127, R148, R149, R26, R42, R48 (superseded: R6, R19) | no answer to compare with | $1.45 |

## Commands

```bash
uv run python -m pipeline.ingest --check        # PDFs -> corpus (~2 min)
uv run python -m pipeline.graph --eval          # corpus -> graph (~5 s)
uv run python -m pipeline.run cases/<case>      # agents -> out/<case>/
uv run --with jsonschema python tools/validate.py out/<case>/submission.json
uv run python tools/score_local.py out/<case>/submission.json
```

**Sunday:**
1. At 08:00, `git pull` the held-out case.
2. Run `fetch_regulations.py`, then ingest and graph.
3. Run the pipeline on `cases/heldout-front-bumper`.
4. Review, validate and upload.
5. Only re-upload a file that is clearly better on our own scoring. The last upload counts, and uploads close at 13:00.
