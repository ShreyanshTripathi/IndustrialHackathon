# Flame web app: high-level design

**Flame** is the web app around the existing pipeline. It wraps the existing pipeline (`pipeline/`) so an engineer can upload a spec and an exploded view and get back a short, prioritised list of the UN Regulation requirements their part must meet. Every requirement opens the exact PDF page with its paragraph highlighted. Around the list sit three ways to explore: a voice/text assistant that answers questions about the regulations, a knowledge-graph view of how the requirements connect, and a "meaning map" of the same requirements laid out by embeddings.

It is built for two audiences at once:
- **The jury on Sunday.** The demo/UI is 20% of the score, and "end to end, every requirement links to its source page" is a hard requirement.
- **Certivity's users.** These are design engineers who are not regulation experts. Every view should answer "what do I have to do, how bad is it if I don't, and by when?"

The detailed design is in [LLD.md](LLD.md), and the build plan is in [PLAN.md](PLAN.md).

## 1. Goals and non-goals

**Goals**
1. **Upload to requirements with no manual steps.** Upload a spec (Markdown, text or PDF) and an exploded view (image), run the pipeline, and see the requirements. Progress shows live while the run takes about 4–5 minutes.
2. **A list a non-expert understands.** Each requirement has:
   - a one-line plain-language summary;
   - a severity score (1–5) with its reason;
   - the development phase by which it must be met.

   The list is ordered by priority: earlier phase first, then higher severity.
3. **Every requirement traceable.** Clicking one opens the regulation PDF at the cited page, with the paragraph highlighted and its regulation, version, page and paragraph shown.
4. **An assistant you can talk to.** Typed or spoken questions get short, plain answers. Every claim cites a paragraph you can click.
5. **Two graph views of the same requirements.**
   - **Structure:** the regulation hierarchy and cross-references.
   - **Meaning:** paragraphs placed by text embeddings, so similar obligations sit together.

   Requirement nodes are marked. Hovering shows a plain-language popup. A chat panel next to the graph answers questions and highlights the nodes it talks about.
6. **Looks finished.** A Tesla-inspired visual language (§6) on Volty's information architecture (§5).

**Non-goals (for the hackathon)**
- Accounts, multi-user workspaces, permissions. One local user.
- Editing requirements in the UI. Read-only, plus export.
- Changing what is scored. The submission file stays exactly as the pipeline writes it. Everything the UI adds goes into separate files (`07_enriched.json`, indexes).
- Keeping the regulation data after the hackathon. It is licensed for the hackathon only (`LICENSE-DATA.md`). The demo runs on an Oracle Cloud free-tier VM behind a password, and a timer deletes the PDFs, parsed texts, indexes and uploads automatically after the hackathon (LLD §13).

## 2. Users and main flows

**Primary user:** a component design engineer at an automotive supplier ("I designed a rear lamp, what do I have to meet?").
**Secondary user:** the homologation or regulatory engineer who checks the list.

| Flow | Steps |
|---|---|
| **F1 Analyse a part** | Land on the start page → drop in the spec and drawing → watch the 7 pipeline stages tick through → land on the prioritised requirement list. |
| **F2 Check a requirement** | Click a requirement → the PDF opens at the paragraph, highlighted → read the plain summary, severity reason and suggested test → go to the next one. |
| **F3 Ask** | Hold the mic (or type) → "What does the stop lamp need to pass for heat?" → a spoken short answer, with 1–3 clickable citations → follow-up question. |
| **F4 Explore** | Open the graph → see the requirement nodes lit up inside their regulations → hover for summaries → ask in the side chat "which requirements depend on Annex 8?" → the graph highlights the answer. |
| **F5 Demo mode** | Open a finished run (dev rear lamp, held-out front bumper) instantly from the run list, so the live demo never waits on a 5-minute pipeline. |

## 3. Functional requirements

IDs are referenced in the LLD and the plan. Priorities: **P0** must be in the Sunday demo, **P1** should be, **P2** if time allows.

### Upload and runs
- **FR-1 (P0)** Upload a spec (`.md`, `.txt`, `.pdf`) and one or more drawings (`.png`, `.jpg`). Pasting spec text is also accepted.
- **FR-2 (P0)** Start a pipeline run. Show stage-by-stage progress (① profile … ⑥ verify, ⑧ enrich) with live counts ("4 regulations selected", "311 requirements") and the running cost.
- **FR-3 (P0)** Open earlier runs from a run list, including preloaded ones (F5).
- **FR-4 (P1)** Show the product profile the pipeline understood: functions, parts, electronics, assumptions. It explains why regulations were chosen.
- **FR-5 (P1)** Export the requirement list as the platform's `submission.json` (unchanged), as CSV, and as a printable PDF report.

### Requirement list (the core screen)
- **FR-6 (P0)** List every requirement with: plain-language summary, severity (1–5), phase, regulation and paragraph, and the original regulation text on expand.
- **FR-7 (P0)** Default order is priority: phase first (earlier is more urgent), then severity (higher first), then regulation order. Show the order as a numbered list grouped under phase headings (a timeline, like Volty's "agent's plan").
- **FR-8 (P0)** Severity rubric, shown to the user. Each requirement shows its one-line reason.

  | Score | Meaning | Examples |
  |---|---|---|
  | 5 | Safety-critical performance | luminous intensity limits, visibility angles, pedestrian HIC limits |
  | 4 | Blocks type approval if failed | colour limits, EMC limits, required test results |
  | 3 | Installation or integration constraint | mounting height, spacing, electrical connections |
  | 2 | Marking or documentation | approval mark, trade name, space for markings |
  | 1 | Optional or advisory | "may", permissions |

- **FR-9 (P0)** Phases (by when the requirement must be met), each with a one-line reason per requirement:

  | Phase | Name | Typical requirements |
  |---|---|---|
  | 1 | Concept and architecture | which functions or devices are mandatory, device categories, positions on the vehicle that fix packaging |
  | 2 | Detailed design (before design freeze) | geometry, materials, optics, colour, electrical design, space for markings |
  | 3 | Design verification (before submitting for approval) | photometric, colorimetric, EMC and environmental tests the part must pass |
  | 4 | Type approval | approval marking, documents |
  | 5 | Series production | conformity of production |

  Where a regulation's transitional provisions give a legal date (e.g. "as from 1 September 2026…"), the requirement also shows a deadline chip (P2).
- **FR-10 (P0)** Filter by regulation, phase and severity, and search the text.
- **FR-11 (P1)** Summary cards above the list: total requirements, regulations, "must be met at concept stage", "severity 5", pages cited.
- **FR-12 (P1)** Each requirement shows its suggested verification (`test_case`) and "applies to" part.

### Source viewer
- **FR-13 (P0)** Clicking a requirement opens the cited PDF (base version) at the cited page, with the paragraph's lines highlighted, in a side panel next to the list on wide screens or full screen on narrow ones.
- **FR-14 (P0)** The viewer header shows regulation, version, page and paragraph. Arrows step through the requirements in priority order without closing the viewer.
- **FR-15 (P1)** Definitions and references in the highlighted paragraph are listed under the viewer with links (from the graph).

### Assistant (voice and text)
- **FR-16 (P1)** Ask by typing or by voice (push-to-talk). The answer is shown in text and optionally read aloud.
- **FR-17 (P1)** Answers come from the regulations, not general knowledge. Each answer cites 1–3 paragraphs as clickable chips that open the source viewer. If the regulations don't answer the question, it says so.
- **FR-18 (P1)** Answers are short (2–4 sentences, plain words), unless the user asks for detail.
- **FR-19 (P1)** Context-aware: if a requirement or graph node is selected, the question is about it first ("what does this mean?").
- **FR-20 (P2)** Suggested questions as chips, as on Volty's agent page.

### Knowledge graph views
- **FR-21 (P1)** **Structure view:** the case's regulations as clusters. Nodes are regulation → section → paragraph; edges are hierarchy, cross-references and links between regulations. Requirement paragraphs are drawn distinctly (filled, sized by number of requirements, coloured by severity); other paragraphs are dimmed.
- **FR-22 (P1)** Hovering a node shows a popup with its label, the plain-language summary of its requirements, severity and phase. Clicking opens the source viewer.
- **FR-23 (P2)** **Meaning view:** the same paragraphs placed by text embedding (2-D projection), with lines to their nearest neighbours. Requirement nodes are marked the same way. It shows which obligations say similar things across regulations.
- **FR-24 (P1)** A chat panel beside either view. Answers can highlight nodes and move the camera to them ("show everything about the retro-reflector").
- **FR-25 (P2)** Filters: show or hide regulations, edge types, non-requirement paragraphs.

### Regulation changes (sub-goal, P2)
- **FR-26 (P2)** A page listing the sub-goal's changes (modified / removed / added) with reason, old and new text side by side, and links to both PDF versions.

## 4. Architecture

```
┌──────────────────────────── Browser (React + Vite) ────────────────────────────┐
│ Start / upload │ Run progress │ Requirements + PDF viewer │ Ask │ Graph + chat │
│   pdf.js (highlight overlay) · sigma.js (WebGL graph) · mic capture + player   │
└───────────────▲───────────────────────────────▲────────────────────────────────┘
                │ REST + Server-Sent Events     │ static files (PDFs, graph JSON)
┌───────────────┴───────────────────────────────┴────────────────────────────────┐
│ FastAPI backend (app/)                                                         │
│  runs API ── job runner (thread pool) ── existing pipeline stages ①–⑥          │
│                                   └──── ⑧ enrich agent (summary, severity, phase)
│  source API (PDF, paragraph text + line boxes)                                 │
│  ask API ── retriever (graph scope + BM25 + embeddings, fused) ── ⑨ ask agent    │
│  graph API (structure view, meaning view) ── ⑩ graph chat agent (tools)        │
│  voice API (proxy) ── ElevenLabs speech-to-text (Scribe) and text-to-speech    │
└───────────────▲─────────────────────────────────────────────▲──────────────────┘
                │                                             │
   data/corpus.jsonl · data/graph.json · data/index/ (BM25, embeddings, 2-D layout)
   out/<run_id>/01…07 stage files · regulation PDFs (local, licensed for the hackathon)
                                                              │
                                     Anthropic API (Claude) via pipeline/llm.py
```

**Components**

| Component | Responsibility | New or existing |
|---|---|---|
| Pipeline ①–⑥ | spec + drawing → verified, ranked requirements | existing (`pipeline/`) |
| ⑧ Enrich agent | plain-language summary, severity + reason, phase + reason per requirement; order by priority | **new** |
| ⑨ Ask agent | answers a question from retrieved paragraphs, cites them, keeps it short | **new** |
| ⑩ Graph chat agent | answers questions about the graph using graph tools, returns node ids to highlight | **new** |
| Retriever | scopes to the case's regulations, combines graph expansion, BM25 and embeddings | **new** |
| Index builder (offline) | BM25 index, paragraph embeddings, 2-D layout, nearest-neighbour edges | **new** |
| Ingest | add line boxes per paragraph so the viewer can highlight them | **change** |
| Job runner | runs the pipeline in the background, streams progress | **new** (wraps `pipeline/run.py`) |
| FastAPI app | REST + SSE, serves PDFs and graph payloads | **new** (`fastapi` and `uvicorn` are already dependencies) |
| Web client | screens in §5, design system in §6 | **new** |

**Key decisions**

| Decision | Choice | Why |
|---|---|---|
| Keep the scored output separate | Enrichment goes into `07_enriched.json`; `submission.json` is untouched | The UI can never lower the score |
| Retrieval for the assistant | Hybrid: graph scope + BM25 + embeddings, fused with reciprocal rank fusion | Regulation questions mix exact terms ("S3", "Annex 8") that BM25 finds and paraphrases that embeddings find. The graph adds definitions and referenced paragraphs that neither finds. |
| Embeddings | Local open-source model by default (e.g. `bge-small-en-v1.5`); Voyage optional | $0, no new account, and the texts never leave the machine (licence). Voyage is a switch if quality is too low. |
| Voice | ElevenLabs: Scribe speech-to-text and streaming text-to-speech, called through the backend | We have ElevenLabs credit; better recognition of regulation vocabulary ("S3 category", "Annex 8") through key terms; a natural voice; works in every browser that can record audio. The key stays on the server. |
| Graph rendering | sigma.js (WebGL) + graphology, layout precomputed on the server | About 3,000 paragraph nodes per case (dev: R48 1,210, R10 853, R150 510, R148 392) is too many for SVG, but easy for WebGL |
| PDF display | pdf.js, with an overlay drawn from stored line boxes | Exact paragraph highlight without text search |
| Progress | Server-Sent Events | One-way stream, simpler than WebSockets, works through proxies |
| Model | Claude Opus 5.5 for ⑧ and ⑩; **Claude Sonnet 5.5** for the ⑨ assistant, so spoken answers start fast. All through `pipeline/llm.py` (cache, cost tally, refusal fallback) | One client, one cost ledger; Sonnet where latency matters most |

## 5. Information architecture (follows Volty)

Volty's structure maps directly onto this app:

| Volty | This app |
|---|---|
| Landing: hero with one input, app preview window, "AI agents" cards, "a day, handled" timeline, stats row, how it works, proof with a receipt card | Landing: hero "Drop in a part. Get every UN requirement, cited to the page." with the upload box. An app preview, the 7 agents as cards, a "one part, analysed" timeline, measured results (dev F2, page recall), how it works in 3 steps, proof as a citation receipt (regulation, version, page, paragraph, PDF checksum). |
| App shell: left sidebar with grouped sections, a status line on top ("Live · next settlement 14:00") | Same shell. Sidebar: **Analyse** (New analysis, Runs) · **Results** (Requirements, Source, Product profile) · **Explore** (Ask, Graph: Structure, Graph: Meaning) · **More** (Regulation changes, Export). Status line: "Rear lamp · run complete · 311 requirements from 4 regulations · $5.82". |
| Overview: stat cards, a big live visual with a side list, "your agent's plan" timeline | Requirements: stat cards, the priority list grouped by phase (the plan timeline), the PDF viewer as the side panel |
| AI agent: "Tell your agent… type or speak", suggestion chips, before→after card, "today, in plain words" | Ask: "Ask about the regulations, type or speak", suggestion chips, answer card with citation chips, a "this requirement in plain words" card when one is selected |
| Live map: full-bleed visual, layer toggles, time scrubber, "right now" side panel, legend, privacy note | Graph: full-bleed canvas, Structure/Meaning toggle, filters, chat side panel, legend, a note on what the colours mean |
| Public record: verify an hour | Source viewer: verify a requirement (the receipt) |

Screens (wireframes and states in the LLD §9):
1. **Landing** (`/`)
2. **New analysis** (`/new`): upload, then the progress view
3. **Requirements** (`/runs/:id`): list + source viewer
4. **Product profile** (`/runs/:id/profile`)
5. **Ask** (`/runs/:id/ask`), also a slide-over available on every run screen
6. **Graph** (`/runs/:id/graph?view=structure|meaning`)
7. **Runs** (`/runs`)
8. **Regulation changes** (`/changes/:case`, P2)

## 6. Visual language: Tesla-inspired

The look follows Tesla's public design language: monochrome, quiet, lots of space, one strong action colour. It uses no Tesla name, logo, fonts or imagery; those are Tesla's trademarks and assets.

| Element | Choice |
|---|---|
| Palette | Near-black `#171A20` for text and dark surfaces; greys `#393C41`, `#5C5E62`, `#8E8E8E`; light ground `#F4F4F4`, surface `#FFFFFF`; one action blue `#3E6AE1` for primary buttons and links. Dark mode for the graph and viewer: ground `#000000`, surface `#171A20`. |
| Severity scale | One hue ramp that changes in lightness, so it reads without colour vision: 5 `#B3261E`, 4 `#D9480F`, 3 `#B08900`, 2 `#5C5E62`, 1 `#8E8E8E`. Always shown with the number, never colour alone. |
| Phase colours | Neutral greys with a phase number badge; the timeline line is the only ornament |
| Type | A free geometric sans close to Tesla's: **Inter** (body, UI) with tight tracking for display sizes; **JetBrains Mono** for paragraph numbers and IDs. Sizes 12 / 14 / 16 / 20 / 28 / 40 / 64. |
| Shape | Buttons 4 px radius, 40 px tall, full-width on mobile; cards without borders, separated by space or a 1 px `#E5E5E5` line; no drop shadows except on popovers. |
| Motion | 200–300 ms ease-out fades and slides; the graph camera eases to selected nodes; nothing bounces. |
| Imagery | Large, calm hero: the exploded-view drawing itself, on a light ground, slowly assembling (CSS transform), instead of stock imagery. |
| Copy | Sentence case, short, plain. "3 must be met at concept stage", not "CRITICAL REQUIREMENTS". |

Accessibility: text contrast at least 4.5:1, everything reachable by keyboard, focus rings visible, voice is never the only way to do something.

## 7. Non-functional requirements

| ID | Requirement |
|---|---|
| NFR-1 | A full new run finishes in under 7 minutes on the dev case; preloaded runs open in under 1 second. |
| NFR-2 | The assistant's first words appear within 3 seconds of the end of a question (streamed). |
| NFR-3 | The graph stays smooth (≥ 30 fps pan/zoom) at 5,000 nodes on a laptop. |
| NFR-4 | Cost per new run, including enrichment, at most ~$7. Cost per assistant answer below ~$0.05. The UI shows the running cost. |
| NFR-5 | No requirement without a source. If a citation can't be resolved to a paragraph with boxes, the UI shows the page without a highlight and flags it; it never hides it. |
| NFR-6 | The regulation PDFs and texts stay on the Flame server (Oracle VM), apart from what the pipeline already sends to the Claude API. Embeddings are computed on the server. Spoken questions go to ElevenLabs for transcription, and answers go to ElevenLabs to be spoken; the UI says so next to the mic. The server is password-protected and its regulation data is deleted automatically after the hackathon. |
| NFR-7 | Works in current Chrome, Edge, Safari and Firefox (voice needs microphone permission); usable at 390 px width (list and viewer stack). |

## 8. Risks

| Risk | Mitigation |
|---|---|
| Little time: held-out uploads close Sunday 13:00, pitch at 15:00 | P0 only depends on files the pipeline already writes. P1/P2 are cut in a fixed order (PLAN.md). |
| A live pipeline run fails or is slow during the pitch | Demo mode: preloaded runs (F5). A live run is optional and started before speaking. |
| Enrichment labels (severity, phase) are judgement calls with no answer key | Show the rubric and the reason per requirement. Label it "suggested". Check a sample by hand on the dev case. |
| Assistant answers from general knowledge or cites wrongly | The prompt allows only retrieved paragraphs; code checks every cited paragraph id was in the retrieved set and drops answers that cite anything else. |
| Paragraph boxes missing for a few paragraphs (parser gaps) | Fall back to the page view, flagged (NFR-5) |
| Speech service slow or out of credit (ElevenLabs) | Typing always works; text answers appear before the audio; if a voice call fails, the answer is shown as text with a quiet notice |
| Licence of the regulation data | Oracle VM behind a password; an automatic deletion timer removes the data after the hackathon, with a manual "delete now" script as backup |

## 9. Decisions

| Decision | Choice |
|---|---|
| Product name on screen | **Flame** |
| Embedding model | local `bge-small-en-v1.5`, on the server |
| Assistant model (⑨) | Claude Sonnet 5.5, low effort |
| Voice | ElevenLabs Scribe (speech-to-text) and streaming text-to-speech |
| Hosting | Oracle Cloud free tier (Ampere ARM VM), password-protected, data deleted automatically after the hackathon |
| Severity and phase | assigned by ⑧ with the rubric, reason shown |
