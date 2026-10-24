# Synera research brief

> Source: Claude Code session `af8ef3c5`, 23–24 Oct 2026. Saved from the conversation as-is.

## Headline: the Track 01 brief is already public, so no prediction is needed

Synera has posted the full Track 01 student kit on GitHub: **https://github.com/Synera-GmbH/industrial-agents-hackathon-2026**. It was pushed at about 22:00 CEST on 23 Oct 2026, the night before kickoff. The commits come from Tino Bog <tino.bog@synera.io>, and the last one reads "Align README with challenge brief and kickoff deck", so this is the real brief. It could still be tweaked at kickoff. I cloned it to ../industrial-agents-hackathon-2026.

The Tacto track kit is public too: https://github.com/tacto-playground/negotiation-arena-kit ("Tacto Negotiation Arena: brief, API docs, starter kit and data package").

**The challenge is not CAD or CAE.** It is "**Talk to Your Building: Agent-First Indoor Navigation**", an indoor "Google Maps" you talk to, for offices, campuses and factory halls. Any prediction built from Synera's core business (RFQ, design-to-cost, FEA) would have been wrong. The design philosophy is exactly Synera's, though: a deterministic core with an agent on top, and eval-gated scoring.

### What the brief says (all from the repo README)

**Mission:** feed the system a floor plan, it learns the building, and anyone can talk to it. Example users are a service technician, a forklift driver, logistics staff, a wheelchair user, a facility manager and someone on their first day.

**Levels (cumulative):**
1. Locate things on one floor.
2. Route on one floor: step-free, closures, multi-stop tours.
3. Scale to several floors and buildings: stairs, lifts, walkways.
4. Build or update a building from floor plans by conversation ("minutes, not days").
5. Optional, pick one: moving assets (barcode/RFID), several users, forklift/material logistics with blocked aisles, capture on site with a phone, accessibility, presentation (isometric stacked floors, animated routes, voice), or AR.

**Judging (100 points):**

| Part | Points | What counts |
|---|---|---|
| Does it work | 55 | The Sunday benchmark, hidden auto-checks on unseen buildings and questions, and your test-set CSV |
| Interaction | 25 | A scripted conversation with tricky users. Does it ask only what it needs, show what it understood, give directions a person can follow? Voice counts. |
| Creativity | 10 | Level 5 and anything they didn't ask for |
| Demo video + technical write-up | 10 | Clear, convincing, showing the real product |

**Submission and finals:**
- No pitch rooms. Everything is submitted online by code freeze: demo video, technical explanation, and a repo with `BENCHMARK.md` (one command, no manual steps) plus the answers CSV.
- Four finalists pitch at Tacto: 3 minutes plus 1 minute Q&A.
- **Sunday building:** one new, unseen building and a question file arrive shortly before code freeze. Its format will be announced with the release, and they may re-run your command to check.
- The website gives code freeze as Sun 13:00, track judging 13:30 and finals 15:00.

**Data:**
- 280 buildings. Train is 200 (517 benchmark plus 1,761 warm-up questions), dev is 40 (138 plus 369), test is 40 (**145 scored questions, no answers**).
- Sources are Swiss Dwellings, ResPlan, OSM indoor data for Munich (TUM, Airport T2, Pasing Arcaden), and procedural factories and campuses.
- Test procedural layouts are deliberately unseen: bigger halls, L-shaped wings, basements, more cores.
- Each building has `building.json` (spaces with polygons, openings with `width_m` and `step_free`, vertical connectors, assets), `equipment.csv`, and floor PNG/SVG images with and without furniture.
- Units are metres, and all floors share one XY frame (except some Swiss floors).

**Exact route model** (you must reproduce it):
- Nodes are each space's `shapely representative_point()` plus each opening's `position`. Edges run from space to opening, weighted by Euclidean distance.
- Stairs cost 12 m per floor. Lifts cost a 15 m wait plus 6 m per floor.
- Step-free routing drops every edge with `step_free: false`.
- Keep parallel stair and lift edges (it is a MultiGraph).
- All entrances meet at one "outside" node at zero cost.
- `starter_agent/building_map.py` implements this exactly with networkx.

**Test question mix (145):**

| Kind | Count | Scoring |
|---|---|---|
| floor_area_total | 33 | ±5% |
| shared_walls_count | 26 | exact; ≥1 m of outline within 0.35 m, excluding corridors, stairwells and lifts |
| largest_room | 21 | room named before any runner-up, area ±5% |
| errand | 20 | ±1%, at least ±1 m |
| wide_delivery_count | 18 | exact; door width and lift-only reachability |
| straight_line_3d | 15 | centroid at floor elevation, ±2% |
| room_stacked | 9 | the room on the next floor whose outline covers most of this one |
| what_if_door | 3 | exact; door at the midpoint of the shared wall, count rooms on another floor whose walk to the nearest entrance shrinks by more than 1 m |

- `step_free_reachable_count` appears in train and dev but not in test. It may come back on Sunday.
- Only the last line starting `Answer:` is scored, and it must hold exactly one number. Hedged answers and ranges are wrong.
- The official scorer is `benchmark/score.py`.

**Starter agent:**
- Uses `claude-opus-5-5` at effort medium through the Anthropic SDK beta `tool_runner`, with prompt caching and server-side fallbacks.
- Tools: `building_overview`, `search_building`, `find_route` (step_free, via), `set_closed`, `add_door`, `show_route`.
- It scores **under 5% on purpose**, because no tool exposes areas, door widths, reachability or geometry.
- Credits for Claude, Lovable and ElevenLabs come via the organizers.
- Rules: answers must be generated by the agent, no hand-labelling, nothing hard-coded to the test buildings.

### How to win (my inference)
1. **Win the 55 points with deterministic tools; the LLM only routes and formats.** Build typed, compact tools with shapely and networkx:
   - room area, and largest or summed area by type and floor
   - door-width-filtered, lift-only reachability from a given entrance
   - shared-wall length, by buffering at 0.35 m and intersecting boundaries, keeping overlaps of at least 1 m
   - stacked room by maximum polygon overlap on the adjacent floor
   - 3D centroid distance
   - nearest asset-holding room plus multi-leg errand routes
   - what-if door at the shared-wall midpoint, then recompute nearest-entrance distances for every room

   Hit 100% on the dev warm-ups and benchmark with `benchmark.evaluate` before any UI work. Consider a classifier that sends each benchmark `kind` straight to a solver, so answers are cheap and reproducible. Check the "generated answers only" rule; an agent calling tools is clearly fine.
2. **Make it robust for Sunday.** Handle unaligned Swiss floors, OSM duplicate names ("WC"), synthetic elements, basements and L-shaped halls. Make `BENCHMARK.md` a single command, and log tool traces.
3. **Interaction (25 points), which mirrors Synera's trust message.** Ask one clarifying question only when a match is ambiguous, restate what it understood before editing the plan, and give landmark-based directions ("turn left at the press"). Add voice in and out through ElevenLabs, and test against vague, wrong and mind-changing users.
4. **Level 4: floor-plan image to `building.json`.** Use Claude vision, then validate deterministically (polygons close, every room reachable, door positions sit on shared walls). Show a diff before committing. This is the most Synera-like piece: "show what it understood" and "no silent edits".
5. **Level 5, pick one:** factory logistics (forklift routing with blocked hall zones and dock delivery), or moving assets ("this is now here" plus a QR scan). Present it in a three.js isometric stacked-floor view with animated routes, and have Lovable build the front end quickly.

## Synera background (facts, with sources)

**What Synera does**
- Synera GmbH, Bremen, founded 2018 by Dr. Moritz Maier (CEO), Sebastian Möller-Lafore and Daniel Siegel, with an office in Boston. It calls itself the "agentic AI platform for engineering" and "JARVIS for engineers".
- **Product layers:**
  - a low-code node editor: Windows/.NET desktop, 1,000+ nodes, Python/C#/MATLAB/TCL script nodes, REST
  - **Synera Run**: an on-prem server that hosts workflows as web apps
  - **AI Agents**: supervisor plus specialist multi-agent systems, where agents call deterministic workflows as tools
  - a **Marketplace**: 80–85+ add-ins and 25–30+ software partners, token-based licensing
  - Forward Deployed Engineers
- **Customers (60+ in 15 countries):** NASA Goddard, BMW, Airbus, SEAT/VW, Hyundai, Volvo Trucks, Knorr-Bremse, IMS Gear, Voith, ARRK, EDAG, RLE, MAN, Miele, STIHL, Brose, L'Oréal, Hettich, Safran, Ariane.
- **Traction:** ARR doubled in 2025, and 60% of new business came from AI.
- **Funding:** a $40M (€35M) Series B on 14 Apr 2026, led by Revaia, with Capgemini (ISAI Cap Venture), UVC Partners, BMW iVentures, Cherry Ventures, Venture Stars and Spark Capital. About $58M raised in total.
- **Credentials:** TISAX Level 2; 2026 German Innovation Award.
- Sources: https://www.synera.ai/ , https://www.synera.ai/platform , https://www.synera.ai/press/synera-raises-40m-series-b-to-scale-agentic-ai-engineering-for-global-manufacturers , https://siliconangle.com/2026/04/14/german-startup-synera-lands-40-million-automate-engineering-workflows-ai-agents/

**AI and agent strategy, recent launches**
- **25.07 (Jul 2025):** agents that "read requirements, run your workflows and document the results".
- **25.11:** agent-to-user messages, Pause/Stop controls, exportable conversations.
- **26.03 "Phenomenal Phoenix" (Mar 2026):**
  - **Knowledge Spaces**: "Remember This" captures expert decisions
  - CAD Part Comparison: a 100-dimension geometry fingerprint plus similarity search
  - unified publishing to Run or the agent server
  - CGNS CFD import
- **26.07 "Quick Quilla" (Aug 2026):**
  - **Synera Run MCP**: workflows exposed as MCP tools for Claude, ChatGPT, Codex, Cursor, VS Code and Copilot Studio
  - **Remote MCP** in Agent and Supervisor nodes
  - a unified agent entry point
  - 3D inspection inside chat
  - **Synera Assistant (beta)**: a workflow written in text becomes a working workflow
  - an LLM node for OpenAI, Anthropic and OpenAI-compatible endpoints
  - TechSoft 3D CAD fingerprinting
- **NVIDIA NemoClaw (1 Jun 2026):** long-running engineering agents, deployable in H2 2026.
- **Philosophy:** keep the physics in deterministic workflows and let agents do judgment and orchestration. Synera claims 100k–170k workflows in production and "up to 10x".
- Sources: https://www.synera.ai/releases , https://www.synera.ai/news/release-webinar-26-07-quick-quilla , https://www.synera.io/webinar/product-release-26-03-phenomenal-phoenix , https://www.synera.ai/press/synera-nvidia-nemoclaw-ai-agents-design-simulation , https://www.synera.ai/news/synera-2025-ceo-essays-workflow-automation-to-agentic-engineers

**Integrations**
- **CAD:** CATIA V4/V5/V6, Siemens NX, SolidWorks, Inventor, Solid Edge, PTC Creo, Rhino; JT, IGES and ACIS translators; 32 import and 16 export formats.
- **CAE:** Altair HyperMesh and OptiStruct, Ansys, Abaqus, Simcenter Nastran, LS-DYNA, MSC Marc, Moldflow, SimScale, ANSA, FEMFAT, Amphyon, Rafinex, FMI.
- **PLM:** Teamcenter, Windchill, Contact PLM.
- **Cost:** FACTON.
- **Other:** SAP (mentioned in a blog post), MATLAB, Office/Excel reporting, ODBC SQL databases, MQTT, AWS.
- **LLMs:** OpenAI, Anthropic, Gemini, Llama, Mistral.
- **Protocols:** A2A and MCP.
- Sources: https://www.synera.ai/platform , https://www.synera.ai/automated-rfq-processing , https://www.synera.ai/design-to-cost

**Pain points Synera talks about publicly**
- **Trust gap.** A lead crash engineer at a US automotive OEM said "This will never work". Synera writes that "an engineering decision made on a plausible-looking but wrong result is worse than no decision" and that "the only gate on scale is trust." (https://www.synera.ai/news/bridging-agentic-ai-gap)
- **Pilots stall.** "Pilots stall because the organization is not ready for the size of the impact." Problems named are ownership, release criteria, review gates and the EU AI Act. (https://www.synera.ai/news/scaling-agentic-ai-in-engineering-why-pilots-stall, 22 Oct 2026)
- **Enterprise AI can't execute engineering.** "Enterprise AI can tell an engineer what it would do. It does not do it", because it has "no native access to 3D geometry" and "Execution is the harder problem than retrieval." (https://www.synera.ai/news/enterprise-ai-platform-engineering)
- **Manual tool hand-offs.** "donkey work, putting data from one tool to the other" (IMS Gear).
- **Messy data and lost expertise.** Airbus has about 100 tools and drawings up to 40 years old. Senior engineers' know-how leaves with them.

**Hints from job postings** (https://synera.recruitee.com/api/offers/ , jobs.synera.de)
- **Senior AI Engineer ("Agentic Ants" team):**
  - an eval framework "that gates every change": golden datasets, LLM-as-judge, regression suites, production-trace mining
  - Langfuse traces, LangGraph supervisor and sub-agent graphs, FastAPI and Postgres
  - the 12-month goal: "The agents improve themselves"
- **Senior Platform Engineer:** "Synera ships today as a desktop app". They are moving the .NET backend into Docker for on-prem and later SaaS, and building "MCP servers, agent skills, and documentation written for AI agents".
- **Integration Developer, PLM/CAD:** first hire on the new Marketplace team; PLM, SPDM and MES; C# and C++; "unlimited Claude budget"; AI skills to speed up partner integrations.
- **Data Engineer:** an internal "superagent" over all company data: Timescale, Airflow, embeddings, MCP connectors.
- **Forward Deployed Engineers** in Germany, France and the US West Coast: build multi-agent systems at customers and tune prompts for reliability.
- **Fullstack Developer:** TypeScript plus WPF/ReactiveUI, and a "software factory" of skills.

**Earlier Synera events:** the Synera Experience Hackathon in Munich on 19 Mar 2025, and the Synera x NASA student challenge in 2025 (a compact, lightweight structure for launch). Event page: https://www.industrialagents.dev/ . Its illustrative trace shows an ECN that checks PLM affected assemblies, runs CAD fit checks, queries ERP open orders, then asks a human before acting. It is not tied to any track.

## Inference
The brief reuses Synera's own playbook: a deterministic graph and geometry engine with a Claude orchestrator on top, gated by an exact scorer much like their internal eval framework. Their published themes of trust, "show what it understood", human confirmation before edits, and plan-to-model ingestion line up with the Interaction rubric and Level 4. If the brief changes at kickoff, the most likely fallbacks are a geometry-aware agent over CAD, PLM and ERP (the ECN triage in the event trace) or an eval and trust harness for engineering agents.
