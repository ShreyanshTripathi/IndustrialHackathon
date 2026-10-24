# Talk to Your Building: UI/UX design

| | |
|---|---|
| Visual mockups | Design canvas: https://claude.ai/artifact/JrnDR9BJ2atzC2nWJDtXwA (source in [../design/project/](../design/project/)) |
| Companion docs | [HLD.md](HLD.md) · [LLD.md](LLD.md) (section 10 has the WebSocket events these screens consume; section 11 the component tree) |

---

## 1. Design direction

Dark, minimal, automotive. It borrows the feel of a modern in-car touchscreen: a big map, very little chrome, large calm type, one accent colour. It doesn't copy any brand's logo, fonts or name.

| Choice | Rationale |
|---|---|
| **Dark ground (#050506)**, panels a step lighter | The map's rooms and the blue route carry the contrast. Also reads well on a factory tablet and on video |
| **One accent: blue #3E6AE1** | Means only "your route" or "the next action". Swappable through the `accent` tweak on every artboard |
| **One warning colour: amber #F2A93B** | Means only "something in the building changed": closed, blocked, needs attention. Blue and amber also differ in lightness, so they're distinguishable for colour-blind users |
| **Montserrat** (display, numbers, labels) + **Inter** (reading) | Geometric display face for the automotive feel; Inter for long text and tabular numbers |
| **Pills and 44 px+ targets** | Usable with gloves, on a forklift tablet, one-handed on a phone |
| **White for the destination** | The thing you're going to is the brightest object on the map |

---

## 2. Principles

1. **The map is the screen.** Panels sit beside it or float over it. Nothing covers the route.
2. **One accent, one warning.** Never introduce a third signal colour.
3. **Show what was understood.** Every answer shows from, to and constraints before the directions (*Understood card*).
4. **Ask at most one question, and only when it changes the answer.** If there are three CNC mills, pick the nearest and say so, with a "Show the other mills" chip, rather than asking.
5. **Nothing changes without a yes.** Edits render dashed until confirmed; every change can be undone.
6. **Remember, visibly.** Preferences such as step-free and the current location appear in the panel footer ("Remembering: …"), so the user knows why routes look the way they do.
7. **Directions by landmark.** Room names, machines and lifts ("past the conveyor"), never coordinates or bearings.

---

## 3. Screens

### 01 Navigate (desktop, `Main.dc.html`)
- **Persona:** first day at work, wheelchair user.
- **Layout:** chat panel on the left (420 px max), map on the right. At phone width the panel stacks above the map.
- **Panel, top to bottom:**
  - building name and switcher;
  - ask field with mic;
  - conversation;
  - **Understood card** (from → to, constraint chips, total metres and time);
  - numbered directions, each with a turn icon and leg distance;
  - follow-up chips;
  - the "Remembering" footer.
- **Map:** floor title (top left), 2D/3D toggle (top right), floor switcher with zoom and recenter (right edge), and a **route pill** at the bottom (`118 m · 2 min`, Cancel, **Start guidance**).
- **Route drawing:** a solid accent line with a soft glow. The you-are-here dot has a halo; the destination machine is filled white and labelled.

### 02 Edit (desktop, `Edit.dc.html`)
- **Persona:** facility manager.
- **Flow:** "Add a door between Meeting room 0.24 and Office 0.25", then a **pending-change card**:
  - dashed accent border;
  - between, where and door width;
  - **What changes:** route deltas, and rooms losing access;
  - Confirm and Cancel.
- **Active changes** list (amber dot, Reopen) plus Undo last change.
- **Map:** zoomed to the affected area. The new door is dashed with a callout, affected rooms are outlined in accent text blue, the closed lift is amber-hatched with a CLOSED tag. Legend at bottom left; Confirm and Cancel repeated at bottom right.
- **Rule:** the preview's effect rows must respect current closures. A closed lift never appears in a route.

### 03 Voice (phone 390×844, `Voice.dc.html`)
- **Persona:** service technician, hands full.
- **Turn card:** accent turn icon, distance in 34 px, the instruction in 22 px, the step after it in small type.
- **Heading-up mini map** with the moving arrow.
- Transcript ("You said …") and a short spoken reply.
- Remaining distance, live waveform, a large mic button (72 px), Repeat and End route.
- **Voice copy rules:** one step per sentence, landmark first, no lists longer than 4, numbers rounded to the nearest metre.

### 04 Forklift display (in-cab tablet 1180×820, `Logistics.dc.html`)
- **Persona:** forklift driver (Level 5).
- **Map:** the hall map takes about 70% of the width. The blocked aisle is amber-hatched with a BLOCKED tag; the usual route shows as grey dashes, the new route in accent.
- **Right column:**
  - next manoeuvre card;
  - **Reroute notice** (amber: "+22 m", why, who reported it, when);
  - trip card (distance, time, destination dock, load, what's being avoided);
  - **Report blockage** (amber outline) and mic.
- The vehicle profile chip ("1.4 m wide · no stairs") stays in view, because it explains every routing decision.

### 05 Build (desktop, `Build.dc.html`)
- **Persona:** facility manager setting up a new building (Level 4).
- **Panel:**
  - 6-step progress bar (Upload, Scale, Rooms, **Doors**, Check, Save);
  - a plain summary ("16 spaces and 15 doors … scale from the scale bar");
  - a **checks list** (green ticks, amber warnings);
  - one question for the blocking issue, with quick replies;
  - a composer with example commands.
- **Canvas:** the uploaded plan in grey; detected rooms overlaid in translucent accent; problem rooms dashed amber with "no door"; door markers in white. Layer toggles and a plan-opacity slider at the top.
- **Bottom bar:** counts plus a reason when Save is disabled ("2 rooms need a door before saving").

### 06 3D view (desktop, `View3D.dc.html`, interactive)
- **Purpose:** see the whole building and every object in it. This is where people realise "the map knows what's in the rooms", and it's strong demo material.
- **Viewport:** both floors in 3D. Rooms are floor tiles with low cut-away walls (1.0 m in halls, 1.2 m in offices). Floor 1 floats 3.5 m above the office block, plus an adjustable gap. The lift shaft is a glass column joining the floors. The route is painted on the floor in accent, and objects can hide it, as they would in reality.
- **Controls:**
  - Orbit (15° steps, ±45° buttons with a compass that follows the rotation);
  - Tilt (20–75°);
  - Floor gap (0–12 m, separating the floors).
- **Layers:** Machines, Furniture & equipment, Storage, Walls, Route, Floor 1.
- **Selection:** click any object, or use the "Jump to" list, which keyboard users can reach. The object turns accent-coloured, gets a callout tag, and the panel shows name, type, category, footprint, model height, room and floor, with **Route here** and **Move…** (which leads into the edit flow).
- **Where it's used:** the 2D/3D toggle on the Navigate screen switches to this view. Routes, highlights and pending edits use the same events in 3D.

### 07 3D object kit (`Kit3D.dc.html`)
The dataset's object types rendered as massing models, each next to a 1.75 m person, labelled with the real median footprint and the number of instances across the 280 kit buildings. See section 8 for the rules.

### Visual system (`Style.dc.html`)
Principles, colour tokens, type scale, components (buttons, chips, floor switcher, ask field, direction row) and the map legend.

---

## 4. States every screen must handle

| State | Treatment |
|---|---|
| **Thinking** | Status line under the last message, fed by `status` events ("Finding a step-free route…"); the map pulses the room being resolved |
| **Ambiguous place** | If one candidate is clearly nearest or matches the floor, pick it and offer a chip for the others. Otherwise ask once, with candidates as tappable chips that also highlight on the map |
| **No route** | Amber notice: why (closure or step-free), plus the best alternative ("Reopen Lift 0.18?" / "Nearest reachable: Office 0.23") |
| **Unknown room** | "I can't find room 9.99. Did you mean 0.29 or 0.39?" as chips |
| **Edit pending** | Dashed preview on the map and the card in the panel; any other request asks to confirm or cancel first |
| **Offline / API error** | Map and search keep working (the core is local); chat shows "I can't reach the assistant right now. Search and routes still work." |
| **Empty (new session)** | Ask field focused; 3 example chips relevant to the building type (factory: "Where is the CNC mill?", "Fastest route to Dock B", "Close the office lift") |

---

## 5. Interaction details

- **Click a room:** it becomes "you are here" (`set_location`) or a destination. A small popover offers both.
- **Floor changes during a route:** the map follows the route leg by leg; connector legs show a badge ("Office lift → Floor 1").
- **Start guidance:** collapses the panel into the turn card (as in the voice screen) and advances by voice or tap.
- **Undo:** always reachable from the Active changes list; voice "undo" works too.
- **Motion:** route draws on in 600 ms (stroke-dashoffset); the destination pulses twice, then stops. Respect `prefers-reduced-motion`.

---

## 6. Accessibility

- Text contrast is at least 4.5:1 on its background. Small grey labels use #8B8D94 or lighter on #111214; accent-coloured *text* uses #9DB6FF, not the button blue.
- Real `<button>`, `<input>` and `<label>` elements; icon buttons have `aria-label`; the floor switcher uses `aria-pressed`; the progress bar uses `aria-current="step"`.
- The map SVG has a text description; the directions list is the accessible equivalent of the drawn route.
- Step-free mode is one tap and is remembered; it's shown as a chip on every route.
- Colour is never the only signal: closed elements carry a CLOSED or BLOCKED tag, pending edits are dashed, warnings have an icon.

---

## 7. Tokens (for `web/`)

```css
:root {
  --ground: #050506;  --panel: #111214;  --raised: #1A1B1F;  --line: #26282D;
  --text: #EDEDEF;    --text-2: #A3A5AC; --text-3: #8B8D94;
  --map-room: #15161A; --map-walk: #1D1F24; --map-stroke: #2B2D33; --map-object: #24262B;
  --accent: #3E6AE1;  --accent-text: #9DB6FF; --accent-tint: #1E2A4A;
  --caution: #F2A93B; --caution-text: #F6C77A; --caution-tint: #2A2212;
  --positive: #3FBF7F;
  --radius-sm: 10px; --radius-md: 16px; --radius-lg: 18px; --radius-pill: 999px;
  --font-display: "Montserrat", sans-serif; --font-body: "Inter", system-ui, sans-serif;
}
```

## 8. 3D objects: modelling rules

The dataset has **96 object types** (machines, equipment, fixtures, furniture), each with `position`, `footprint.width_m`, `footprint.depth_m`, `rotation_deg`, `category` and `type`, but **no height or shape**. Every object is rendered as a *massing model* built from its real footprint.

| From the data | From the kit |
|---|---|
| Position (asset centre), width, depth, rotation, floor elevation | Height and form: a short list of boxes and cylinders per type, scaled to the footprint |

**Archetypes.** Each entry gives the parts, then the model height. The code is in `design/project/Kit3D.dc.html`.

| Type(s) | Parts | Height |
|---|---|---|
| `cnc_mill`, `cnc_lathe`, `milling_machine` | Base, raised enclosure, control panel | 2.2 m |
| `injection_moulding_machine`, `press_brake` | Long base, clamp unit, barrel, hopper | 2.2 m |
| `industrial_3d_printer`, `curing_oven`, `laser_cutter` | Cabinet with a lighter top | 1.9 m |
| `3d_printer` | Stand, glass build chamber, lid | 1.4 m |
| `conveyor` | Legs every 2.2 m, belt, parcels | 1.3 m |
| `robot_cell` | Glass fence, base, two-segment arm, work table | 2.1 m |
| `forklift` | Body, four posts, overhead guard, mast, forks | 2.4 m |
| `waterjet_cutter` | Tank, gantry posts and beam, cutting head | 2.3 m |
| `pallet_rack` | Uprights every 2.7 m, 3 shelf levels with pallets | 4.5 m |
| `server_rack`, `ups_unit` | Dark box | 2.0 m |
| `desk` (+ `office_chair`) | Side panels, top; chair with post, seat, back | 1.0 m |
| `meeting_table`, `seminar_table`, `canteen_table` | Pedestal, top, chairs both sides (one per 0.8 m) | 0.9 m |
| `kitchen_counter` | Base, worktop, wall cabinets | 2.2 m |
| `fume_hood` | Base cabinet, glass sash, top | 2.4 m |
| `locker`, `wardrobe`, `filing_cabinet` | Twin tall boxes | 1.9 m |
| `fire_extinguisher` | Cylinder with nozzle | 0.65 m |
| `toilet`, `sink` | Cistern and bowl | 0.8 m |
| **Any other type** | One box at the category height: machine 1.8, equipment 1.2, fixture 0.9, furniture 0.75 m | |

**Look:**
- One muted tint per category: machine #5C677B, furniture #6F6963, equipment #747880, fixture #8D9198, storage #545A64.
- Faces are lit from the north-west (top ×1.0, sides 0.5–1.0 by angle). Part tones: base ×1.0, light ×1.3, dark ×0.62. Glass is #A9B4C8 at 16–20% opacity.
- Only the **selection** and the **route** use the accent colour.

**Building:**
- Rooms are floor tiles coloured by space type, with cut-away walls 1.0–1.2 m high, so the inside is always visible from above.
- Floors stack at `elevation_m`, with a user-controlled gap.
- Lifts are glass columns spanning their floors; stairs are stepped blocks.

**Production implementation** (`web/IsoView`, three.js):
- Build each archetype once as merged geometry for a 1 × 1 footprint. Render one `InstancedMesh` per archetype part, scaled to each asset's width and depth and rotated by `rotation_deg`. A 5,250-asset building stays a few dozen draw calls.
- Rooms are an `ExtrudeGeometry` of the polygons (floor 0.05 m, walls 1.0–1.2 m along the outlines). The route is a flat ribbon at +0.05 m with a glow.
- **Level of detail:** below a zoom threshold, every object collapses to its fallback box.
- Picking by raycast, returning the asset id, which drives the same selection panel. Orbit controls clamp tilt to 20–75°.
- The design canvas draws the same models with an SVG painter's algorithm only so the mockup can run without a 3D library. The geometry rules are identical.

## 9. Mapping to backend events (LLD section 10)

| UI element | Event |
|---|---|
| Status line | `status` |
| Highlighted room, auto floor switch | `highlight` |
| Route line, Understood card, route pill, directions | `route` (+ `assistant_message`) |
| Pending-change card, dashed preview | `edit_preview` |
| Map refresh after confirm or undo | `building_changed` |
| Error notice | `error` |
