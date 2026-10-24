# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Team entry for the **Certivity challenge** (Industrial Agents Hackathon, Munich, 24–25 Oct 2026). Brief: `project_detail/certivity-challenge-brief.pdf`. Participant package rules: `README.md`. Our design and build plan: `docs/DESIGN.md`. Read DESIGN.md before building pipeline code.

- **Main goal:** product spec (`cases/<case>/spec.md`) and/or exploded view (`exploded_view.png`) → JSON list of requirements. Each one cites a UN Regulation from `regulations/index.json`, its **base** `version_label`, a PDF page, and a paragraph.
- **Sub-goal:** `subgoal/<case>/requirements_old.json` + `old.pdf`/`new.pdf` → which requirements are modified, removed or added, and why.
- We submit **output files, not code**. Certivity never runs this repo.

## Commands

This is a uv project with **no package and no `src/`**. `pyproject.toml` has no build-system on purpose; don't add one back. Run everything from the repo root.

```bash
uv sync                                                   # set up .venv
uv add <pkg>                                              # add a dependency
uv run python tools/fetch_regulations.py                  # download all regulation PDFs + subgoal PDFs (sha256-checked)
uv run python tools/fetch_regulations.py --only "UN R48" --role base
uv run --with jsonschema python tools/validate.py out/sub.json                      # main-goal file
uv run --with jsonschema python tools/validate.py out/chg.json --requirements-old subgoal/dev/requirements_old.json
uv run python tools/score_local.py out/sub.json           # regulation- + page-level P/R vs cases/dev-rear-lamp/expected.json
```

`tools/validate.py` is the exact check the scoring platform runs. A file that passes it is accepted. `score_local.py` doesn't score requirement-level matching (an LLM judge does that on the platform), so we need our own judge (planned in `eval/`).

`tools/`, `schemas/`, `cases/`, `subgoal/` and `regulations/index.json` are the organisers' package. Treat them as read-only inputs. The held-out case (`heldout-front-bumper`, `subgoal-heldout`) is added by `git pull` from the Certivity repo on Sunday 08:00.

## Things that are not obvious

- **Always cite the `base` version.** The expected answers are built on base. A page of the `latest` version counts as a different (wrong) page. `latest` is only for the sub-goal.
- **Page numbers are those of the hosted PDFs.** Every page carries the header `UN Rxx, version x.y.z | page N of M`. Parse the page and paragraph from the PDF in code, never let an LLM produce them. A page counts if the page **or** the paragraph is right, so always include `source.paragraph`. Annex paragraphs are written like `Annex 3 1.2` (matching is normalised: see `_paragraph_key` in `tools/score_local.py`).
- **Granularity:** one engineering obligation per requirement, close to the regulation's own "shall" wording (see `cases/dev-rear-lamp/expected.json`). Merging obligations loses recall.
- **Regulation choice is the main precision lever.** The dev rear lamp answer uses only R148, R48, R150 and R10. It uses the consolidated R148/R150, not the legacy R7/R23/R3 that are also in the index, plus R48 (installation) and R10 (EMC, because of the LEDs).
- Scoring is **F2** (recall-weighted) at regulation, page and requirement level. Don't pad.
- `regulations` is git-ignored as a whole, so `regulations/index.json` and `regulations/pdf/` are **not tracked**. Re-fetch on a fresh clone. PDF download links expire after the event.
- `.env` (git-ignored) holds `CLAUDE_KEY`, `LOVABLE_KEY` and `ELEVENLABS_KEY` (see `.env.template`).

## Submission rules that affect decisions

- Uploads: 5 valid files per hour per challenge. For the held-out case the **last** valid upload counts, not the best. Uploads close Sunday 13:00.
- `team_id` comes from the platform after registration. `case_id` is the case folder name.
