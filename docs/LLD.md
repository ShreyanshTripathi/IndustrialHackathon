# Talk to Your Building: low-level design (LLD)

Companion to [HLD.md](HLD.md). This document fixes module boundaries, data structures, function signatures, algorithms, API schemas and test procedures, so several people (or several Claude sessions) can build parts in parallel without stepping on each other.

Everything marked **[verified]** was checked against all 653 train and dev benchmark questions with a throwaway script on 24 Oct; the rule reproduced 100% of the expected answers. Items marked **[unverified]** rest on the kit README or on very few examples.

---

## 1. Conventions

| Topic | Rule |
|---|---|
| Units | Metres, m², metres in the building's local XY frame (x right, y up). Floor elevation from `floors[].elevation_m` |
| Ids | Always the dataset's ids (`<building>-F<level>-S<nnn>`, `-O<nnnn>`, `-V<nn>`, `-A<nnnnn>`). New elements: `<floor_id>-O-new<k>`, `<building>-Z-new<k>` |
| Floors | `level` int: 0 = ground, −1 = first basement. Names in data: "Ground floor", "Floor N", "Basement N" |
| Rounding (output only) | Areas 1 decimal; distances 2 decimals; counts integers. Never round intermediate values |
| Errors | Core raises `MapError(message, candidates=None)`. Tools turn it into an `is_error` result (`ToolError`) so Claude can recover or ask |
| Purity | `core/` has no I/O except `BuildingModel.load`, and no Anthropic imports. Everything in it can be tested offline |
| Style | Python 3.12, type hints, dataclasses, ruff; match the kit's style (`starter_agent/`) |

---

## 2. Repository layout

The kit clone is the repo. `data/`, `benchmark/` and `starter_agent/` stay untouched.

```
industrial-agents-hackathon-2026/
├── core/
│   ├── __init__.py
│   ├── model.py          # BuildingModel, Space/Opening/Connector/Asset views, load()
│   ├── overlay.py        # EditOp types, Overlay, apply/undo, versioning
│   ├── graph.py          # GraphSpec, build_graph(), GraphCache, route(), distances
│   ├── geometry.py       # area, centroid_3d, shared_wall_length, stacked, wall_midpoint
│   ├── resolve.py        # Resolver: places, floors, room types, asset types
│   ├── queries.py        # benchmark kinds + primitives (pure functions)
│   ├── navigation.py     # directions with landmarks, tours, route geometry for the UI
│   └── errors.py         # MapError
├── agent/
│   ├── prompts.py        # CHAT_SYSTEM, BENCHMARK_SYSTEM, building summary
│   ├── tools.py          # @beta_tool wrappers bound to a ToolContext
│   ├── runner.py         # run_agent(): tool loop, logging, usage
│   ├── benchmark.py      # answer(building_dir, question) -> str  (kit --agent interface)
│   ├── validator.py      # answer-line checks mirroring benchmark/score.py
│   └── session.py        # Session: chat state, preferences, overlay, event sink
├── server/
│   ├── app.py            # FastAPI app, routes, WebSocket
│   ├── schemas.py        # pydantic models for API and events
│   └── voice.py          # ElevenLabs STT/TTS proxy
├── web/                  # React + Vite + TS (section 11)
├── builder/              # Level 4 (section 13)
│   ├── draft.py  calibrate.py  validate.py  metrics.py
├── logistics/            # Level 5 (section 14)
│   ├── profiles.py  hall_grid.py
├── bench/
│   └── run.py            # parallel benchmark runner, single-building support, CSV
├── evals/
│   ├── oracle.py  sweep.py  e2e.py
│   └── interaction/  scenarios.yaml  simulate.py  judge.py
├── tests/                # pytest: unit tests per core module + golden cases
├── BENCHMARK.md  Makefile  .env.example
```

**Dependency rule:** `web → server → agent → core`. `builder` and `logistics` depend only on `core`. `evals` and `bench` may import anything. Nothing imports `server` or `web`.

---

## 3. Core data model (`core/model.py`, `core/overlay.py`)

### 3.1 BuildingModel

```python
@dataclass(frozen=True)
class BuildingModel:
    raw: dict                                  # the parsed building.json (never mutated)
    info: dict                                 # raw["building"]
    floors: dict[str, dict]                    # floor_id -> floor
    floor_by_level: dict[int, str]             # level -> floor_id
    levels: list[int]                          # sorted ascending
    spaces: dict[str, dict]
    openings: dict[str, dict]
    connectors: dict[str, dict]
    assets: dict[str, dict]
    polygon: dict[str, Polygon]                # space_id -> shapely Polygon (made valid with buffer(0) if needed)
    anchor: dict[str, tuple[float, float]]     # space_id -> representative_point()  (route model)
    spaces_on: dict[str, list[str]]            # floor_id -> space ids
    openings_of: dict[str, list[str]]          # space_id -> opening ids
    assets_in: dict[str, list[str]]            # space_id -> asset ids
    aligned: bool                              # False for Swiss buildings whose floors are centred per floor

    @classmethod
    def load(cls, path: Path) -> "BuildingModel": ...
    def level_of(self, space_id: str) -> int: ...
    def elevation_of(self, space_id: str) -> float: ...
    def label(self, space_id: str) -> str:     # "Office 0.29 (Ground floor)"
```

- Polygons are built once at load time. Invalid ones are repaired with `buffer(0)`, and the repair is logged so the sweep can report it.
- `anchor` uses `Polygon(raw_polygon).representative_point()` on the **unrepaired** polygon, exactly as the kit does, to keep route lengths identical.
- `aligned` is a heuristic: `source == "swiss_dwellings"` and the per-floor bounding-box centres coincide.

### 3.2 Overlay (edits)

```python
EditOp = (
    Close(element_id: str)                      # connector, opening or space
  | Reopen(element_id: str)
  | AddDoor(op_id, first: str, second: str, position: tuple[float, float], width_m=0.9, step_free=True)
  | MoveAsset(asset_id: str, space_id: str, position: tuple[float, float])
  | BlockZone(op_id, floor_id: str, polygon: list[tuple[float, float]], label: str)   # Level 5
  | AddAsset(...)                                                                     # Level 5
)

@dataclass
class Overlay:
    ops: list[EditOp] = field(default_factory=list)
    version: int = 0                            # bumps on every apply or undo; part of the graph cache key

    def apply(self, op: EditOp) -> None
    def undo(self) -> EditOp | None
    def closed(self) -> frozenset[str]
    def extra_openings(self) -> list[dict]      # AddDoor ops rendered as opening dicts
    def asset_position(self, asset_id) -> tuple[str, tuple[float, float]] | None
    def blocked_zones(self, floor_id) -> list[Polygon]
    def fork(self) -> "Overlay"                 # deep copy for what-if and pending edits
```

- **View** = `(BuildingModel, Overlay)`. Every query takes a `View`, so the same code serves the base building, a session's committed state, a pending preview and a throwaway what-if.
- `Session` holds `committed: Overlay` and `pending: dict[edit_id, Overlay]`. Confirming swaps `committed = pending[edit_id]`.

---

## 4. Benchmark semantics (the contract for `core/queries.py`)

Each function takes resolved ids and returns a small dataclass. The agent tool wraps it and formats the result.

| Kind | Function | Exact rule | Status |
|---|---|---|---|
| `floor_area_total` | `floor_area_total(view, floor_id, room_type) -> AreaTotal(value_m2, count, space_ids)` | Sum of polygon areas of **all spaces** on `floor_id` with `room_type == X`, **any `type`** | **[verified]** 181/181. Filtering `type == "room"` gives 179/181 |
| `largest_room` | `largest_room(view, floor_id, room_type) -> LargestRoom(space_id, name, ref, area_m2, runner_up_id)` | Argmax polygon area over the same candidate set | **[verified]** 96/96 (one case has no `type == "room"` candidate) |
| `straight_line_3d` | `straight_line_3d(view, a, b) -> Distance(value_m)` | 3D Euclidean distance between `(centroid.x, centroid.y, floor.elevation_m)` of each polygon. Centroid, **not** the representative point | **[verified]** 30/30 |
| `room_stacked` | `room_stacked(view, space_id, direction) -> Stacked(space_id, name, overlap_ratio)` | Target floor = the next level up or down in `levels`. Candidates = **all spaces** on that floor. Argmax `area(start ∩ candidate)` | **[verified]** 26/26. Only used on aligned buildings |
| `shared_walls_count` | `shared_walls_count(view, space_id) -> WallCount(value, neighbours: [(id, shared_len_m)])` | Other spaces on the same floor with `type ∉ {corridor, stair, lift, outdoor}` (so **halls count**), where `length(start.exterior ∩ other.exterior.buffer(0.35)) ≥ 1.0` | **[verified]** 143/143. Only `type == "room"` gives 124/143 |
| `wide_delivery_count` | `wide_delivery_count(view, start, floor_id, min_width) -> ReachCount(value, space_ids)` | Graph with `step_free=True` and every opening edge with `width_m < min_width` removed (lifts allowed; connectors carry no width). Connected component of `start`. Count spaces with `type == "room"` on `floor_id`, **including `start`** if it qualifies | **[verified]** 80/80. Excluding `start` gives 38/80 |
| `step_free_reachable_count` | `step_free_reachable_count(view, start, floor_id, closed) -> ReachCount` | Graph with `step_free=True` and `closed` removed. Count `type == "room"` on `floor_id` in `start`'s component | **[unverified]**, 2/2 examples. Including or excluding halls and `start` can't be told apart |
| `errand` | `errand(view, start, asset_type, floor_id, room_type) -> Errand(total_m, via_id, target_id, leg1_m, leg2_m)` | Normal walking graph (stairs allowed). `via` = the space holding an asset with `type == asset_type` that has the smallest **route** distance from `start` (could be `start` itself). `target` = `largest_room(floor_id, room_type)`. Total = d(start, via) + d(via, target) | **[verified]** 93/93, `via` matches 93/93 |
| `what_if_door` | `what_if_door(view, first, second, floor_id) -> WhatIf(value, improved: [(id, before_m, after_m)])` | Fork the overlay; add a door at the **midpoint of the shared wall**, joined to both spaces' anchors (walking graph, not step-free). `d(x)` = route distance from `outside`. Count `type == "room"` spaces on `floor_id` with `d_after < d_before − 1.0`. Spaces unreachable before but reachable after count as improved | **[unverified]**, 4/4 examples. Halls included or excluded can't be told apart |

**Shared-wall midpoint:** `seg = A.exterior ∩ B.exterior.buffer(0.35)`, then `seg.interpolate(0.5, normalized=True)`. If `seg` is empty, raise `MapError("do not share a wall")`. The centroid of `seg` gave the same answers.

**Defaults for the unverified cases:** use `type == "room"` and include `start`, consistent with `wide_delivery_count`. Log both variants' values in benchmark runs so the choice can be revisited when the Sunday questions arrive.

---

## 5. Route graph (`core/graph.py`)

```python
@dataclass(frozen=True)
class GraphSpec:
    step_free: bool = False
    min_width: float | None = None      # drop opening edges narrower than this
    extra_closed: frozenset[str] = frozenset()

def build_graph(view: View, spec: GraphSpec) -> nx.MultiGraph
class GraphCache:                       # LRU keyed by (id(model), overlay.version, spec); size 32
    def get(self, view, spec) -> nx.MultiGraph

def shortest(view, spec, a, b) -> tuple[float, list[str]]            # length, node path
def distances_from(view, spec, source) -> dict[str, float]           # single-source Dijkstra
def component(view, spec, source) -> set[str]
def route(view, spec, stops: list[str]) -> RouteResult               # multi-leg; reuses the cached graph
```

**Construction.** This is the kit's model; copy `starter_agent/building_map.py:graph()` and extend it.
1. Nodes: every non-closed space at `anchor[space]`; `"door:<opening_id>"` per opening; one `"outside"` node.
2. For each opening that isn't closed, and isn't filtered out by `step_free` or `min_width`: edge `space ↔ door` weighted `dist(anchor, position)`. Entrances connect `outside ↔ door` at weight 0.
3. Overlay `AddDoor` ops are added as ordinary openings.
4. Connectors (not closed, `step_free` filter applied): sort stops by level and join consecutive stops. Stairs cost `12 × Δlevel`; lifts cost `15 + 6 × Δlevel`. Edge attribute `via = connector_id`.
5. Use a `MultiGraph`: parallel stair and lift edges must both survive.
6. Edge attributes: `weight`, `via`, `kind ∈ {door, entrance, opening, stairs, lift}`.

**Acceptance:** `starter_agent.evaluate data/dev --oracle` style check. Every warm-up `route`, `route_step_free`, `route_with_closure` and `tour` answer matches `optimal_length_m` within 0.01 m.

**Performance:** the largest building (`osm-way27917482`) has 1,623 spaces and 1,799 openings, so about 3,400 nodes. Build time is about 50 ms and Dijkstra about 5 ms, so graphs are cached and never precomputed in bulk.

---

## 6. Geometry (`core/geometry.py`)

```python
def area(view, space_id) -> float
def centroid_3d(view, space_id) -> tuple[float, float, float]
def shared_wall_length(view, a, b, tol=0.35) -> float          # length(A.exterior ∩ B.exterior.buffer(tol))
def wall_neighbours(view, space_id, min_len=1.0, exclude_types=WALL_EXCLUDED) -> list[tuple[str, float]]
def stacked(view, space_id, direction: Literal["above", "below"]) -> tuple[str, float] | None
def wall_midpoint(view, a, b, tol=0.35) -> tuple[float, float]
def floor_bounds(view, floor_id) -> tuple[float, float, float, float]   # for the UI viewBox
```

- `WALL_EXCLUDED = {"corridor", "stair", "lift", "outdoor"}`.
- `wall_neighbours` pre-filters candidates with an STRtree on `polygon.buffer(0.35).bounds`, so it stays fast on large OSM floors.
- `stacked` returns `None` if there is no adjacent level or no overlap. On non-aligned buildings it still runs but sets `overlap_ratio` low, and the tool warns.

---

## 7. Resolver (`core/resolve.py`)

Turns text into ids. This is the most likely source of silent errors, so it never guesses between close candidates.

```python
@dataclass
class Candidate: id: str; label: str; score: float; reason: str

class Resolver:
    def __init__(self, model: BuildingModel)
    def place(self, text: str, floor_hint: str | int | None = None) -> str            # raises MapError(candidates=[…])
    def place_candidates(self, text, floor_hint=None, k=8) -> list[Candidate]
    def floor(self, text: str) -> str                                                 # floor_id
    def room_type(self, text: str) -> str                                             # e.g. "meeting rooms" -> "meeting_room"
    def asset_type(self, text: str) -> str                                            # "fire extinguisher" -> "fire_extinguisher"
    def element(self, text: str) -> str                                               # connector/opening/space for closures
```

**`place(text)` algorithm.** Stop at the first rule that gives exactly one match.
1. Exact id (space, asset → its space).
2. Split a trailing floor qualifier `"<name> (<floor name>)"`, which is the format every benchmark question uses. Exact case-insensitive match of `name` **and** floor.
3. Exact `ref` match (refs are unique except in OSM), filtered by floor if one is given.
4. Exact `name` match, filtered by floor.
5. Exact asset name → its space.
6. Fuzzy: token containment, then `rapidfuzz` ratio over `name`, `ref` and `room_type`. **Never auto-pick:** raise `MapError` with the top k candidates, each with its label "Name (Floor)".

Known traps: duplicate names on one floor ("WC", "Passage", "Foyer"), refs with leading minus signs ("-1.04.018"), German names with umlauts (normalise with NFKC and casefold).

**`floor(text)`:**
- "ground floor" or "ground" → 0.
- "floor N", "the floor N", "Nth floor", "level N" → N.
- "basement N" → −N, and "basement" alone → −1.
- Otherwise match `floors[].name` exactly.

**`room_type` and `asset_type`:** normalise (lowercase, `_`↔space, strip plural "s"/"es"), then match against the types **present in this building**. If nothing matches, raise `MapError` listing the types present.

---

## 8. Tool catalogue (`agent/tools.py`)

Tools are thin wrappers: resolve the text, call `core`, return compact JSON. Every result includes the **resolved labels**, so Claude can say what it understood. Arguments take names or ids.

### 8.1 Benchmark tools (one call answers the question)

| Tool | Arguments | Returns (JSON) |
|---|---|---|
| `floor_area_total` | `floor`, `room_type` | `{floor, room_type, total_m2, count}` |
| `largest_room` | `floor`, `room_type` | `{room: "Kitchen 0.30", ref, area_m2, runner_up: {room, area_m2}}` |
| `straight_line_3d` | `first`, `second` | `{first, second, distance_m}` |
| `room_stacked` | `room`, `direction: "above"\|"below"` | `{room, direction, result: "Office 1.29", overlap_ratio}` |
| `shared_walls_count` | `room` | `{room, count, neighbours: ["Office 1.13 (4.2 m)", …]}` |
| `wide_delivery_count` | `entrance_room`, `floor`, `min_width_m` | `{start, floor, min_width_m, count, rooms: [first 10 names]}` |
| `step_free_reachable_count` | `entrance_room`, `floor`, `closed_element` | `{start, floor, closed, count}` |
| `errand` | `start`, `asset_type`, `target_floor`, `target_room_type` | `{start, pickup: "Kitchen 0.30", target: "Meeting room 1.06", leg1_m, leg2_m, total_m}` |
| `what_if_door` | `first`, `second`, `count_floor` | `{door_between, count_floor, count, examples: [first 5 {room, before_m, after_m}]}` |

### 8.2 Primitives (for new wording and for chat)

| Tool | Arguments | Returns |
|---|---|---|
| `building_overview` | none | floors, connectors, entrances, room-type counts per floor, closures |
| `resolve_place` | `text`, `floor?` | `{id, label}` or `{candidates: [...]}` (an error result if ambiguous) |
| `search` | `query`, `floor?` | up to 15 spaces and assets matching the query |
| `room_info` | `room` | area, type, floor, doors (`[{to, width_m, step_free}]`), wall neighbours, assets (types with counts) |
| `list_rooms` | `floor`, `room_type?` | `[{room, area_m2}]` sorted by area, at most 40 |
| `route` | `start`, `destination`, `via?: [..]`, `step_free?`, `min_width_m?` | `{route_id, length_m, steps: [...], floors_crossed, constraints}` |
| `distance_to_exit` | `room`, `step_free?` | `{room, nearest_entrance, length_m}` |
| `reachable_rooms` | `start`, `floor?`, `step_free?`, `min_width_m?`, `closed?: [..]` | `{count, rooms: [first 20]}` |

### 8.3 Edits and view (chat only)

| Tool | Arguments | Effect |
|---|---|---|
| `set_preference` | `step_free?`, `min_width_m?`, `voice_mode?` | Stored in the session and applied to later routes automatically |
| `set_location` | `room` | Remembers where the user is |
| `propose_edit` | `op: close\|reopen\|add_door\|move_asset\|block_zone`, args | Creates a pending overlay; sends an `edit_preview` event; returns `{edit_id, summary, effects}`. Effects are routes or reachability that change |
| `confirm_edit` / `discard_edit` | `edit_id` | Commit or drop it; sends `building_changed` |
| `undo_last_edit` | none | Pops the committed overlay |
| `show_on_map` | `ids: [..]` | Sends a `highlight` event |
| `show_route` | `route_id` | Sends a `route` event with polylines per floor |

**Tool sets:** benchmark mode gets 8.1 and 8.2. Chat mode gets all of them. This keeps the benchmark prompt small and cacheable.

**Output budget:** every tool result is at most about 1.5k characters; lists are truncated with `"…and N more"`.

---

## 9. Agent (`agent/`)

### 9.1 Runner

```python
@dataclass
class AgentConfig:
    model: str = "claude-opus-5-5"
    effort: str = "medium"            # benchmark; chat may use "low" for simple lookups
    max_tokens: int = 8000
    max_tool_iterations: int = 12

def run_agent(cfg, system_blocks, tools, messages, on_event=None) -> AgentResult(text, messages, usage, tool_calls)
```

- This is the starter's `tool_runner` loop, keeping the history-mirroring trick from `starter_agent/agent.py`.
- The system prompt is two blocks, **rules** and **building summary**, both with `cache_control: ephemeral`.
- `on_event` receives a `status` event for each tool call ("Measuring walls of Server room 1.14…") for the UI.
- Every turn is logged to `agent_output/logs/<session or question id>.jsonl`.

### 9.2 Prompts (`agent/prompts.py`)

**`BENCHMARK_SYSTEM`** (outline):
1. You answer questions about one building. Every number comes from a tool; never compute in your head.
2. Pick the matching high-level tool if one exists (list the 8 with one-line descriptions); otherwise compose primitives.
3. Pass names exactly as written in the question, including the "(Floor)" qualifier.
4. Do not ask questions back. If a tool reports ambiguity, choose the candidate that matches the question's floor qualifier.
5. Reply with at most two sentences, then a final line in exactly the format the question asks for. **The answer line contains only the requested value:** no units other than m², no extra numbers, no floor numbers, no ranges.

Per-format examples in the prompt:
- `Answer: 5`
- `Answer: 165.75`
- `Answer: Kitchen 0.30, 28.2 m²`
- `Answer: Generic room -1.04.018`

**`CHAT_SYSTEM`** (outline): the starter's prompt, plus:
- Restate what you understood in one line before acting.
- Ask at most one question, and only when the answer changes the result.
- Remember preferences through `set_preference`.
- Never apply an edit without `propose_edit` followed by user confirmation.
- Give directions by landmark: room names, notable assets in rooms passed, lifts and stairs by name.
- In voice mode, give one step per sentence and no lists longer than 4.

**Building summary** (cached): building name and source; floors (level, name, number of spaces); room types with counts per floor; connectors (name, kind, floors); entrances (into which room, step-free). The cap is about 2k tokens. For large OSM buildings the room-type list is truncated to the top 30.

### 9.3 Benchmark entry point (`agent/benchmark.py`)

```python
def answer(building_directory: Path, question_text: str) -> str:
    view = View(BuildingModel.load(building_directory), Overlay())  # model cached per directory (LRU 8)
    result = run_agent(BENCH_CFG, bench_system(view), bench_tools(view), [user(question_text)])
    verdict = validate(question_text, result.text)
    if not verdict.ok:                                   # at most one corrective turn
        result = run_agent(..., messages=result.messages + [user(verdict.correction)])
    return result.text
```

This matches the kit interface: `--agent agent.benchmark:answer`.

### 9.4 Validator (`agent/validator.py`)

It mirrors `benchmark/score.py` exactly. It imports `committed_answer` and `numbers_in` from the kit, rather than copying them, so the two can't drift apart.

| Expected format (from the question's "Finish with a line …") | Check |
|---|---|
| `Answer: <number>` | `committed_answer` exists, and `numbers_in(answer) == 1` value |
| `Answer: <room name or number>, <area> m²` | The answer line has a room label and at least one number, and **no second room label** |
| `Answer: <room name or number>` | Not empty, and doesn't contain "or", "/" or a list |

A failed check gets one corrective message, e.g. *"Your last line must be exactly 'Answer: <number>' with one number and nothing else."* There are no further retries.

### 9.5 Session (`agent/session.py`)

```python
@dataclass
class Session:
    id: str
    model: BuildingModel
    committed: Overlay
    pending: dict[str, Overlay]
    prefs: Prefs                       # step_free: bool, min_width_m: float|None, voice_mode: bool
    location: str | None
    messages: list[dict]
    last_routes: dict[str, RouteResult]
    events: Callable[[dict], None]     # pushes to the WebSocket

    async def ask(self, text: str) -> str
```

- Preferences are injected into route and reachability tools as defaults, so the model doesn't need to remember them.
- History is trimmed after 30 turns: keep the system prompt plus the last 20 messages plus a running summary of location, preferences and edits.

---

## 10. Server API (`server/`)

| Method | Path | Body / query | Response |
|---|---|---|---|
| `GET` | `/buildings` | `?split=dev&q=` | `[{id, name, source, floors}]` from `manifest.csv` |
| `GET` | `/buildings/{id}` | none | Geometry for rendering: floors, spaces (`id`, `name`, `type`, `room_type`, `polygon`), openings, connectors, assets (`id`, `name`, `type`, `position`, `footprint`) |
| `POST` | `/sessions` | `{building_id}` or `{upload_id}` | `{session_id}` |
| `WS` | `/sessions/{id}/ws` | see below | see below |
| `POST` | `/sessions/{id}/export` | none | `building.json` with the committed overlay applied |
| `POST` | `/voice/stt` | audio blob (webm/opus) | `{text}` |
| `POST` | `/voice/tts` | `{text}` | `audio/mpeg` stream |
| `POST` | `/builder/upload` | multipart images, `{scale_hint?}` | `{upload_id, draft}` (Level 4) |

**WebSocket messages**

Client to server:
```jsonc
{"type": "user_message", "text": "…"}
{"type": "confirm_edit", "edit_id": "e3"}      // UI buttons; equivalent to saying "yes"
{"type": "discard_edit", "edit_id": "e3"}
{"type": "set_location", "space_id": "…"}      // user clicked a room
```

Server to client:
```jsonc
{"type": "status", "text": "Finding a step-free route…"}
{"type": "assistant_message", "text": "…", "voice": false}
{"type": "highlight", "ids": ["…"], "floor_level": 1}
{"type": "route", "route_id": "r7", "length_m": 84.3, "constraints": {"step_free": true, "closed": ["…"]},
 "from": "Main lobby (Ground floor)", "to": "CNC mill (Floor 2)",
 "legs": [{"floor_level": 0, "points": [[x, y], …]}, {"connector": "Office lift", "from_level": 0, "to_level": 2}, …]}
{"type": "edit_preview", "edit_id": "e3", "summary": "Add 0.9 m door between 2.03 and 2.04",
 "ops": [{"op": "add_door", "position": [x, y], "floor_level": 2}], "effects": ["Route 2.03→lift shortens by 11 m"]}
{"type": "building_changed", "version": 5}
{"type": "error", "text": "…"}
```

**Route polylines:** walk the node path. Each space node adds its anchor and each door node adds the opening position. A connector edge closes the current leg and adds a connector leg.

---

## 11. Frontend (`web/`)

```
App
├── TopBar: BuildingPicker · FloorTabs · ViewToggle (2D / iso)
├── MapCanvas (SVG)
│   ├── SpacesLayer      polygons, filled by type; label at anchor; click → set_location / ask about it
│   ├── OpeningsLayer    door ticks, width-coded; entrances marked
│   ├── AssetsLayer      footprints (toggle); machines emphasised in factories
│   ├── HighlightLayer   pulsing outline on highlighted ids
│   ├── RouteLayer       animated polyline (stroke-dashoffset), connector badges at floor changes
│   └── PreviewLayer     dashed pending edits (new door, closed element in red)
├── IsoView (optional, three.js): floors extruded and stacked by elevation_m, route as a 3D tube
└── ChatPanel
    ├── MessageList · StatusLine
    ├── UnderstoodCard   (from route event: from → to · step-free · closures · length)
    ├── EditPreviewCard  (summary, effects, Confirm / Cancel)
    └── Composer · MicButton (push-to-talk) · VoiceToggle
```

- **State:** a single zustand store `{building, floorLevel, highlights, route, preview, messages, status, version}`. WebSocket events are reduced into the store.
- **Coordinates:** `viewBox` comes from `floor_bounds`, with `transform="scale(1,-1)"` to flip y-up into SVG's y-down. Text is counter-flipped.
- **Auto floor switch:** a `highlight` or `route` event switches to the first relevant floor. The route animation plays one leg after another, switching floors at connector legs.
- **Refresh:** `building_changed` triggers a re-fetch of `/buildings/{id}` with the overlay applied (`?session=`).

---

## 12. Voice (`server/voice.py`, web)

- **Input:** MediaRecorder (webm/opus) → `POST /voice/stt` → ElevenLabs speech-to-text → text → sent as `user_message` with `voice: true`.
- **Output:** `assistant_message` with `voice: true` → `POST /voice/tts` → ElevenLabs streaming TTS → audio element.
- **Voice mode** (`prefs.voice_mode`) switches the prompt style: short sentences, one step at a time, landmarks first. A "next step" voice command advances through the directions.
- **Fallback:** browser `SpeechRecognition` and `speechSynthesis` when no key or network is available.

---

## 13. Level 4: building from floor plans (`builder/`)

**Pipeline**
1. **Draft** (`draft.py`): send each `floor_<level>_plain.png` to Claude with vision. It returns JSON with `spaces[{name, room_type, polygon_px}]`, `openings[{between: [i, j] | "outside", position_px, width_px, kind}]` and `connectors[{kind, position_px}]`. The pixel frame has its origin at the top left.
2. **Calibrate** (`calibrate.py`): metres per pixel come from a scale bar if one is detected, or from one known dimension asked from the user ("How wide is the corridor?"), or from a typical door width (0.9 m) as a last resort. Flip y and convert to metres.
3. **Snap and validate** (`validate.py`):
   - Close each polygon, fix self-intersections, and snap vertices within 0.2 m to each other.
   - Rooms may overlap by at most 0.5 m².
   - Each door must lie within 0.35 m of both spaces' outlines; snap it to the shared wall midpoint if it doesn't.
   - Every room must be reachable from an entrance. Report any orphans.
   - Connectors must line up across floors (same XY within 2 m) and are linked in level order.
   - Each problem comes with a suggested fix that becomes a question to the user.
4. **Review:** draw the draft over the image in the UI. The user fixes it by conversation ("merge these two rooms", "there's a door here"). Fixes are overlay ops on the draft.
5. **Save:** write a schema-valid `building.json` that loads with `BuildingModel` and passes `sweep.py` checks.

**Metrics** (`metrics.py`), on 20 held-out kit buildings, each image compared with its `building.json`:
- Room matching by Hungarian assignment on IoU; report mean IoU and the share of rooms with IoU > 0.7.
- Door recall within 0.5 m.
- Median relative route-length error over 20 random room pairs.
- Time to build, in minutes.

---

## 14. Level 5: industrial logistics (`logistics/`)

```python
@dataclass
class VehicleProfile: name: str; width_m: float; step_free: bool = True; lifts_ok: bool = True
FORKLIFT = VehicleProfile("forklift", 1.4); PALLET_JACK = VehicleProfile("pallet jack", 0.9)
```

- **Between spaces:** `GraphSpec(step_free=True, min_width=profile.width_m)`. Lift edges are dropped if `lifts_ok` is false or the lift door is too narrow.
- **Inside large halls** (`type == "hall"` or `room_type ∈ {production_zone, warehouse_zone, logistics_zone, assembly_zone}`): `hall_grid.py` rasterises the hall at 0.5 m cells. Obstacles are asset footprints (rotated rectangles) and `BlockZone` polygons, each inflated by `width/2`. A* runs between door positions, and the hall's internal edge weights are replaced by grid path lengths.
- **Docks:** entrances on `logistics_zone` or `warehouse_zone` spaces, or assets of type `loading_dock` if present.
- **Chat:** "Aisle 4 is blocked" → `propose_edit(block_zone)` with the polygon from the named aisle or the user's click → reroute → show the before and after.
- **Moving assets:** a `MoveAsset` op with a timestamp lets "where is the steel drum delivered yesterday?" be answered from overlay history.

---

## 15. Evaluation (`evals/`, `tests/`)

| Script | What it does | Pass bar |
|---|---|---|
| `evals/oracle.py [--split train,dev] [--kinds …]` | For every benchmark question, call the core query with its `inputs` (ids, so no resolver), compare to `answer` using the kit's tolerances, print misses with ids | 100% on verified kinds |
| `evals/oracle.py --resolver` | Same, but parse names from `question` through `Resolver` first. Isolates resolver bugs | 100% |
| `evals/oracle.py --basic` | Warm-up routes, tours and closures compared to `optimal_length_m` | Within 0.01 m |
| `evals/sweep.py` | Load all 280 buildings; run each query on random valid inputs; report exceptions, NaNs, repaired polygons, empty results | 0 exceptions |
| `evals/e2e.py data/dev [--per-kind N]` | `bench/run.py` with scoring; per-kind accuracy, token usage, cost | At least 90% overall |
| `evals/interaction/simulate.py` | Claude plays the personas from `scenarios.yaml` (vague newcomer, wrong room number, wheelchair user, changes mind, facility manager edit) against `Session`. `judge.py` rates the rubric: asked only what was needed, restated what it understood, directions were followable | Reviewed by hand |

`tests/` holds pytest unit tests per core module with small hand-built buildings (two rooms and a door, two floors with a lift, an L-shaped wall), plus 2 golden questions per kind from dev.

---

## 16. Benchmark runner and deliverables

**`bench/run.py`**
```bash
uv run --env-file .env python -m bench.run <dir> [--workers 8] [--out answers.csv] [--per-kind N]
```
- `<dir>` can be a split (`data/test`) or a **single building directory**. A single building is wrapped in a temporary parent so the kit's `load_questions` layout works.
- It runs `agent.benchmark:answer` in a thread pool (145 questions take about 5 minutes at 8 workers). It writes the CSV with the kit's `write_submission_csv` and scores with `score_reply` when answers are present.
- It writes per-question JSONL logs (tool calls, resolved ids, both variants for the unverified kinds).
- Equivalent kit command, kept working for judges: `python -m benchmark.evaluate <split> --agent agent.benchmark:answer --submission-csv answers.csv`.

**Makefile**
```make
setup:        uv sync && (cd web && npm i)
test:         uv run pytest -q
oracle:       uv run python -m evals.oracle --split train,dev
sweep:        uv run python -m evals.sweep
bench-dev:    uv run --env-file .env python -m bench.run data/dev --out agent_output/dev.csv
bench-test:   uv run --env-file .env python -m bench.run data/test --out team_<name>.csv
benchmark:    uv run --env-file .env python -m bench.run $(DIR) --out $(OUT)    # Sunday building
dev:          uv run uvicorn server.app:app --reload & (cd web && npm run dev)
```

**`BENCHMARK.md`** covers prerequisites (uv, Python 3.12, `.env` with `ANTHROPIC_API_KEY`), the single command `make benchmark DIR=<path> OUT=<file>`, the expected runtime and cost, and where logs go.

---

## 17. Error handling

| Situation | Where | Behaviour |
|---|---|---|
| Unknown or ambiguous place | Resolver | `MapError` with candidates → Claude asks (chat) or picks by floor qualifier (benchmark) |
| No route (closures, step-free) | graph | `MapError("No step-free route … with closures [...]")` → Claude explains and offers alternatives |
| Invalid polygon | model load | Repaired with `buffer(0)` and logged; anchor still uses the raw polygon |
| Floors not aligned and a stacking question | geometry | Answer anyway; result flagged `aligned: false`; chat warns |
| Tool exception (bug) | tools | Caught; `ToolError("internal error in X")`; full traceback logged |
| Anthropic API error, rate limit | runner | 2 retries with exponential backoff (2 s, 8 s); benchmark returns `""` after that and the runner re-queues the question once |
| Missing `Answer:` line | validator | One corrective turn |
| WebSocket drop | web | Auto-reconnect; session state is on the server |
| Edit conflicts (door between non-adjacent rooms) | overlay | `MapError("…do not share a wall")` before anything is applied |

---

## 18. Edge cases to test

- Duplicate names on one floor (OSM "WC", Swiss "Passage" / "Foyer"); refs with a leading "-" or several dots.
- Start room that itself contains the errand asset (pickup leg = 0).
- Delivery start room that is itself a `room`, so it counts.
- Lifts with only some floors served; stairs and lifts joining the same two spaces (MultiGraph).
- Entrances with steps (`step_free: false`) in step-free reachability.
- Basements (negative levels); "next floor" across a gap in levels; top floor with no "above".
- L-shaped halls and polygons with holes (concave shapes: use `representative_point`, never the centroid, for anchors).
- Swiss floors that aren't aligned for 3D distance (still computed as defined).
- Very large OSM building (1,623 spaces): wall neighbours via STRtree; tool output truncation.
- Non-ASCII names (umlauts) through the resolver and the CSV (UTF-8).
