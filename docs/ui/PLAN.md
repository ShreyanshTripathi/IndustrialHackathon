# Flame web app: build plan

How to build [HLD.md](HLD.md) / [LLD.md](LLD.md) before the Sunday pitch (15:00), without endangering the held-out upload (08:00–13:00, last upload counts). Work is ordered so that each phase ends with something demoable, and later phases can be cut without breaking earlier ones.

## Ground rules
- **The pipeline comes first on Sunday morning.** From 08:00 to 13:00, whoever runs the held-out case does nothing else. UI work in that window must not touch `pipeline/` stage logic, except through the hooks made in phase 0.
- **The scored files never change.** The UI reads `submission.json`; enrichment writes `07_enriched.json`.
- **Demo from preloaded runs.** A live run in the pitch is a bonus, started before speaking.
- **Every phase ends with a working demo and a commit** on a `ui` branch, merged to `main` only when it runs.

## Phases

### Phase 0: foundations (about 2 h) — P0
| # | Task | Done when |
|---|---|---|
| 0.1 | Refactor `pipeline/run.py` into `execute(case_dir, out_dir, on_event)`; the CLI calls it, behaviour unchanged | `uv run python -m pipeline.run cases/dev-rear-lamp --resume` gives a byte-identical `submission.json` |
| 0.2 | Ingest: store line boxes; fix the appendix label bug; rebuild corpus and graph | 190/190 dev citations have boxes on the cited page; `check` still passes |
| 0.3 | FastAPI skeleton: `/api/runs`, `/api/runs/{id}`, `/api/paragraphs/{node}`, `/files/...`; preloaded runs discovered from `out/` | `curl` returns the dev run and one paragraph with boxes |
| 0.4 | Vite + React + TS skeleton, router, tokens.css, Inter + JetBrains Mono, app shell (sidebar, status line) | Shell renders in light and dark |

### Phase 1: requirements and source viewer (about 4 h) — P0, the core demo
| # | Task | Done when |
|---|---|---|
| 1.1 | `pipeline/enrich.py` (⑧): schema, rubric prompt, batching, code-side rules, priority | `07_enriched.json` for dev with all 311 requirements rated; 30 read by hand, reasons sensible |
| 1.2 | `/api/runs/{id}/requirements` (sorted), `/profile`, `/export` (submission + CSV) | JSON in priority order |
| 1.3 | Requirements screen: stat cards, phase timeline groups, rows, filters, search, expand | List matches the HLD wireframe at 1440 and 390 px |
| 1.4 | Source panel: pdf.js page, box overlay, meta, definitions/references, prev/next | Clicking any of 10 random requirements highlights the right lines |
| 1.5 | Run upload + progress: `POST /api/runs`, job runner, SSE; NewAnalysis screen | A fresh dev run from the browser completes and opens its list (cache makes it nearly free) |

**Demo checkpoint A:** upload → progress → prioritised list → click → highlighted PDF. This alone covers the judged "end to end, every requirement links to its source page".

### Phase 2: graph structure view + graph chat (about 3 h) — P1
| # | Task | Done when |
|---|---|---|
| 2.1 | `graph_view.py` structure payload + server-side layout, cached per run | Dev payload under 1,500 nodes, builds in under 5 s |
| 2.2 | Graph screen: sigma canvas, styling by severity, legend, filters, hover popover, click → source | Hover shows the plain summary; 30+ fps when panning |
| 2.3 | `graph_chat.py` (⑩) with tools; chat panel; highlight + camera focus | "Show everything about the retro-reflector" lights the right nodes |

**Demo checkpoint B:** the graph tells the story "4 regulations, and here is where your 311 requirements live".

### Phase 3: assistant with RAG + voice (about 3 h) — P1
| # | Task | Done when |
|---|---|---|
| 3.1 | `pipeline/index.py`: BM25 index (all base paragraphs) | built in under 1 min |
| 3.2 | Embeddings with `bge-small-en-v1.5` (local); same interface for Voyage | `embeddings.npy` for about 28k paragraphs |
| 3.3 | `pipeline/retrieve.py`: scope, BM25, embeddings, graph expansion, RRF; hit@10 eval on 20 dev questions | fusion hit@10 at least as good as either retriever alone; numbers in the README |
| 3.4 | `app/ask.py` (⑨) streamed, citation check | answers cite only retrieved paragraphs; "not covered" works |
| 3.5 | Ask screen + slide-over: prompt bar, chips, answer card, citation chips → source panel | typed Q&A works end to end |
| 3.6 | Voice via ElevenLabs: `app/voice.py` proxy (Scribe speech-to-text with run key terms, streaming text-to-speech), push-to-talk recording, playback, mute, failure fallback | a spoken question in Chrome and Safari is transcribed correctly, including "S3" and "Annex 8", and the answer is read aloud |

**Demo checkpoint C:** "What does the stop lamp have to pass for heat?" spoken, answered in two sentences, citation opens the PDF.

### Phase 4: meaning view (about 2 h) — P2
| # | Task | Done when |
|---|---|---|
| 4.1 | UMAP layout + kNN edges per run from stored embeddings | payload under 2,500 nodes, built in under 20 s |
| 4.2 | View toggle, cluster labels, same popover and chat | requirement nodes visible as clusters across regulations |

### Phase 5: landing page and polish (about 2 h) — P1 for the pitch
| # | Task | Done when |
|---|---|---|
| 5.1 | Landing page in Volty's structure (hero with upload, app preview, 7 agents, timeline, measured results, how it works, citation receipt) | reads well at 1440 and 390 px; no invented numbers, only measured ones from result.md |
| 5.2 | Empty, loading and error states; keyboard focus; contrast check | the LLD §9.4 states exist; contrast passes |
| 5.3 | Playwright smoke test (LLD §11) | green |
| 5.4 | Preload the held-out run after 13:00; rehearse the demo path | the 3-minute demo runs without waiting |
| 5.5 | Deploy to the Oracle free-tier VM (LLD §13): Caddy + basic auth, systemd service, `rsync` data, `.env` | the jury URL works from a phone, behind the password |
| 5.6 | Purge timer and `scripts/purge.sh --now`; test on a copy of the data folder | a dry run deletes the copy and logs it |

### Phase 6: if time remains — P2
- Regulation changes page (FR-26).
- Deadline chips from transitional provisions (FR-9).
- PDF report export.

## Schedule

| When | Person A (pipeline owner, Arjit) | Person B (UI owner) |
|---|---|---|
| Sat evening | 0.1, 0.2 (pipeline hooks, boxes) | 0.3, 0.4, start 1.3 with dev data; create the Oracle VM |
| Sat night | 1.1 enrich, 1.2 API | 1.3, 1.4, 1.5 → **checkpoint A** |
| Sun 06:00–08:00 | rest; prepare held-out run | 2.1–2.2 |
| Sun 08:00–13:00 | **held-out run, review, uploads only** | 2.3 → **checkpoint B**, then 3.1–3.5 |
| Sun 13:00–14:30 | preload held-out run (5.4), deploy (5.5–5.6), pitch numbers | 3.6 voice → **checkpoint C**, 5.1–5.2 |
| Sun 14:30–15:00 | rehearse | rehearse |

Cut order if behind: phase 6 → phase 4 (meaning view) → voice (3.6, keep typed Ask) → graph chat (2.3, keep hover). Checkpoint A is never cut.

## Budget
About $30 of $150 is spent (result.md). This plan adds:
- enrich for dev + held-out, about $2;
- a few fresh test runs, about $12;
- Ask (on Sonnet) and graph-chat development and demo, about $4.

Voice uses the separate ElevenLabs credit.

That's about $20 in total, leaving about $100 for held-out reruns.

## Decisions

Made: the name is **Flame**; local embeddings (`bge-small-en-v1.5`); Sonnet 5.5 for the assistant; ElevenLabs for voice; Oracle Cloud free tier for hosting, with automatic deletion.
