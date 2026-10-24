# Synera case: "Talk to Your Building", explained

> Source: Claude Code session `af8ef3c5`, 23–24 Oct 2026. Saved from the conversation as-is.

## Q: okay now let's discuss the synera case: explain the case in simple terms.

*2026-10-24 06:31 UTC*

## The Synera challenge: "Talk to Your Building"

**The problem.** Outdoors, you type an address into Google Maps and it shows you the way. Indoors, in a big office, a university or a factory, there's nothing like that. Floor plans are PDFs, the list of machines sits in a spreadsheet, and the one person who knows where the 3D printer is has gone home.

**Your job.** Build an app that gives any building its own map you can *talk to*. You feed it a floor plan, it learns the building, and then anyone can ask it things.

## What people should be able to ask
- **Find:** "Where's the 3D printer?"
- **Route:** "How do I get from the lobby to the CNC machine on floor 2 without stairs?"
- **Edit:** "Add a door between room 2.03 and 2.04."
- **React:** "The east lift is broken. What changes?"

They imagine different users: someone on their first day who knows no room names, a wheelchair user who always needs step-free routes, a technician with full hands who wants voice directions ("turn left at the press"), a forklift driver whose aisle is blocked, and a facility manager who moves machines around.

## The five levels (each builds on the last)
1. **Find** things on one floor and show them on a map.
2. **Route** from A to B on one floor, including step-free routes, closed areas and multi-stop trips.
3. **Scale up** to several floors and buildings, with stairs, lifts and walkways.
4. **Build** a new building from floor-plan images by conversation, "in minutes, not days".
5. **Optional extra,** pick one: forklift routing in a factory, machines that move, voice, a 3D view, AR on your phone, and so on.

## What you get
- **280 buildings,** taken from real Swiss apartments, real Munich buildings (TUM, the airport, a shopping centre) and computer-generated factories and campuses.
- For each building: a file describing every room's shape and every door, staircase and lift, a list of equipment, and floor-plan images.
- **Practice questions with answers,** and **145 test questions without answers** that you'll be scored on.
- A **working starter agent** built on Claude, which deliberately scores under 5%.
- A **scorer,** so you can check yourself.

## What the test questions actually look like
These are precise maths questions about the building, not "where's the coffee?":

| Type | Example | Count |
|---|---|---|
| Total area | "Total floor area of all rooms on the ground floor?" | 33 |
| Shared walls | "How many rooms share a wall with room U20?" (for soundproofing) | 26 |
| Largest room | "Which is the biggest room on floor 1, and how big?" | 21 |
| Errand | "Grab the nearest office chair and carry it to the biggest room. How far do I walk?" | 20 |
| Delivery | "A 1 m wide trolley, no stairs, doors at least 1 m. Which rooms can it reach?" | 18 |
| Straight line | "Straight-line distance between two rooms on different floors?" (for a wireless link) | 15 |
| Room below | "Water is leaking in this room. Which room below gets wet?" | 9 |
| What if | "If we add a door here, how many rooms get a shorter way out?" | 3 |

Each answer must end with one exact number or name.

## How you're scored (out of 100)
| Part | Points | What it means |
|---|---|---|
| Does it work | **55** | Correct answers on the test questions, plus **one brand-new building released on Sunday** shortly before code freeze. Your system must answer with one command, no manual steps. |
| Interaction | 25 | A scripted conversation with tricky users: does it ask only what it needs, show what it understood, and give directions a person can follow? Voice counts. |
| Creativity | 10 | Your Level 5 extra and anything they didn't ask for. |
| Demo video and write-up | 10 | A clear video and technical explanation. |

There are no pitch rooms. You submit online by Sunday 13:00 (video, write-up, code and answers). Synera picks **4 finalists**, who pitch for 3 minutes.

## The key insight
More than half the points come from **exact geometry and route calculations**: areas, wall lengths, door widths, shortest paths. The AI is bad at doing those in its head and good at writing code that does them. So, as with Tacto, a winning team uses **code for the calculations and the AI for understanding the user and talking back**, and spends what's left on a nice, voice-enabled interface.
