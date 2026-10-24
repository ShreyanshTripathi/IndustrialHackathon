# Talk to Your Building: high-level design (HLD)

| | |
|---|---|
| Project | Synera Track 01, Industrial Agents Hackathon, Munich, 24–25 Oct 2026 |
| Deadline | Code freeze **Sun 25 Oct 13:00** |
| Companion docs | [LLD.md](LLD.md) (module-level design) · [UI-UX.md](UI-UX.md) (screens and visual system) · [../notes/synera/case-explained.md](../notes/synera/case-explained.md) (the challenge) · [../notes/synera/build-plan.md](../notes/synera/build-plan.md) (timeline) |
| Kit | [../industrial-agents-hackathon-2026/](../industrial-agents-hackathon-2026/) (data, official scorer, starter agent) |

---

## 1. Purpose and scope

Build an app that gives any building a map you can **talk to**. You load a floor plan, and anyone can ask where things are, how to get there, and what changes when the building changes. The app has to work on the 280 kit buildings, on an unseen building released on Sunday, and on buildings created from floor-plan images.

**In scope:** Levels 1–4 of the brief, with one Level 5 extension (industrial logistics), a web app with voice, a one-command benchmark runner, and the submission package (CSV, video, write-up).

**Out of scope:** AR, capture on site with a phone, real authentication or multi-tenant hosting, and production deployment.

---

## 2. Users and scenarios

| User | Typical request | What the system must do |
|---|---|---|
| First day at work | "Where do I get coffee?" | Map vague words to room types or assets; ask for the start point only when it's needed |
| Wheelchair user | "Take me to Lab 1.12" | Use step-free routes **every time** after it's mentioned once |
| Service technician | (voice) "Which press is line 4, how do I get there?" | Voice in and out; short landmark directions |
| Facility manager | "Close the east lift" / "Add a door between 2.03 and 2.04" | Preview the change, confirm, apply, explain the effect on routes |
| Forklift driver | "Aisle 4 is blocked. Fastest route to dock B?" | Route a vehicle profile around blocked zones |
| Benchmark harness | 145 templated questions + the Sunday building | Exact numeric answers, one `Answer:` line, no human in the loop |

---

## 3. Requirements

### 3.1 Functional

| ID | Requirement | Level |
|---|---|---|
| F1 | Find rooms and assets by name, room number, type or vague description, on a chosen floor or all floors | 1 |
| F2 | Show results on a 2D floor view | 1 |
| F3 | Shortest route A→B with followable directions and total metres; step-free option; multi-stop tours | 2 |
| F4 | Closures (lift, stairs, door, room) that re-route live | 2 |
| F5 | Routing across floors and buildings (stairs, lifts, walkways) | 3 |
| F6 | Answer the 8 benchmark question kinds exactly (area, shared walls, stacking, 3D distance, reachability, errand, what-if door) | 1–3 |
| F7 | Edit the building by conversation (add door, move asset, close area) with preview and confirmation | 4 |
| F8 | Create a building from floor-plan images by conversation, validated before use | 4 |
| F9 | Industrial logistics: vehicle profiles, blocked aisles, docks | 5 |
| F10 | Voice in and out | Interaction |
| F11 | One command produces the answers file for any split or the Sunday building | Submission |

### 3.2 Non-functional

| ID | Quality | Target |
|---|---|---|
| N1 | **Accuracy** | About 100% on train and dev with the deterministic tools; at least 90% end to end through Claude on dev |
| N2 | **Reproducibility** | Same input gives the same numbers; route lengths match the official route model to the centimetre |
| N3 | **Generality** | Nothing hard-coded to test buildings; handles all 4 data sources and the 1,623-space OSM building |
| N4 | **Latency** | First visible feedback (a status or the map highlight) under 2 s; a full simple reply under 6 s; voice round trip under 8 s |
| N5 | **Cost** | Under $0.10 per benchmark question on average; prompt caching on the building summary |
| N6 | **Robustness** | No crash on any of the 280 buildings; API errors degrade into a clear message, not a stack trace |
| N7 | **Safety of edits** | No change to the building without explicit confirmation; every change can be undone |

---

## 4. Architecture

### 4.1 Guiding principle

**Deterministic core, agent on top.** Code is the single source of truth for every fact and number. Claude understands the request, chooses tools, asks questions back and explains the results. It never does arithmetic or invents a room. This is also Synera's own engineering philosophy, which makes it the pitch.

### 4.2 Logical view

```
 ┌───────────────────────────── Presentation ───────────────────────────────┐
 │  Web app (React + SVG map, optional three.js)  ·  Voice (ElevenLabs)     │
 └──────────────▲──────────────────────────────────────────┬────────────────┘
                │ map events, streamed text, audio         │ text, audio
 ┌──────────────┴──────────────── Application ─────────────▼────────────────┐
 │  FastAPI server  ·  Session manager  ·  Voice adapter                    │
 └──────────────┬──────────────────────────────────────────▲────────────────┘
                │ ask(text)                                │ reply + events
 ┌──────────────▼──────────────── Agent ───────────────────┴────────────────┐
 │  Claude (Opus 5.5) tool loop  ·  prompts  ·  reply validator             │
 │  Entry points: chat (Session) │ benchmark answer(dir, question)          │
 └──────────────┬───────────────────────────────────────────────────────────┘
                │ typed tool calls → compact JSON
 ┌──────────────▼──────────────── Core (deterministic) ─────────────────────┐
 │  resolve · queries · geometry · graph · model (BuildingModel + Overlay)  │
 │  builder (Level 4)  ·  logistics (Level 5)                               │
 └──────────────┬───────────────────────────────────────────────────────────┘
                ▼
   building.json · equipment.csv · floor images  (kit / Sunday / generated)
```

### 4.3 Components and responsibilities

| Component | Responsibility | Owns state? |
|---|---|---|
| **model** | Load `building.json` into indexed, immutable objects; apply an **edit overlay** (closures, new doors, moved assets, blocked zones) | Base: no. Overlay: yes, per session |
| **graph** | Build the route graph exactly as the kit specifies, with filters (step-free, minimum door width, closures, blocked zones); cache it per overlay version | Cache only |
| **geometry** | Areas, centroids, shared walls, floor stacking, wall midpoints | No |
| **resolve** | Text such as "Office 0.29 (Ground floor)", "the floor 1" or "fire extinguisher" to ids, or a ranked candidate list | No |
| **queries** | The tools: one per benchmark kind, plus primitives, navigation, edits and view events | No (reads model and overlay) |
| **agent** | Claude tool loop, prompts, benchmark entry point, answer-format validator | Chat history (per session) |
| **server** | HTTP and WebSocket API, sessions, voice proxy, static geometry for the UI | Sessions (in memory) |
| **web** | Render the map from JSON; chat, cards, voice controls | View state only |
| **builder** | Floor-plan image to validated `building.json` (Level 4) | Draft building |
| **logistics** | Vehicle profiles and in-hall obstacle routing (Level 5) | No |
| **evals** | Oracle tool tests, robustness sweep, end-to-end benchmark, interaction scripts | Reports |

### 4.4 Key flows

**A. Benchmark question** (no human, fresh state)
```
evaluate.py ─► answer(dir, q) ─► Claude reads q ─► resolve names ─► kind tool (e.g. shared_walls_count)
            ◄─ reply ◄─ validator checks "Answer:" line ◄─ Claude writes the reply from the tool result
                         └─ invalid → one corrective retry
```

**B. Chat route with a preference**
```
user: "I use a wheelchair, how do I get to the CNC mill?"
  agent: set_preference(step_free) ─► resolve("CNC mill") ─► route(start?, …)
  start unknown → asks "Where are you now?" (one question)
  user: "main entrance" ─► route(step_free=True) ─► show_route ─► UI animates
  reply: one "understood" line + numbered landmark directions + total metres
```

**C. Edit with confirmation**
```
user: "Add a door between 2.03 and 2.04"
  agent: propose_edit(add_door) ─► pending overlay + diff event ─► UI preview card
  reply: "I'll add a 0.9 m door in the middle of the shared wall. Confirm?"
  user: "yes" ─► confirm_edit ─► committed overlay (graph cache invalidated) ─► UI updates
```

**D. Voice turn**
```
mic ─► STT ─► Session.ask ─► streamed reply ─► TTS ─► speaker   (voice mode = short, one step at a time)
```

**E. Level 4 import**
```
upload floor_N.png ─► vision draft (rooms, doors, connectors) ─► scale calibration
  ─► validator (geometry + connectivity) ─► overlay on image ─► fixes by conversation ─► save building.json
```

---

## 5. Data

- **Input format:** the kit's `building.json` (floors, spaces with polygons, openings with width and step-free flag, vertical connectors, assets), plus `equipment.csv` and floor images. All units are metres in one XY frame per building; some Swiss floors are not aligned.
- **Scale:** at most 1,623 spaces, 1,799 openings, 5,250 assets and 10 floors in one building, so the route graph has a few thousand nodes and Dijkstra runs in milliseconds.
- **Runtime state:** an edit overlay per session (an ordered list of operations), a pending overlay for unconfirmed edits, user preferences, the last known location and chat history. Everything is in memory; edited buildings export as `building.json`.
- **Benchmark semantics:** the exact rules behind each question kind were checked against all 653 train and dev questions. See LLD section 4.

---

## 6. Technology

| Layer | Choice | Why |
|---|---|---|
| Core | Python 3.12, shapely, networkx | Same stack as the kit's reference route model, which guarantees matching numbers |
| Agent | Anthropic SDK, `claude-opus-5-5`, `tool_runner`, prompt caching | Starter agent proves the pattern; strongest tool use |
| Server | FastAPI, uvicorn, WebSocket | Async streaming, quick to build |
| Web | React, Vite, TypeScript, SVG; three.js optional; Lovable for scaffolding | Clickable vector map rendered from JSON |
| Voice | ElevenLabs STT/TTS (credits provided); browser Web Speech as fallback | Voice counts toward Interaction |
| Tooling | uv, pytest, ruff; Makefile | One-command runs for judges |

---

## 7. Deployment and runtime

- **Local only:** `make dev` runs the FastAPI server and the Vite dev server on a laptop. The demo video is recorded from that.
- **Benchmark:** `make benchmark DIR=<split or building dir>` wraps the kit's `benchmark.evaluate`, so judges can re-run it unchanged. This is documented in `BENCHMARK.md`.
- **Secrets:** `ANTHROPIC_API_KEY` and `ELEVENLABS_API_KEY` live in `.env`, which git ignores. No keys go in the repo.

---

## 8. Cross-cutting concerns

| Concern | Approach |
|---|---|
| Correctness | Oracle tests over every train and dev question's `inputs`; the route model is reused from the kit, not rewritten |
| Consistency | The server owns all map state; the UI only renders it, so agent and map can't disagree |
| Errors | Core raises `MapError` with a human-readable message, which reaches the model as an `is_error` tool result so it can recover or ask |
| Cost | Compact tool outputs (ids, numbers, short names); the system prompt is cached; the benchmark uses one high-level tool call per question where possible |
| Observability | Every agent turn is logged as JSONL (tool calls, args, results, tokens, latency); benchmark runs write per-question logs for diffing |
| Licensing | Data under CC BY 4.0, ODbL and CC0 per `ATTRIBUTION.md`; anything published from OSM buildings credits OpenStreetMap contributors |

---

## 9. Design decisions

| # | Decision | Alternatives rejected | Reason |
|---|---|---|---|
| D1 | Reuse the starter's route model | Own graph or A* on a grid | Expected answers come from that exact model |
| D2 | One tool per benchmark kind, plus primitives | Only primitives; only regex templates | Exact and cheap on known kinds, flexible for Sunday's wording |
| D3 | Claude stays in the loop for benchmark answers | A pure regex-to-tool pipeline | The rules require answers from the agent; Claude also handles new phrasing |
| D4 | Immutable base building plus edit overlay | Mutating the loaded JSON | What-if, preview, undo and multi-user all come from one mechanism |
| D5 | SVG rendered from polygons | Showing the kit PNGs | Interactive; works for generated and edited buildings |
| D6 | Sessions in memory | A database | Hackathon scope; export to JSON is enough |

---

## 10. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Too few examples for `what_if_door` (4) and `step_free_reachable_count` (2) | 3 test questions plus the Sunday building | Rules come from the README; test on extra synthetic cases; read the Sunday questions carefully |
| Name resolution picks the wrong space (duplicate names such as "Passage", "Foyer") | Wrong answer with no error | Match on name and floor; ranked candidates; log every resolution |
| Sunday building in a new format or with a new question kind | Up to 55 points at risk | Primitive tools; build the Level 4 image path anyway |
| UI work eats core time | Lower correctness | Build order: core and CSV before UI (section 11) |
| Voice latency | Lower Interaction score | Lower effort for chat, streaming TTS, compact tool results |
| Code written before kickoff may be disallowed | Disqualification | These documents are design only. Confirm the rule at kickoff |

---

## 11. Milestones

| # | Milestone | Done when |
|---|---|---|
| M1 | Core and oracle tests | All 8 kinds at about 100% on train and dev `inputs`; warm-up routes match to the centimetre |
| M2 | Benchmark agent | Dev end to end at 90% or better; **first test CSV submitted** |
| M3 | Chat, server and 2D map | Find, route, closures, edits with confirmation work in the browser |
| M4 | Voice | Push-to-talk round trip works on the demo laptop |
| M5 | Level 4 builder | Import a kit image; measured room IoU and route error |
| M6 | Level 5 logistics | Forklift route around a blocked aisle, shown on the map |
| M7 | Submission | `BENCHMARK.md`, final CSV, Sunday answers, video, write-up |

## 12. Open questions for kickoff
1. Is code written before 12:00 Saturday allowed?
2. Sunday building: release time; JSON only or images too; are route paths scored, or only lengths?
3. How is the scripted interaction test run: through our UI, text, or voice?
