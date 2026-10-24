# Certivity challenge: design and build plan

From a product spec and/or exploded view to the UN Regulation requirements it must fulfil, each citing regulation, base version, page and paragraph. Optional sub-goal: flag which requirements change between two versions of a regulation.

## 1. What the data tells us (from the dev case)

These facts drive the design. They come from `cases/dev-rear-lamp/expected.json`, `regulations/index.json` and the PDFs.

| Observation | Consequence |
|---|---|
| Golden set: 190 requirements from **4 regulations**: R148 (63), R48 (56), R150 (39), R10 (32). The index has 56. | Regulation selection is a precision gate. One wrong regulation adds dozens of false positives. |
| It picks the **new consolidated** regulations (R148 for lamps, R150 for retro-reflectors) and **not** the legacy R7, R23 and R3, although those are in the index. | Selection needs supersession rules, not keyword matching on titles. |
| It adds **R48 (installation on the vehicle)** and **R10 (EMC, because of the LEDs/PCB)**. Neither is named in the spec. | Selection must reason about how the part is fitted and what it contains (electronics → EMC), not only about what it is. |
| Golden text is **near-verbatim "shall" sentences** from the regulation, lightly rewritten so each one stands alone. One obligation per item. | Extract obligations and lightly normalise them; don't generate them. The requirement-level judge matches on scope, condition and constraint. |
| Golden is **selective inside a regulation**. R10 has ~171 "shall" paragraphs and 15 are used (ESA/component part only). R48 has ~200 and 35 are used (only the rear position, stop and reversing lamp sections). | Choose the relevant sections per regulation before extracting. |
| Every PDF is Certivity-rendered: clean text, and a `UN Rxx, version x.y.z \| page N of M` header on every page. | Pages and paragraphs can be parsed **deterministically**. The LLM never produces a page number. |
| Scoring: a page counts if the page **or** the paragraph is right. Ranking metric is **F2** (recall-weighted). | Always emit `paragraph`. Lean towards recall, but don't pad. |

## 2. Architecture

```
            ┌────────────── offline, once ──────────────┐
 PDFs ───►  │ 0. Ingest: page/paragraph tree per reg     │──► corpus.jsonl (reg, version, page, para, annex, heading path, text)
            └────────────────────────────────────────────┘
 spec.md ─┐
 drawing ─┴► 1. Product profile (vision + text) ─► 2. Regulation selection ─► 3. Section scoping
                                                                                   │
                     6. Validate + export ◄── 5. Post-process ◄── 4. Obligation extraction
                            │
                     submission.json  ──► tools/validate.py ──► platform
                            │
                     UI: engineer review, each requirement links to its PDF page
```

### Stage 0: Ingest (deterministic, no LLM)
- Read each `base` PDF (and `latest`, for the sub-goal) with `pymupdf` or `pypdf`. Read the page number from the page header rather than trusting the page index.
- Split into paragraphs on numbered headings (`^\d+(\.\d+)*\.?\s`). Track the current `Annex N` (and `Part`), so paragraph keys look like the golden ones: `6.2`, `Annex 3 1.2`, `Annex 8 1.2.1`.
- Each record holds `regulation, version, role, page_start, page_end, paragraph, heading_path, text`. Keep tables as text blocks attached to their paragraph.
- Also extract a **regulation card** for each regulation: title, paragraph 1 (Scope), and the list of top-level sections. Stage 2 uses it.
- Output goes to `data/corpus.jsonl`. Parse all 56 regulations ahead of time, because the held-out case may need any of them.

### Stage 1: Product profile
- Claude (vision) reads `exploded_view.png` + `spec.md` and returns JSON with: product type, vehicle category, light/safety **functions**, **parts**, **electronics present** (LED, PCB, sensors, radar, camera), materials, mounting position (front/rear/side) and the vehicle systems it touches.
- Visible in the UI and editable, so an engineer can correct it.

### Stage 2: Regulation selection (precision gate)
- Input: product profile + all 56 regulation cards.
- Claude picks the regulations, each with a one-line reason and a confidence score. Hard rules are applied on top:
  - **Supersession:** R148 replaces R6, R7, R23, R38 (light-signalling). R149 replaces R19, R123 (road illumination). R150 replaces R3, R104 (retro-reflection). Prefer the consolidated regulation unless the spec names the legacy one.
  - **Installation:** any device fitted to an M/N vehicle also pulls in its installation regulation (R48 for lighting).
  - **Electronics → R10 (EMC).**
  - Exclude anything outside the vehicle category, e.g. motorcycle-only (R40, R53, R62, R92) or bus-only (R107) for an M1 part.
- Calibration target: on the dev case, output exactly {R148, R48, R150, R10}.
- Front bumper (held-out) candidates to check once its spec arrives:
  - R42 (front and rear protective devices)
  - R127 / GTR 9 (pedestrian safety: legform impact on the bumper)
  - R26 (external projections)
  - R48/R149/R148 if lamps are integrated
  - R10 and possibly R152/R131 if parking sensors or radar are integrated
  - R94/R137 only if the spec points at crash structure

### Stage 3: Section scoping
- For each selected regulation, send the heading tree (not the full text) plus the product profile. The LLM returns the sections to read, e.g.:
  - R148: general, rear position, stop and reversing, and the photometry/colour annexes
  - R48: the paragraphs for those three lamps, plus general installation
  - R10: the ESA (component) sections, not the whole-vehicle ones
- Also drop sections that never hold product obligations: administrative approval procedure, transitional provisions, communication forms. **Check this against the golden set.** Golden *does* include markings (R150 3.3.x), so markings stay in.

### Stage 4: Obligation extraction
- Batch paragraphs from the scoped sections (~20–40 per call). Each paragraph keeps its ID and metadata. Put the regulation's definitions section in a cached system block (prompt caching), so terms like "ESA" and "reference axis" resolve.
- For each paragraph the model returns zero or more requirements:
  - `text`: one obligation, close to verbatim, standing on its own (replace "it"/"the device" with the component; include the condition, e.g. "When measured per Annex 8, …"). Keep numbers and units exactly.
  - `paragraph_id`: which input paragraph it came from. Page, paragraph label and version are **filled in by code from the corpus**, not by the model.
  - `applies_to`: which product function. Drop requirements for functions the product lacks, e.g. "front position lamp" for a rear lamp.
  - `test_case` (optional): how to verify it (method, annex, pass criterion).
- Models: Haiku for a cheap "does this paragraph contain an obligation relevant to the product" screen across many paragraphs. Opus for the extraction and rewrite.

### Stage 5: Post-process
- Split any item that still holds two "shall" clauses joined by "and"/";" (merged obligations cost recall).
- Remove near-duplicates (fuzzy match within the same paragraph).
- Drop definitions, notes and statements with no obligation.
- Number the requirements `R-0001…`, set `team_id` and `case_id`, run `tools/validate.py`, and fail loudly if it doesn't pass.

### Stage 6: Evaluation harness (build this early, use it all the time)
- `tools/score_local.py` gives regulation- and page-level P/R on the dev case.
- `eval/judge.py` is our own **requirement-level** estimate: an LLM judge matches our requirements one-to-one with expected ones (same scope, condition, constraint) and reports P/R/F2. This mirrors the platform's hidden metric, so we can iterate without spending uploads.
- Error report per run: missed golden paragraphs (recall gaps, usually scoping), extra regulations and sections (precision), merged items.

## 3. Sub-goal pipeline

Input: `requirements_old.json` (94 items for UN R175 in dev), `old.pdf`, `new.pdf`. The dev answer has 24 changes: 6 modified, 1 removed, 17 added.

1. **Parse both** versions with the Stage 0 parser.
2. **Align paragraphs**, first by number, then by text similarity, to catch renumbering. The dev answer has `6.5` → `6.5.2`.
3. **Diff** each aligned pair at word level and classify: unchanged, editorial-only, substantive change, deleted, new.
4. **Map to old requirements** using each requirement's cited paragraph, with text similarity as a fallback.
   - Substantive change → `modified`, with `new_text` rewritten from the new paragraph (LLM, same style as the old requirement).
   - Paragraph deleted → `removed`.
   - New obligation paragraphs (or new "shall" clauses) that no old requirement covers → `added`, one per obligation.
5. **Reason** in the golden style, generated from the diff rather than freely written: `Paragraph 5.1.4 of UN R175 was amended in version 1.0.0: 'standstill.' became 'standstill and, as relevant, while creeping.'`. Cite the page and paragraph of the **new** version.
6. Validate with `tools/validate.py --requirements-old …`. Write an eval that compares against `subgoal/dev/expected.json`: recall of the IDs we flagged, plus the change type.

## 4. Demo UI (20% of score)

The engineer's flow, one screen per step:
1. **Input:** drop in a spec and/or drawing, then press Run. No other manual steps (requirement R3).
2. **Product profile:** parts and functions read from the drawing, editable.
3. **Regulations:** the chosen regulations, each with its reason. Show rejected candidates too, with why (this builds trust).
4. **Requirements:** a table grouped by regulation and section, with filter and search. Each row has a **"source" link that opens the PDF at that page** (`#page=N` in pdf.js) with the paragraph highlighted. Accept/reject buttons. Export validated JSON.
5. **Sub-goal tab:** old vs new paragraph diff side by side, with the affected requirements marked modified, removed or added.
6. **Proof panel:** dev-case scores (regulation, page, requirement-level estimate) and a list of known weak spots. The brief asks the pitch to show where it is weak and how that was measured.

Stack: FastAPI backend that calls the pipeline, and a light frontend: a React page (e.g. built with Lovable, since `.env.template` has a key for it) or Streamlit if time is short. Stream progress for each stage so the demo looks alive.

## 5. Repo layout (no `src/`; run from the repo root)

```
pipeline/
  ingest.py        # Stage 0: PDF → data/corpus.jsonl, regulation cards
  profile.py       # Stage 1
  select_regs.py   # Stage 2 (LLM + rules)
  scope.py         # Stage 3
  extract.py       # Stage 4
  postprocess.py   # Stage 5
  subgoal.py       # diff + change classification
  llm.py           # Anthropic client, caching, retries, JSON parsing
  run.py           # CLI: uv run python -m pipeline.run cases/<case> --team-id …
eval/
  judge.py         # requirement-level LLM matcher → P/R/F2
  report.py        # error analysis vs expected.json
app/               # FastAPI + frontend
data/              # generated corpus (git-ignored)
out/               # submissions (git-ignored)
```

Dependencies: `uv add anthropic pymupdf jsonschema python-dotenv fastapi uvicorn rapidfuzz`

## 6. Build order and timeline

The held-out case is released **Sunday 25 Oct, 08:00**. Uploads close at **13:00**. The **last valid upload counts**, not the best. Rate limit: 5 uploads per hour per challenge.

| # | Task | Done when |
|---|---|---|
| 1 | Ingest all base + latest PDFs into the corpus | Spot-check: paragraph and page of 20 random golden items are found in the corpus |
| 2 | "Oracle" baseline: take the golden regulations, extract **all** obligations | Shows the recall ceiling and the size of the precision problem |
| 3 | Stages 1–2 (profile + selection) | Dev selection is exactly the 4 golden regulations |
| 4 | Stages 3–5 | Valid submission; `score_local` page recall ≥ 0.8 |
| 5 | Judge eval + 2–3 tuning loops on scoping and granularity | Estimated requirement F2 improving; then upload dev to calibrate the judge against the platform |
| 6 | Sub-goal pipeline + eval on dev | Recall of flagged IDs ≥ 0.8 |
| 7 | UI wired to the pipeline, end to end | One click from drawing to requirements with PDF links |
| 8 | Sunday 08:00: `git pull`, fetch PDFs, ingest, run, review, upload | Main and sub-goal files uploaded well before 13:00, final upload ≥ previous |
| 9 | Pitch: solution, demo, proof (dev scores + weak spots) | 15:00 |

**Sunday rule:** keep a copy of every uploaded file and its score in `out/`. Only re-upload if the new file is clearly better on the local eval.

## 7. Risks

- **Wrong version:** always cite `base`. Code sets the version from the index, never the LLM.
- **Wrong page:** comes from the parser, and the paragraph is always included as a second chance to match.
- **Extra regulations:** the selection gate has supersession and category rules. The UI shows rejected regulations and why.
- **Merged obligations:** the splitter in Stage 5 plus few-shot examples taken from golden items.
- **Held-out bumper needs regulations the dev case never exercised:** the corpus covers all 56 regulations, so selection and scoping have to work on regulations we never tuned on. Do a dry run on a made-up "front bumper" spec before Sunday.
