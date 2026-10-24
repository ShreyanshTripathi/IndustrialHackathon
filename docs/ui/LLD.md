# Flame web app: low-level design

How each part of [HLD.md](HLD.md) is built: files, data shapes, endpoints, agents, retrieval, graph payloads, screens. FR/NFR ids refer to the HLD. The build order is in [PLAN.md](PLAN.md).

## 1. Repository layout (new parts in bold)

```
pipeline/                 existing stages ①–⑥ (+ subgoal)
  ingest.py               CHANGE: store line boxes per paragraph (§4)
  **enrich.py**           ⑧ plain summary, severity, phase (§3.1)
  **retrieve.py**         hybrid retriever for the assistant and graph chat (§5)
  **index.py**            offline: BM25, embeddings, 2-D layout, kNN edges (§5.4, §6.2)
**app/**
  **main.py**             FastAPI app, routes (§7)
  **jobs.py**             background run runner + progress events (§7.3)
  **ask.py**              ⑨ ask agent (§3.2)
  **graph_chat.py**       ⑩ graph chat agent with tools (§3.3)
  **graph_view.py**       structure and meaning payloads (§6)
  **voice.py**            ElevenLabs proxy: speech-to-text and text-to-speech (§8)
  **schemas.py**          Pydantic models shared by the routes (§2)
**web/**                  React + Vite + TypeScript client (§9)
data/
  corpus.jsonl            CHANGE: + `boxes` per paragraph
  graph.json              existing
  **index/**              bm25.pkl, embeddings.npy, ids.json, layout_<reg>.json
out/<run_id>/             existing stage files 01–06 + submission.json
  **07_enriched.json**    ⑧ output (§2.2)
  **run.json**            run metadata and status (§2.1)
```

## 2. Data shapes

### 2.1 Run (`out/<run_id>/run.json`)
```json
{
  "id": "2026-10-25T08-05-12_heldout-front-bumper",
  "case": "heldout-front-bumper",
  "title": "Front bumper",
  "created": "2026-10-25T08:05:12+02:00",
  "inputs": {"spec": "spec.md", "drawings": ["exploded_view.png"]},
  "status": "running | done | failed",
  "stage": "extract",
  "stages": [{"key": "profile", "label": "Product profile", "status": "done", "detail": "5 functions, 9 parts", "seconds": 18}],
  "counts": {"regulations": 4, "requirements": 311},
  "cost_usd": 5.82,
  "preloaded": false,
  "error": null
}
```

### 2.2 Enriched requirement (`07_enriched.json`, one per submitted requirement)
```json
{
  "id": "R-0042",
  "node": "para:UN R48@9.3.0/base#6.7.4.1",
  "source": {"regulation": "UN R48", "version": "9.3.0", "page": 46, "paragraph": "6.7.4.1"},
  "text": "<the requirement text exactly as submitted>",
  "summary": "Each stop lamp's outer edge must be at most 400 mm from the side of the car.",
  "severity": 3,
  "severity_reason": "Fixes where the lamp sits on the car; a wrong position fails installation approval.",
  "phase": 1,
  "phase_reason": "Lamp position is fixed when the car's rear is packaged, before detailed design.",
  "deadline": null,
  "priority": 7,
  "applies_to": "Stop lamp (LED modules on PCB)",
  "test_case": "Measure the distance from the apparent surface's outer edge to the vehicle's extreme outer edge.",
  "kind": "product_requirement",
  "para_score": 72
}
```
- `priority` is computed in code, never by the model: sort by `(phase, -severity, regulation_order, paragraph_order)` and number from 1.
- `deadline` (P2): `{"date": "2026-09-01", "what": "new type approvals", "source_paragraph": "12.3"}` from transitional provisions, else `null`.

### 2.3 Paragraph source (`GET /api/paragraphs/{node}`)
```json
{
  "node": "para:UN R48@9.3.0/base#6.7.4.1",
  "regulation": "UN R48", "version": "9.3.0", "label": "6.7.4.1",
  "pages": [46], "text": "...",
  "boxes": [{"page": 46, "bbox": [57.0, 412.3, 531.8, 424.0]}],
  "pdf": "/files/UN_R48/base/UN_R48_base.pdf",
  "definitions": [{"term": "Apparent surface", "node": "...", "label": "2.10.2"}],
  "references": [{"node": "...", "label": "5.8.1", "regulation": "UN R48"}]
}
```

### 2.4 Assistant answer (`POST /api/ask`, streamed)
```json
{"answer": "The stop lamp must still meet its light output after ...", "citations": [{"node": "...", "regulation": "UN R148", "label": "Annex 6 1.2", "page": 31}], "not_in_sources": false}
```

### 2.5 Graph payload (`GET /api/runs/{id}/graph?view=structure|meaning`)
```json
{
  "view": "structure",
  "nodes": [{"id": "...", "kind": "regulation|section|paragraph", "label": "6.7.4.1", "regulation": "UN R48",
             "x": 12.4, "y": -3.1, "size": 4, "requirement_ids": ["R-0042"], "severity": 3, "phase": 1}],
  "edges": [{"source": "...", "target": "...", "kind": "child|refers|cites_reg|defines|similar", "weight": 0.83}],
  "legend": {"severity": {...}, "edge_kinds": {...}}
}
```

## 3. New agents

All three use `pipeline/llm.ask()`, so they share the disk cache, cost tally, model and refusal fallback. Outputs are Pydantic models (structured output). The model never writes a citation itself; it points at ids it was given, and code fills in regulation, version, page and paragraph.

### 3.1 ⑧ Enrich agent (`pipeline/enrich.py`)
- **When:** after ⑥ verify + rank + dedup, on exactly the requirements in `submission.json`.
- **Batching:** one call per (regulation, section) group, at most 30 requirements per call. With ~300 requirements, that's about 15 calls run 8 at a time, about 40 s.
- **Input per call:** the product profile brief; the rubric tables (severity, phase) verbatim from HLD FR-8/FR-9; per requirement `Q<n>`: its text, regulation, paragraph, the critic's `kind`, `applies_to`, and the source paragraph's first 300 characters.
- **Output schema:**
  ```python
  class Enriched(BaseModel):
      id: str                      # "Q3"
      summary: str                 # ≤ 25 words, plain language, no paragraph numbers
      severity: int                # 1..5
      severity_reason: str         # ≤ 20 words
      phase: int                   # 1..5
      phase_reason: str            # ≤ 20 words
  class EnrichBatch(BaseModel):
      items: list[Enriched]
  ```
- **Code-side rules after the call:**
  - `kind == "optional_or_advisory"` → severity capped at 1;
  - `kind == "manufacturer_process"` → phase 5;
  - a requirement under an approval-marking section → phase ≥ 4;
  - missing items get severity 3, phase 2, reason "not rated".
- **Effort:** low. **Cost:** about 300 × 120 output tokens plus input ≈ $0.8 on Opus 5.5.
- **Priority:** computed after the call (§2.2).
- **Check:** 30 random dev requirements read by hand; agreement is noted in the README. No answer key exists.

### 3.2 ⑨ Ask agent (`app/ask.py`)
- **Input:**
  - the question;
  - optional focus (a requirement id or graph node);
  - the run id (sets the regulation scope);
  - the last 4 turns;
  - retrieved context: up to 10 paragraphs from §5, each as `[S<n>] UN R48 6.7.4.1 (p.46): text…`.
- **System prompt (outline):**
  - answer only from the sources, in at most 4 short sentences of plain language;
  - cite with `[S<n>]`;
  - if the sources don't answer it, say "The regulations in this analysis don't cover that" and suggest a better question;
  - no paragraph numbers in the prose (the chips carry them);
  - for spoken answers, no lists and no symbols that read badly aloud.
- **Output:** streamed text. After the stream ends, code parses the `[S<n>]` tags, keeps only those that were in the retrieved set, and maps them to citations (§2.4). An answer whose citations all fail is replaced by the "not covered" message.
- **Model and effort:** Claude Sonnet 5.5, low effort. Target first token under 3 s (NFR-2). Responses are not cached: a question is rarely asked twice the same way.

### 3.3 ⑩ Graph chat agent (`app/graph_chat.py`)
A tool-use loop (the Anthropic SDK tool runner, at most 6 tool calls per question). Tools, all read-only over `data/graph.json`, the run's enriched requirements and the retriever:

| Tool | Input | Returns |
|---|---|---|
| `search_paragraphs` | `query`, `k` | ranked paragraphs in scope (via §5) |
| `get_node` | `node_id` | label, text excerpt, requirement summaries |
| `neighbors` | `node_id`, `edge_kinds`, `hops ≤ 2` | adjacent nodes with edge kind |
| `requirements` | filters `regulation`, `phase`, `severity_min`, `text` | matching enriched requirements |
| `path_between` | `a`, `b` | shortest reference path, ≤ 6 hops |
| `highlight` | `node_ids`, `focus` | nothing; records the UI action |

Final output: `{"answer": str, "highlight": [node_ids], "focus": node_id | null, "citations": [...]}`. The client lights up `highlight`, eases the camera to `focus`, and shows the answer with citation chips.

## 4. Ingest change: line boxes

The viewer highlights a paragraph by drawing rectangles over its lines. `pipeline/ingest.py` keeps `page_start/page_end` but not positions.

- In `parse_pdf`, append `{"page": page_no, "bbox": [x0, y0, x1, y1]}` for each line added to the current paragraph (pymupdf `line["bbox"]`, PDF points, origin top-left). This is the same approach `certivity-agent/certivity_agent/parse.py` already uses; port it from there.
- Store it as `boxes` in `data/corpus.jsonl`, rounded to 0.1 pt.
- Paragraph boxes are served by `/api/paragraphs/{node}`; the graph payload never includes them.
- Merge consecutive lines into one rectangle per column block when their x-ranges overlap, to avoid 40 thin bars.
- Check: for all 190 dev citations, the cited page has at least one box (target 190/190, as `check` does for pages).
- Also fix the appendix label bug found in review: `ingest.py:141-143`, `base = None` when `annex` starts with "Appendix".

## 5. Retrieval for the assistant and graph chat (`pipeline/retrieve.py`)

### 5.1 Scope
Only paragraphs of the run's selected regulations (base version), plus regulations they cite directly (one hop through `CITES_REG`). Typically 2,000–4,000 paragraphs.

### 5.2 Three retrievers
1. **Lexical (BM25):** tokenised on words and paragraph-number tokens (`6.7.4.1`, `annex 8`, `s3`), regulation terms kept whole. A library such as `rank_bm25` or a 40-line implementation; the index is built once for the whole corpus and filtered by scope at query time.
2. **Semantic (embeddings):** cosine similarity between the question embedding and paragraph embeddings (§5.4).
3. **Graph expansion:** seeds are the focus node (if any) plus the top 3 from (1)+(2). Add the seeds' definitions used (`USES_TERM` → `DEFINES`), referenced paragraphs (`REFERS_TO`, 1 hop) and parent paragraph (`CHILD_OF`).

### 5.3 Fusion
Reciprocal rank fusion, `score = Σ 1/(60 + rank)` over BM25 top 30 and embeddings top 30. A focus node gets a fixed top rank, and graph-expansion nodes are inserted after the top 5. Requirement paragraphs of the run get a small boost (+0.005). Cut to 10 paragraphs and at most 6,000 characters (definitions truncated to 300 characters).

### 5.4 Embeddings (`pipeline/index.py`, offline, once)
- **Model:** `BAAI/bge-small-en-v1.5` via `sentence-transformers` (384 dimensions, CPU).
- **Input:** `"<regulation> <label> <section title>: <text>"`, truncated to 512 tokens.
- **Scope:** base versions of all 56 regulations, about 28k paragraphs, roughly 10–20 minutes on a laptop CPU. Saved as `data/index/embeddings.npy` (float16) with `ids.json`.
- **Query side:** the same model with bge's query instruction prefix.
- **Alternative:** `voyage-3.5` behind the same function signature, switched with `EMBEDDINGS=voyage` (needs a key; about 1.8M tokens is within the free tier).
- **Check:** questions written from 20 dev expected requirements (e.g. "how far from the edge must the stop lamp be?") must retrieve their paragraph in the top 10 with fusion. Record hit@10 for BM25 alone, embeddings alone and fusion.

## 6. Graph views (`app/graph_view.py`)

### 6.1 Structure view
- **Nodes:** each selected regulation (1 node), its top-level sections and annexes, and every paragraph under a section that holds at least one requirement or is referenced by one. Other paragraphs are collapsed into their section node to keep the view to about 600–1,500 nodes.
- **Edges:**
  - `child` (hierarchy, light);
  - `refers` (paragraph → paragraph or annex);
  - `cites_reg` (regulation → regulation, thick);
  - `defines` (definition paragraph → user, dotted, hidden by default).
- **Layout:** ForceAtlas2 (graphology-layout-forceatlas2) run once on the server in Python (e.g. `fa2` port or networkx spring layout as a fallback), seeded so each regulation forms a cluster. Positions are stored in `out/<run_id>/graph_structure.json`.
- **Styling** (done on the client):
  - requirement paragraphs: filled circle, colour by highest severity, size `4 + 2·min(n_requirements, 4)`;
  - other paragraphs: hollow, 30% opacity;
  - sections: small squares;
  - regulations: labels always shown.

### 6.2 Meaning view
- **Nodes:** all paragraphs of the selected regulations that have text of at least 60 characters, excluding administrative sections (application, communication forms, approval-mark arrangements), so boilerplate doesn't dominate. About 1,500–2,500 nodes.
- **Positions:** UMAP (`umap-learn`, cosine, `n_neighbors=15`, `min_dist=0.1`, fixed seed) of the stored embeddings, scaled to the canvas.
- **Edges:** for each requirement paragraph, its 3 nearest neighbours by cosine (`similar`, weight = similarity), across regulations included. Neighbour edges between other paragraphs are hidden by default.
- **Reading aid:** a cluster label per regulation at its centroid; requirement nodes styled as in 6.1.

### 6.3 Hover popup (both views)
Contents:
- `UN R48 · 6.7.4.1 · p.46`;
- the summaries of its requirements (from `07_enriched.json`, up to 3);
- a severity badge and phase badge;
- "Click to open source".

A non-requirement paragraph shows the first 140 characters of its text instead. Popups are positioned by the sigma `enterNode` event and are keyboard reachable through a node list (accessibility).

## 7. Backend API (`app/main.py`)

### 7.1 Routes

| Method | Path | Purpose | FR |
|---|---|---|---|
| `POST` | `/api/runs` | multipart: `spec` (file or text), `drawings[]`, `title`; creates a run, starts the job, returns `run.json` | FR-1, FR-2 |
| `GET` | `/api/runs` | list runs (newest first, preloaded flagged) | FR-3 |
| `GET` | `/api/runs/{id}` | `run.json` | FR-3 |
| `GET` | `/api/runs/{id}/events` | SSE: `stage`, `progress`, `cost`, `done`, `error` | FR-2 |
| `GET` | `/api/runs/{id}/requirements` | `07_enriched.json` (or ⑥ output without enrichment while it runs), sorted by priority | FR-6–12 |
| `GET` | `/api/runs/{id}/profile` | `01_profile.json` + regulation choices with reasons from `02_regulations.json` | FR-4 |
| `GET` | `/api/runs/{id}/export?format=submission\|csv\|pdf` | downloads | FR-5 |
| `GET` | `/api/paragraphs/{node}` | §2.3 | FR-13, FR-15 |
| `GET` | `/files/{reg}/{role}/{file}.pdf` | the PDF, from the kit folder, path-checked against `regulations/index.json` | FR-13 |
| `POST` | `/api/runs/{id}/ask` | `{question, focus?, history[]}` → SSE tokens, then the final §2.4 JSON | FR-16–20 |
| `GET` | `/api/runs/{id}/graph?view=` | §2.5 | FR-21–23 |
| `POST` | `/api/runs/{id}/graph/chat` | `{question, view, selection?}` → §3.3 output | FR-24 |
| `GET` | `/api/changes/{case}` | sub-goal `changes.json` + both texts | FR-26 |
| `POST` | `/api/voice/stt` | multipart `audio` (webm/opus or wav, ≤ 60 s) → `{text}` via ElevenLabs Scribe | FR-16 |
| `POST` | `/api/voice/tts` | `{text}` → streamed audio (`audio/mpeg`) via ElevenLabs | FR-16 |

### 7.2 Errors
JSON `{"error": {"code": "...", "message": "plain words"}}`:
- 400 for bad uploads (wrong type, larger than 20 MB, no spec and no drawing);
- 404 for unknown runs or nodes;
- 409 when a run is already running (one at a time, to protect the budget);
- 502 when the Claude API fails after the SDK's retries, with the stage named.

### 7.3 Job runner (`app/jobs.py`)
- **Execution:** a single-worker `ThreadPoolExecutor`. One run at a time keeps cost and rate limits predictable.
- **Stages:** the runner calls the existing stage functions in `pipeline/run.py` order. It needs a small refactor: `run.main` → `run.execute(case_dir, out_dir, on_event)` that the CLI and the app both call. Then ⑧ enrich runs, and finally the background build of the run's graph payloads (§6).
- **Events:**
  - `on_event(stage, status, detail, counts)` writes `run.json` and pushes onto an `asyncio.Queue` per run;
  - SSE subscribers read the queue;
  - a reconnecting client first receives the current `run.json`.
- **Case folder:** uploads go to `out/<run_id>/input/`, laid out like a kit case folder (`spec.md`, `exploded_view.png`), so the pipeline needs no change to read them.
- **Preloaded runs:** any `out/<case>/` with a `submission.json` gets a `run.json` with `preloaded: true` at startup. Enrichment and graph payloads are built if missing.

## 8. Voice: ElevenLabs through the backend (`app/voice.py`)

The browser never talks to ElevenLabs directly, so the key stays on the server.

**Speech to text (push-to-talk)**
1. The client records with `MediaRecorder` (`audio/webm;codecs=opus`; Safari: `audio/mp4`) while the mic button is held, or while Space is held with the Ask panel focused. A level meter shows that it is listening. The cap is 60 s.
2. On release, the client posts the blob to `POST /api/voice/stt`.
3. The server calls `POST https://api.elevenlabs.io/v1/speech-to-text` (header `xi-api-key`, multipart):
   - `file`: the recording;
   - `model_id=scribe_v2`;
   - `language_code=en`;
   - `keyterms`: about 50 terms from the run, so regulation vocabulary is recognised: regulation numbers, function names from the profile, defined terms from the graph, e.g. "retro-reflector", "S3", "Annex 8".
4. It returns `{text}` from the response's `text` field. The client puts the text in the prompt bar, sends it to `/ask` automatically, and keeps it editable for the next turn.

**Text to speech**
1. When the ⑨ answer stream ends, the client strips the citation tags and posts the text to `POST /api/voice/tts`.
2. The server streams `POST https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}/stream?output_format=mp3_44100_128` with `{"text", "model_id"}` back to the client. Pick the lowest-latency TTS model available to the account: list `GET /v1/models` once and choose one with `can_do_text_to_speech`.
3. The client plays the audio through an `<audio>` element fed by the stream (MediaSource, falling back to a blob URL), with stop and mute controls. Mute is remembered in `localStorage`.
4. The text answer always appears first; audio is an addition, never the only channel.

**Failure handling**
- `/api/voice/*` returns 503 with a plain message when ElevenLabs fails or the credit runs out.
- The client then hides the mic for the session and shows "Voice is unavailable, typing still works".
- Timeouts: 15 s for speech-to-text, 10 s to the first audio byte.

**Notice next to the mic:** "Voice is processed by ElevenLabs."

## 9. Client (`web/`)

### 9.1 Stack
- React 18 + Vite + TypeScript, React Router.
- TanStack Query for fetching and caching.
- `pdfjs-dist` for the viewer.
- `sigma` + `graphology` for the graphs.
- No UI kit: the design tokens below as CSS variables plus a small set of own components, to get the Tesla-like restraint.

### 9.2 Design tokens (`web/src/styles/tokens.css`)
```css
:root {
  --ink: #171A20; --ink-2: #393C41; --ink-3: #5C5E62; --ink-4: #8E8E8E;
  --ground: #F4F4F4; --surface: #FFFFFF; --line: #E5E5E5;
  --action: #3E6AE1; --action-ink: #FFFFFF;
  --sev-5: #B3261E; --sev-4: #D9480F; --sev-3: #B08900; --sev-2: #5C5E62; --sev-1: #8E8E8E;
  --radius: 4px; --gap: 8px;
  --font: "Inter", system-ui, sans-serif; --mono: "JetBrains Mono", ui-monospace, monospace;
  --t-12: 12px; --t-14: 14px; --t-16: 16px; --t-20: 20px; --t-28: 28px; --t-40: 40px; --t-64: 64px;
}
[data-theme="dark"] { --ink: #FFFFFF; --ink-2: #D0D1D2; --ink-3: #A2A3A5; --ground: #000000; --surface: #171A20; --line: #2A2D33; }
```
Contrast to check before shipping: `--ink-3` on `--ground`, `--sev-3` on white (use dark text on yellow chips), every severity chip with its number. The graph and viewer use the dark theme.

### 9.3 Component tree
```
App
├─ Landing (/)                     Hero(UploadBox) · AppPreview · AgentCards · RunTimeline · ResultsStats · HowItWorks · CitationReceipt
├─ Shell (sidebar + status line)
│  ├─ NewAnalysis (/new)           UploadBox → RunProgress(SSE stages, cost)
│  ├─ Runs (/runs)                 RunTable
│  ├─ Requirements (/runs/:id)     StatCards · FilterBar · PhaseTimeline[PhaseGroup[RequirementRow]] · SourcePanel
│  │     RequirementRow            #priority · summary · SeverityChip · PhaseChip · reg+para (mono) · expand: original text, test, applies to
│  │     SourcePanel               PdfViewer(page, boxes) · ParagraphMeta · Definitions · References · prev/next
│  ├─ Profile (/runs/:id/profile)  ProfileCards · RegulationDecisions
│  ├─ Ask (/runs/:id/ask)          PromptBar(text + MicButton) · SuggestionChips · AnswerCard[CitationChip] · FocusCard
│  ├─ Graph (/runs/:id/graph)      ViewToggle(Structure|Meaning) · SigmaCanvas · NodePopover · Legend · Filters · GraphChat
│  └─ Changes (/changes/:case)     ChangeList · SideBySideText
└─ AskSlideOver (global, opens from any run screen)
```

### 9.4 Screen states
- **Every list and graph** has 4 states: loading (skeleton rows, no spinners), empty (one line plus an action), error (plain message plus retry), loaded.
- **Requirements while a run is still enriching:** the list shows ⑥ output in regulation order with a quiet banner "Adding summaries and priorities…", then re-sorts once.
- **Source panel without boxes:** the page with a banner "Paragraph position not available; showing page 46" (NFR-5).

### 9.5 PDF viewer details
- Render the page with pdf.js at device pixel ratio, then draw an absolutely positioned overlay of rectangles: `x * scale`, `(y) * scale` (both PDF and pdf.js viewport use the same top-left origin after `viewport.convertToViewportRectangle`). Fill `rgba(62,106,225,0.18)`, 2 px left bar in `--action`.
- Scroll so the first box is a third of the way down the viewport.
- For multi-page paragraphs, render each page in the box list in sequence.
- Lazy-load documents and cache them per regulation (`pdfjs.getDocument` once per file).

## 10. Cost and performance

| Item | Estimate |
|---|---|
| Existing pipeline run ①–⑥ + ranker | about $5.5–6, about 4–5 min (result.md) |
| ⑧ Enrich | about $0.8, about 40 s |
| Ask, per question | about 6k input + 200 output tokens ≈ $0.015 on Sonnet 5.5 |
| Voice, per question | one Scribe transcription (a few seconds of audio) + about 300 characters of speech, from the ElevenLabs credit |
| Graph chat, per question | 2–4 tool rounds ≈ $0.05–0.10 |
| Embedding build (local) | $0, 10–20 min once |
| Structure layout per run | less than 5 s |
| UMAP per run | 5–20 s |

## 11. Testing
- **Backend:** pytest on the retriever (hit@10 set from §5.4), `/api/paragraphs` boxes for the 190 dev citations, priority ordering (pure function), enrich code-side rules, SSE happy path with a fake pipeline.
- **Client:** Playwright smoke test:
  1. open the preloaded dev run;
  2. click the first requirement;
  3. the overlay is visible on the cited page;
  4. ask a typed question and get one citation chip;
  5. open the graph, hover a requirement node and see its popup.
- **Manual:** 30-requirement read of severity/phase, voice in Chrome and Safari, phone width.

## 12. Security and data
- Uploads are stored under `out/<run_id>/input/` only. File names are replaced, type is checked by magic bytes, size is limited to 20 MB.
- PDF route paths are resolved against `regulations/index.json`, so there's no path traversal.
- The Anthropic and ElevenLabs keys stay in the server's `.env` (`ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`) and are never sent to the client. Voice calls go through `/api/voice/*`.
- No telemetry.

## 13. Deployment: Oracle Cloud free tier

- **VM:** an Always Free Ampere (ARM) instance, Ubuntu, with the free block storage. Check the tenancy's current free limits when creating it. Python wheels for `pymupdf`, `torch`/`sentence-transformers` and `umap-learn` exist for aarch64; install them with `uv`.
- **Processes:**
  - `uvicorn app.main:app` behind Caddy (automatic HTTPS on a free domain or the VM's DNS name);
  - Caddy also serves the built client (`web/dist`);
  - a systemd service for the app.
- **Access:** Caddy basic auth on everything, with one password for the team and jury. The regulation PDFs are only reachable after login.
- **Data on the VM:** the kit's `regulations/` PDFs, `data/` (corpus, graph, indexes, LLM cache) and `out/` (runs and uploads). It's copied with `rsync` from a laptop, so the VM never needs the kit's download links.
- **Automatic deletion:**
  - a systemd timer (`flame-purge.timer`) fires at a fixed time after the hackathon (default: 2026-10-26 23:59 local time);
  - it runs `scripts/purge.sh`, which stops the app and deletes `regulations/`, `data/`, `out/` and the LLM cache, then writes a log line;
  - `scripts/purge.sh --now` does the same immediately;
  - backup if the VM is not reachable: delete the instance and its boot volume from the Oracle console.
- **Secrets:** the `.env` is copied with `scp` (mode 600), never committed.

## 14. As built (24 Oct, evening)

Where the build differs from the sections above, and what was measured.

| Area | As built | Why |
|---|---|---|
| Graph layout (§6.1) | Seed positions come from the server (one cluster per regulation); ForceAtlas2 runs in the browser (`graphology-layout-forceatlas2`, 250 iterations) | No Python layout dependency; 350–1,500 nodes lay out in well under a second |
| Hidden parents (§6.1) | With "Other paragraphs" off, each requirement links to its nearest *visible* ancestor | Otherwise requirements lose their edges and drift into a ring |
| Retrieval text (§5.4) | Each paragraph is indexed with its heading path ("Stop lamp › Position › In height") and, for lead-ins under 80 characters, its sub-paragraphs' text | Lead-ins like "In height:" carry no content of their own |
| Fusion (§5.3) | BM25 weight 0.3; top 8 fused matches, then at most 2 graph-expansion paragraphs | Measured best on 16 plain-English dev questions |
| Severity/phase without a model (§3.1) | Keyword rules, labelled "rated by keyword rules" in the UI | The app stays usable offline; the model rates them when a key is set |
| Voice keys | `ELEVENLABS_KEY` (team template) or `ELEVENLABS_API_KEY` | Matches the existing `.env.template` |
| TTS playback (§8) | The client fetches the whole MP3, then plays it | Simpler and works in Safari; first audio a little later than streaming |
| Preloaded run | `out/runs/dev-rear-lamp` = the best upload (v6b, platform F2 0.630) with its saved stages | `out/dev-rear-lamp/submission.json` is a later, weaker run (v7) |

**Measured**
- Highlight boxes: 190/190 expected dev citations have boxes on the cited page; 311/311 v6b requirements resolve to a paragraph (4 via the corrected appendix label).
- `pipeline/run.py` refactor: byte-identical submission to the original code on the same saved stages (319/319).
- Retrieval, hit@10 on 16 hand-written dev questions: embeddings 8, BM25 5, fused 9 before expansion (7 with 2 expansion slots).
- Graph payloads (dev): structure 356 nodes / 449 edges in 0.1 s; meaning 1,874 nodes / 579 edges, 35 s the first time (UMAP), cached after; the job runner builds both at the end of every run.
- Index build: 24,206 base paragraphs embedded locally in ~5 min.

**Not tested here (no keys on this machine):** the ⑧ enrich agent with the model, the ⑨ assistant's model answers, the ⑩ graph-chat tool loop, ElevenLabs speech-to-text and text-to-speech, and a full new run from the browser. All four have offline fallbacks that were tested.
