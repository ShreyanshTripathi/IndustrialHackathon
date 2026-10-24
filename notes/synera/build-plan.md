# Synera build plan

> Source: Claude Code session `af8ef3c5`, 23–24 Oct 2026. Saved from the conversation as-is.

## Q: okay, I have decided to build Synera's case: give me a plan on how to do it.

*2026-10-24 06:51 UTC*

I checked the kit's data format, question definitions and rules so the plan matches them.

## Where the points are
| Part | Points | Priority |
|---|---|---|
| Correct answers (test set + Sunday building) | **55** | **1st.** Exact geometry and routing tools |
| Interaction with tricky users, voice | **25** | 2nd. Clarifying questions, showing what it understood, clear directions |
| Creativity (Level 5) | 10 | 3rd |
| Video + write-up | 10 | Last few hours |

**The main idea:** code does every calculation, and Claude only understands the question, picks the tool and writes the reply. This is also Synera's own philosophy ("deterministic core, agent on top"), so it doubles as your pitch.

## Architecture
```
Web app (map + chat + voice)  ──►  FastAPI backend  ──►  Claude agent (tool use, prompt caching)
                                                              │ calls
                                              Building core: shapely geometry + networkx route graph
                                                              │ loads
                                                         building.json / floor-plan images
```

### Layer 1: building core (code only, no AI)
- **Route graph,** exactly as the README specifies:
  - Nodes: each room's `representative_point()` and each door's position.
  - Stairs cost 12 m per floor; lifts cost a 15 m wait plus 6 m per floor.
  - Step-free routing removes every edge with `step_free: false`.
  - Use a MultiGraph, and join all entrances to one "outside" node.
  - Start from `starter_agent/building_map.py`, which already does this, and check it against dev route lengths **to the centimetre**.
- **Room lookup:** find a room by name, number or floor. Handle duplicate names like "WC" by asking the user which one.

### Layer 2: one tool per question type
Each tool is a plain function that returns a compact answer:

| Tool | Answers | Key rule from the README |
|---|---|---|
| `room_area`, `largest_room`, `floor_area_total` | Area questions (75 of 145) | Polygon area; filter by room type and floor |
| `shared_walls` | Soundproofing questions (26) | At least 1 m of outline within 0.35 m; exclude corridors, stairwells, lifts |
| `reachable_rooms(entrance, min_width, step_free, closed)` | Delivery and wheelchair questions (18 + Sunday) | Door width ≥ load width; lifts OK, stairs not |
| `nearest_asset` + `route_length` | Errand questions (20) | Nearest room with the item, then walk to the target |
| `distance_3d` | Wireless link questions (15) | Room centroid at the floor's elevation |
| `room_stacked` | Leak questions (9) | Room on the next floor that covers most of this room's outline |
| `what_if_door` | What-if questions (3) | Door at the middle of the shared wall; count rooms whose walk to the nearest entrance drops by more than 1 m |
| `route`, `tour`, `step_free_route`, `close_element` | Navigation in the app | Plus directions using landmarks ("turn left at the press") |
| `add_door`, `move_asset`, `close_area` | Edits | Show the change and ask before applying it |

### Layer 3: the Claude agent
- Claude (Opus 5.5) with tool use and prompt caching of the building summary.
- **Rules in the system prompt:** never compute in its head, always use tools, and always end with exactly one `Answer:` line.
- **Keep Claude in the loop, not just regex.** The rules say "answers must come from your agent." Claude reading the question also handles new wording on Sunday.

### Layer 4: the app (25 + 10 points)
- **Front end:** React with a 2D SVG floor plan, a floor switcher, highlighted rooms and an animated route, plus a chat panel. Lovable can build this fast.
- **Voice:** ElevenLabs speech-to-text and text-to-speech (you've done voice before with Volty).
- **Behaviour the rubric rewards:**
  - Ask only when something is genuinely unclear ("There are 3 WCs on floor 1. Which one?").
  - Restate what it understood before acting ("Adding a door between 2.03 and 2.04, here's the preview. Confirm?").
  - Remember preferences, e.g. a wheelchair user gets step-free routes "every time, without asking twice".
  - Give directions people can follow: landmarks and room numbers, not coordinates.

### Level 4: build a building from floor plans
- Claude vision reads a floor-plan image and proposes rooms and doors.
- Code checks the result: outlines close, rooms don't overlap, doors sit on shared walls, every room is reachable.
- Show the result over the image, and let the user fix it by conversation.
- **The dataset gives you image and `building.json` pairs,** so you can measure accuracy. Your computer-vision background helps here.

### Level 5: pick one
**Industrial logistics:** forklift routing through a factory hall with blocked aisles and delivery docks. It reuses your width and closure logic, and suits Synera's industrial customers. A simple isometric 3D view of stacked floors can be a bonus if time allows.

## How you test it
1. **Free, no AI:** dev and train question lines include the `inputs` behind each question. Call your tools directly with those inputs and compare against the answers, until each question type is close to 100%.
2. **Robustness:** run every tool across **all 280 buildings** to catch crashes. Known traps:
   - Swiss floors that aren't aligned
   - duplicate OSM names
   - synthetic lifts and doors
   - basements and L-shaped halls
3. **End to end with Claude:** `benchmark.evaluate data/dev --agent my_agent:answer`. This catches mistakes in how Claude reads questions.
4. **Interaction:** script a few tricky users (vague, wrong room name, changes their mind, wheelchair user) and replay them after each change.

## Timeline
| When | Goal |
|---|---|
| **Tonight** | Read the kit and data, and design the tools and data model. **No code until you've checked with organisers that pre-built code is allowed.** |
| Sat 10:00 | Kickoff. Ask about the prior-work rule and the Sunday building format (JSON only, or images too?). |
| 12–14 | Set up, run the starter agent and scorer, verify the route graph to the centimetre |
| 14–19 | All 8 benchmark tools, tested on dev inputs. **Target: 90%+ per type** |
| 19–22 | Claude agent plus tools, end to end on dev. First test-set CSV submitted as a safety net |
| 22–02 | App: 2D map, chat, routes, edit-with-confirmation, voice |
| 02–06 | Level 4 (floor plan to building) and Level 5 (logistics). Sleep in shifts; clocks go back at 03:00 |
| 06–10 | Interaction polish, robustness run on all buildings, `BENCHMARK.md` one-command run |
| 10–11:30 | **Record the demo video** (2–3 min), write the technical explanation |
| **Sunday building release** | Run your one command, check the output, submit |
| **13:00** | Final submission: repo, CSV, Sunday answers, video, write-up |

**Team split (if you're 3–4):**
1. Geometry tools and benchmark.
2. Agent and interaction.
3. Front end, voice and 3D.
4. Level 4 floor plan to building, plus video.

If you're solo, do the tools first, then the agent, a simple UI, and voice last.

## Risks
- **The Sunday building's format isn't announced.** If it comes as images only, Level 4 suddenly matters for the 55 points, so get at least a basic image-to-building pipeline working.
- **Exact counts have no tolerance.** Wall and delivery counts must be exactly right, so test the edge cases.
- **Scope creep.** A pretty 3D app with wrong answers loses. Lock in the 55 points before the UI.

## Pitch (3 min, if you're a finalist)
"A building you can talk to, built the way Synera builds engineering agents: an exact core you can trust, and an agent that asks before it changes anything." Show a voice question, an animated step-free route, an edit with confirmation, and your benchmark score.

Tonight I can help with design work that isn't code: go through the dev data and write a precise spec for each tool (inputs, outputs, edge cases), so you can start building at 12:00.
