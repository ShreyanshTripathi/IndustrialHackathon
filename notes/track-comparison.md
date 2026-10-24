# Track overview and comparison

> Source: Claude Code session `af8ef3c5`, 23–24 Oct 2026. Saved from the conversation as-is.

## Q: Hey, I am participating in a hackathon, this hackathon is about industrial agents. You can learn more about it here: https://www.industrialagents.dev/?utm_source=luma

There are 3 tracks by 3 companies: synera, tacto, certivity

Look at the link and tell me what you understand.

*2026-10-23 20:59 UTC*

The page is mostly logistics. It doesn't publish the actual track problems yet.

## The event
- **What:** Industrial Agents Hackathon ("Build agents that run. What counts comes after.")
- **When:** **Tomorrow and Sunday, 24–25 Oct 2026**, in person in Munich at UnternehmerTUM. Accepted participants get the exact address on Luma.
- **Who runs it:** Manage & More (UnternehmerTUM's program) and **UVC Partners**, a B2B deep-tech VC. Partners from UVC sit on the jury.
- **Sponsors:** Anthropic is the lead partner and gives every team Claude credits. ElevenLabs and Lovable are tech partners.
- **Size:** about 100 builders, in teams of 2–4. Solo people form teams on Saturday morning.
- **Prizes:** more than €6,000 in total. You demo to the jury, and afterwards there are investor conversations or hiring processes. No per-track cash breakdown is listed.

## Schedule
| Sat 24 | Sun 25 |
|---|---|
| 10:00 doors, keynotes, **track briefings**, team formation | Overnight: venue open |
| 12:00 hacking starts | **13:00 code freeze** |
| Afternoon: office hours with the challenge owners | 13:30 track judging |
| Evening: dinner, venue open overnight | 15:00 finals on stage |

That gives you about **25 hours** of hacking.

## The tracks
Each track comes from a company in UVC's portfolio, and the page says they cover "problems they haven't solved yet." **The page gives no problem statements, data, APIs or judging criteria.** Those will almost certainly come at the 10:00 briefing. The company descriptions below are from my own background knowledge, not the page, so double-check them:

- **Synera:** an engineering workflow automation platform. It connects CAD, CAE/simulation and PLM tools so engineering processes can be automated, and it has been moving toward AI agents for engineers.
- **Tacto:** a Munich-based procurement platform for mid-sized manufacturers. It covers supplier management, spend analysis, price negotiation and sourcing.
- **Certivity:** regulatory compliance for product engineering. It turns regulations and standards (automotive and homologation, for example) into concrete engineering requirements and tracks whether products meet them.

The page also shows an example "agent trace" that isn't tied to any track. It handles an engineering change (ECN-0932) using tools like `plm.affected_assemblies`, `cad.check_fit` and `erp.open_orders`. That's a strong hint about the kind of agent they want: one that **acts across real industrial systems** (PLM, CAD, ERP), not a chatbot.

## What they're judging
The criteria aren't published. The page says it looks for "agency, and the drive to work on frontier problems", and the tagline stresses agents that *run*. My reading is that working, end-to-end demos on realistic workflows will beat slideware.

## Things to check
- **Applications closed 18 Oct.** If you aren't accepted yet, check your Luma status. The organizer contact is akshat.tandon@tum.de.
- The "Terms" link is a PDF the fetch couldn't extract. From the filename it looks like a privacy policy, not rules.

If you'd like, I can help you prepare tonight. For example, I could sketch agent setups for each track (likely tools and data, demo ideas) so you're ready to pick a direction after the briefings.

Two of the three tracks don't need guessing: **Synera and Tacto have already published their real challenge kits on GitHub**, and I checked both repos myself. Only Certivity's challenge is still unknown. Either kit could change a little at kickoff, but the authors are the companies' own engineers and both were updated today.

## Track 01, Synera: "Talk to Your Building" (confirmed)
**Repo:** github.com/Synera-GmbH/industrial-agents-hackathon-2026

It's indoor navigation, not CAD. You build an indoor "Google Maps" for offices, campuses and factory halls that people talk to: *"Where's the 3D printer?"*, *"Step-free route to the CNC mill on floor 2"*, *"Add a door between 2.03 and 2.04"*, *"The east lift is closed, what changes?"*

- **Levels:**
  1. Find things on one floor.
  2. Route on one floor, including step-free routes and closures.
  3. Several floors and buildings, with stairs and lifts.
  4. Build a building from floor plans by conversation.
  5. One optional extra: forklift logistics, moving assets, voice, AR, or a 3D view.
- **Data:** 280 buildings with floor-plan JSON, equipment lists and plan images, plus train and dev questions with answers and 145 test questions without answers. There's also a starter agent on Claude that deliberately scores under 5%.
- **Scoring (100 points):**

  | Part | Points | What counts |
  |---|---|---|
  | Does it work | 55 | Automated benchmark, including **one unseen building released on Sunday** |
  | Interaction | 25 | A scripted conversation with tricky users; voice counts |
  | Creativity | 10 | Level 5 and extras |
  | Video and write-up | 10 | Demo video and technical explanation |

- **How to win:**
  - The test questions are geometry and graph maths: floor areas, shared walls, wide-door delivery reachability, 3D distances, "what if we add a door".
  - Build exact Python tools (shapely, networkx) and let Claude only route questions to them and talk to the user.
  - Reach 100% on the dev set first, then work on the voice and UX.

## Track 02, Tacto: "Negotiation Arena" (confirmed)
**Repo:** github.com/tacto-playground/negotiation-arena-kit, published by Tacto's Head of Engineering.

You are the purchasing team of a fictional Bavarian pump maker. You build a **fully autonomous buyer agent** that negotiates by e-mail with **LLM supplier bots** that Tacto hosts. Case types are price increases, renewals, RFQs, bundling, raw-material clauses, capacity and quality escalations.

- **Data:** a 24-table ERP-style SQLite database, with suppliers, 5,400 purchase-order lines, contracts and clauses, real price indices, should-cost estimates, news, and 208 e-mails and notes. The ERP quirks (duplicate suppliers and so on) are deliberate.
- **Scoring:** a total-cost formula covering price, payment terms, freight, defects, index risk, and a penalty for squeezing a strategic supplier below a sustainable margin. Each case scores 0–1 between the opening quote and a hidden best deal.
- **Live Final, Sun 13:30:** 5 waves of hidden cases, 8 minutes each, with **no human in the loop**. The top 5 by points pitch, and the jury picks places 1–3.
- **Where the edge is:**
  - The levers are hidden in the documents. For example, one supplier's price-increase letter gives 51 days' notice when the contract requires 90. Another supplier wants faster payment, so you can trade payment days for price.
  - Arguments you cite get checked automatically, and contradicted claims cost trust.
  - Put the numbers in code, profile each supplier before the clock starts, and never miss the 60-second limit per move.

## Track 03, Certivity: still a prediction
Certivity is RegTech from Munich. It turns regulations into structured, paragraph-level data and exports AI-drafted requirements into tools like Polarion, DOORS and Jama. Customers include Mercedes, BMW, ZF and TÜV. Their Head of AI uses Claude and has written publicly about agents that build up context over time and produce audit-ready evidence packages. The organizers call their challenge "messy, document-intensive work with high stakes."

Most likely challenges, in order:
1. **Regulatory change impact:** two versions of a UNECE or EU regulation plus mock requirements and tests. The agent diffs the versions, finds what's affected, drafts updates with paragraph citations, and asks a human before writing anything back.
2. **Compliance gap and evidence package:** a regulation (e.g. UN R155 cybersecurity) plus engineering documents. The agent produces a covered / partial / missing matrix with evidence links.
3. **Verified requirement generation:** turn regulation text into testable requirements, with a checker step so nothing is invented or dropped, and flag conflicts with the customer's own specs.
4. **Applicability check:** given a product and target markets, which rules apply and by when.

Whichever it turns out to be, they will reward **paragraph-level citations, a human approval step, and a small evaluation that proves accuracy**.

## Things to know before tomorrow
- **Times differ between sources.** Tacto's kit says kickoff is **10:30 at the Tacto office**, the website says 10:00, and hacking is at Munich Urban Colab.
- **Clocks go back overnight** (03:00 becomes 02:00).
- **Both kits release new data on Sunday.** Synera releases an unseen building; Tacto releases new data at 08:00.
- **Finalist counts differ.** Tacto takes its top 5 by score; Synera's kit says 4.
- **Which track:**
  - **Tacto** is the most objective and competitive: a live leaderboard with autonomous agents.
  - **Synera** rewards solid engineering plus UX and is the most demo-friendly.
  - **Certivity** is the most open-ended. It's a good fit if your team is strong on documents and LLM reliability.

Both kits are cloned on your machine:
- `../industrial-agents-hackathon-2026`
- `(old temp clone) negotiation-arena-kit`

I can get one of them running tonight. That would mean running Synera's starter agent and scorer on the dev set, or Tacto's local simulator, so you start with a working baseline. I can also turn this into a page you can share with your team.

## Q: check again for certivity, did they add something?

*2026-10-24 03:35 UTC*

Yes. Certivity published its kit last night: **github.com/Certivity/industrial-ai-hackathon**. Their Head of AI & ML, Saahil Ognawala, pushed it on 23 Oct at 21:20. I cloned and read it, so all three tracks are now confirmed.

## Track 03, Certivity: "From a product spec to the requirements it must fulfil"

The two goals match two of my predictions from yesterday: requirement generation and change impact.

**Main goal (required)**
- **Input:** a product spec (markdown) and/or an exploded-view image.
- **Output:** a JSON list of every engineering requirement the product must meet under UN Regulations. Each one cites the regulation, version and page, with paragraph optional.
- **Example case:** a passenger-car rear lamp (position, stop and reversing lamps, lens, retro-reflector, LED on PCB). The expected answer has **190 requirements**:

  | Regulation | Requirements | What it covers |
  |---|---|---|
  | UN R148 | 63 | Light-signalling devices |
  | UN R48 | 56 | Installation of lighting |
  | UN R150 | 39 | Retro-reflectors |
  | UN R10 | 32 | EMC, because of the LEDs |

- **Scoring:** precision and recall against a golden dataset made by their regulatory experts, at three levels:
  1. Did you pick the right regulations, and only those?
  2. Did you cite the right pages? The page or the paragraph number is enough, and being off by one page doesn't cost you.
  3. Does each requirement match one expected obligation one-to-one? A model on their platform judges this by meaning.
- **UI** is a secondary score, judged by the jury.

**Sub-goal (optional)**
- **Input:** requirements derived from an old regulation version, plus the new version.
- **Output:** which requirements are modified, removed or added, and why.
- **Example:** UN R175 (pedal-error acceleration control), 94 old requirements. The expected answer has 24 changes: 17 added, 6 modified, 1 removed.
- **Scoring:** recall of the flagged requirements and accuracy of each stated change.

**Rules that matter**
- **You submit outputs, not code.** Certivity never runs your code.
- **The held-out case that decides the ranking is released Sunday morning.** Run `git pull` and then `tools/fetch_regulations.py` again.
- **For the held-out case your *last* valid upload counts, not your best.** Don't upload something worse at the end.
- You get 5 uploads per hour per challenge.
- You may only cite the 56 regulations in `regulations/index.json`. Cite the **base** version; a page from the latest version counts as wrong.
- Certivity pre-selects the finalists, who pitch from 15:00.

## Insights from the example
- **There's a trap in the regulation list.** The index includes the old single-device regulations (R7 position/stop lamps, R23 reversing lamps, R3 retro-reflectors). The expected answer uses only the newer consolidated ones, R148 and R150, which replaced them. Citing the old ones costs you precision at the regulation level.
- **Products pull in regulations you wouldn't think of.** A lamp brings in R48 (vehicle installation) and R10 (EMC, because of the electronics). Choosing regulations means reasoning about materials and electronics, not only matching titles.
- **Recall needs to be close to exhaustive.** 190 obligations for one lamp means you have to pull every "shall" sentence from the relevant sections. The expected requirements stay close to the regulation's own wording, so careful extraction plus filtering will probably beat free-form LLM generation.
- **A pipeline that should work:**
  1. Choose regulations from the spec.
  2. Parse each base PDF into paragraphs with page numbers, deterministically.
  3. Keep only the sections that apply, e.g. stop and reversing lamp sections of R148 but not direction indicators.
  4. Split each paragraph into one obligation per requirement.
  5. Tune against the dev case with `tools/score_local.py`, which scores the regulation and page levels offline.
- **For the sub-goal,** do a paragraph-level diff of old vs. new, then map each changed paragraph to the old requirements. Most of the expected changes are *added*, so new paragraphs matter as much as edited ones.

## All three tracks at a glance
| | Synera | Tacto | Certivity |
|---|---|---|---|
| Task | An indoor-navigation agent you talk to | An autonomous e-mail negotiation agent | Spec to regulatory requirements, plus change impact |
| What gets scored | Code run on a benchmark plus interaction | A live agent against supplier bots | A JSON file you upload |
| Decided by | An unseen building on Sunday | 5 live waves, Sun 13:30 | A held-out case on Sunday morning |
| Main skill | Geometry and graph tools plus UX | Data mining, cost maths, strategy | PDF parsing and extraction precision |

The kit is cloned at `(old temp clone) industrial-ai-hackathon`. If you choose this track, I can download the regulation PDFs and build a first extraction pipeline scored against the rear-lamp example, so you start with a baseline score.

## Q: given that I have a lot of claude credits that I can use to build stuff quickly, which one of these projects do you think I should pick. Judge this on the following criteria: probability of other people choosing this, technical feasibility, and other criteria that you feel fit.

*2026-10-24 03:48 UTC*

**I'd pick Certivity.** Of the three tracks, it's the one where a big Claude budget most directly turns into a higher score, and it's probably the one fewest teams will choose.

## Scorecard (5 = best for you)

| Criterion | Synera (indoor nav) | Tacto (negotiation) | Certivity (requirements) |
|---|---|---|---|
| **Low competition** | 2: voice, 3D and maps attract builders | 1: a live leaderboard against bots is the "fun" track | **4**: dense regulation PDFs put many people off |
| **Technical feasibility** | 3: many parts (geometry tools, UI, voice, video, write-up) | 3: the starter kit runs, but strategy is hard and you can't change anything during the final | **4**: a batch pipeline plus PDF parsing, and you can test it locally |
| **Credits help** | 2: they speed up coding, but the score comes from deterministic geometry | 2: the 60-second limit per move and 200 practice sessions a day cap you, not cost | **5**: no time limit, so you can run every paragraph through Opus several times and cross-check |
| **Clear, objective scoring** | 4: exact benchmark plus a 25-point rubric | 2: hidden supplier behaviour and 5 one-shot waves, so luck matters | **4**: precision and recall against a golden set, with a dev case and local scorer |
| **Risk on Sunday** | 3: unseen building, and your code must run in one command | 2: laptop, network and rate limits must all hold through a live hour | **4**: you upload files only, nothing of yours runs live |
| **Demo appeal** | **5**: talk to a building, animated routes | 4: live negotiation replays | 2: a list of requirements; the UI has to carry it |
| **Upside after the event** | 3 | 3 | 4: their Head of AI builds on Claude and is hiring for exactly this |

## Why Certivity
1. **Credits turn straight into score.** Recall is the main metric, and 190 requirements for one rear lamp means you need to be close to exhaustive. You can spend heavily on accuracy: Opus extracting every "shall" obligation paragraph by paragraph, a second pass that checks each one against the source text, and an applicability filter for each product function. Other teams will rationing tokens or using one big prompt and will miss obligations.
2. **Fast feedback loop.** `score_local.py` scores you against a known answer offline. You can iterate dozens of times on Saturday, while Tacto teams are limited to 200 sessions a day against changing bots.
3. **Specific insight is rewarded.** Picking R148/R150 over the outdated R7/R23/R3 is exactly the kind of reasoning that separates teams on regulation-level precision. Most teams will cite the outdated regulations because the titles match.
4. **Nothing of yours runs live.** You upload JSON, so a crashed laptop at 13:30 can't wipe out your weekend.

## Risks and how to handle them
- **The held-out case arrives Sunday morning, and the deadline isn't stated.** Have the pipeline running end to end on the dev case by Saturday night, so Sunday is just `git pull`, run, review, upload. Ask at office hours exactly when uploads lock.
- **Your *last* valid upload counts.** Only upload when local metrics improve, and keep a known-good file ready.
- **The requirement-level matching is a model run on their platform, and you can't see it.** Copy the granularity and wording style of `expected.json`, which stays close to the regulation text. Use your uploads on the dev case to calibrate.
- **The demo is dry.** Spend a few hours on a Lovable UI: upload a spec, see the chosen regulations with reasons, click a requirement to see the highlighted PDF page, and show the sub-goal diff. The UI is the secondary score.
- **The sub-goal is optional but cheap.** It reuses the same parsing, and it's the "regulation changed, what breaks?" story that sells well in the pitch.

## When I'd pick something else
- **Synera:** if your team has a strong frontend and voice person and you want the most impressive demo. Many teams will build a nice UI and score poorly on the benchmark. Exact geometry tools alone would put you ahead of them.
- **Tacto:** only if you really enjoy game theory and negotiation strategy. It's the most crowded track and the most down to luck.

How busy each track gets is my estimate; you'll see the real split at kickoff. If you go with Certivity, I can start now: download the PDFs, build the parser that gives every paragraph its page and paragraph number, and get a first local score on the rear-lamp case, so you arrive tomorrow with a working baseline.

## Q: which of the startups: Synera, Tacto is better suited to my profile?

*2026-10-24 06:02 UTC*

I found your CV at `~/Documents/ResumeNov2026.pdf` (the most recent one) and judged your fit from that.

**Go with Tacto.** Both tracks suit you, but Tacto rewards the skills that are distinctive about you, while Synera mostly rewards things any good team can do with Claude.

## Your background against each track

| Your experience | Tacto (negotiation arena) | Synera (indoor nav) |
|---|---|---|
| Multi-agent systems at MPI-SWS (agents communicating, best-of-N sampling, world models) | **Direct hit.** It's your agent against supplier agents. | Weak. It's a single agent with tools. |
| Volty, 1st prize: an energy auction plus AI trading agents that raised earnings 19% in simulation | **Direct hit.** Same shape: an economic agent optimising a cost function against other parties. | Partial, through the voice assistant only. |
| AI security red-teaming | **Valuable.** The brief says "weaknesses you find in our bots" count, and the jury sees every replay. | Not used. |
| Simulator work at MPI-INF | **Valuable.** Build your own supplier-bot simulator to test against. | Not used. |
| Graph algorithms, routing | Not used. | **Fits** the route graph. |
| Computer vision (Mask R-CNN, U-Net segmentation) | Not used. | **Fits** Level 4 (floor-plan image to building). Claude vision will cover much of that for other teams too. |
| Next.js, voice (Whisper/Piper) | Little use, since the final has no UI. | **Fits** the 25-point interaction score. |
| Payment-data ranking (A/R), finance NLP | Some fit with invoices and payment terms. | Not used. |

On Synera, the 55 benchmark points come from exact geometry code: polygon areas, shared walls, reachability. Claude Code writes that equally well for every team, so your research edge doesn't count for much there. On Tacto, the gap between a naive prompt agent and a rigorous one is huge, and rigour is your profile.

## How to use your edge on Tacto
1. **Search over offers in code.** At each move, generate many candidate term sheets, score them with `arena_kit.total_cost()` plus an estimate of the supplier's margin, and send the top 3. Watch which one the supplier moves on to learn what it values, as you would in a bandit problem.
2. **Profile each supplier from the data.** Before the clock starts, mine the notes, e-mails, overdue-invoice letters, should-cost and contract clauses to estimate each supplier's cost floor and pressure points. Example: the 51-day notice in a letter where the contract requires 90.
3. **Build a local copy of the opponents.** Use your credits to make LLM supplier bots that imitate Tacto's behaviour: a cost floor, a boss who must approve, reactions to tone. Run thousands of negotiations offline. That gets you past the limit of 200 practice sessions a day, and it's the biggest way credits help in this track.
4. **Probe the bots, but stay realistic.** Test how they handle claim checks, `final_offer` and walk-away thresholds. The jury will ask "would this work on a real supplier?", so legitimate exploits are fine and pure prompt tricks will hurt your pitch.
5. **Pitch your background.** "Multi-agent researcher who already won with trading agents" is credible to Tacto. They're also hiring AI and forward-deployed engineers in Munich.

## When Synera is the better choice
- Your team is mostly frontend and product people, or you mainly want an impressive demo.
- You'd rather avoid the luck of five one-shot live waves. Synera's scoring is more predictable.

Certivity is still an option: your Aidetic work extracting data from financial PDFs is directly relevant, and it's the least crowded track. Between Synera and Tacto, though, **Tacto fits you better**.

I can set up the Tacto kit tonight: install it, run the naive and LLM agents against the local simulator, and sketch the offer-search and supplier-profiling modules. You'd still need a team API key from `arena.tacto.ai/apply` for the hosted practice cases.

## Q: How much business understanding is needed for both these cases?

*2026-10-24 06:42 UTC*

**Tacto needs quite a lot of business understanding. Synera needs very little.**

## Tacto: medium to high
The scoring formula is all business concepts. You don't need to be a procurement expert, because the brief defines everything and the code computes the cost. But to make good decisions you need to understand these ideas:

| Concept | In simple terms | Why it matters |
|---|---|---|
| **Payment terms** | "60 days net" means you pay 60 days after delivery | Paying sooner costs you money (8% a year), but a cash-short supplier may give a discount for it |
| **Total cost** | The real cost of a deal, not just the price | A cheap price with a short contract can be worse than the opening offer |
| **Should-cost and margin** | What the part costs the supplier to make, and how much profit it keeps | Shows how far the price can drop, and when you're squeezing too hard |
| **Price index clause** | The price follows a market index, like steel | Shifts price risk between you and the supplier |
| **Incoterms** (EXW, FCA, DAP) | Who pays for shipping | Changes your total cost |
| **Notice period** | How early a supplier must announce a price increase, per the contract | A letter that breaks it is a strong argument |
| **Category strategy** | Treat suppliers differently: protect the critical ones, push hard on easily replaceable ones | Squeezing a strategic supplier costs you points |
| **Your alternative** | What you get if you walk away | Decides when to say no |
| **Negotiation basics** | Anchoring, trading one thing for another, not revealing urgency | This is what moves the bots |

**How long it takes to learn:** a few hours of reading the brief and the company profile. Your business minor and your freelance work prioritising unpaid insurance bills (also about payment behaviour and money over time) give you a head start.

**Where business sense makes the difference:** reading a supplier's situation from the notes. For example: "This owner is short of cash and values loyalty, so I'll offer faster payment instead of pushing the price." That kind of judgement separates good teams from average ones.

## Synera: low
It's mainly a geometry, graph and UX problem. The ideas you need are everyday ones:
- Floors, rooms, doors, stairs, lifts
- Step-free routes and door widths (accessibility)
- Basic factory logistics: forklifts, blocked aisles, delivery docks

You need to **empathise with users** (a first-day employee, a wheelchair user, a technician with full hands) more than you need business knowledge. Business thinking only helps in the pitch and the creativity points, e.g. explaining who would pay for this: facility managers, factories, hospitals.

## Bottom line
| | Tacto | Synera |
|---|---|---|
| Business knowledge needed | Medium to high, but learnable in an afternoon | Low |
| Main skill | Economic reasoning, negotiation, data analysis | Geometry and graph code, UX, voice |
| Your fit | Strong: agents, simulation, business minor, payment data | Good: graphs, computer vision, frontend, voice |

If you'd rather avoid business concepts entirely, Synera is the simpler choice. If you're comfortable spending a few hours on procurement basics, Tacto still suits your profile better.

## Q: What are the deliverables for both?

*2026-10-24 06:45 UTC*

Both tracks have the same deadline: **Sunday 13:00 (code freeze), uploaded to the organisers' platform.**

## Tacto: hand in the agent, then let it play live

**By 13:00:**
1. **Your code repo:** the agent plus a README saying how to run it (setup, the names of the environment variables it needs, and the start command). Include the **commit hash** of the exact version that will play the final. No API keys in the repo.
2. **A short description of your approach:** how the agent prepares, what it reads in the data, how it decides what to offer, and when it accepts or walks away.

**At 13:30, the live final:**
3. **Your agent, already running** on your own laptop with your own LLM key, before the final starts. It plays 5 rounds of secret cases by itself, with no human allowed to touch it. Tacto checks the top 5 teams for any code pushed after the freeze.

**Only if you make the top 5:**
4. **Slides and a pitch:** 5 minutes plus 2 minutes of questions at 15:10. You walk the jury through one of your agent's negotiations.

**Your score is the live final result.** Practice scores don't count towards it.

## Synera: hand in a product, an answers file and a video

**By 13:00:**
1. **An answers file (CSV):** your agent's answer to each of the 145 test questions, every answer ending in a line `Answer: <number or name>`. The kit has a script that writes this file for you.
2. **Sunday building answers:** shortly before code freeze they release one new, unseen building with questions. You run your system on it and submit the output.
3. **Your code repo,** including a `BENCHMARK.md` that explains how to run everything with **one command**, no manual steps. They may re-run it to check.
4. **A demo video** of your app in use.
5. **A short technical explanation:** architecture and tech stack.

**Only if you're one of the 4 finalists:**
6. **A pitch:** 3 minutes plus 1 minute of questions at the Tacto office.

**How it maps to the score:** the answers (1–3) give up to 55 points. The app itself, judged on interaction, voice and extras, gives 35. The video and write-up give 10.

## Side by side
| | Tacto | Synera |
|---|---|---|
| Code repo + README | ✅ | ✅ (+ `BENCHMARK.md`) |
| Written explanation | Short approach description | Short technical explanation |
| Something that runs live | ✅ Agent plays the final itself at 13:30 | ❌ You run it yourself and upload the results |
| Answers file | ❌ | ✅ 145 test questions + the Sunday building |
| Demo video | ❌ | ✅ |
| User interface | Not needed | Needed (25 points for interaction) |
| Pitch | Top 5: 5 + 2 min | Top 4: 3 + 1 min |

**Tacto** has fewer things to hand in, but everything rides on your agent performing in one live hour. **Synera** has more things to hand in (UI, video, answers), but there's no live risk: you run everything yourself before the deadline.

## Q: okay which one of these should I choose?

*2026-10-24 06:46 UTC*

**Choose Tacto.**

**Why Tacto:**
1. **It plays to what's unusual about you.** Multi-agent systems, simulations, trading agents (your hackathon win), red-teaming. Most teams will only tweak the starter prompt. Your edge is the code around it: cost maths, offer search, supplier profiles, a test simulator.
2. **Less to deliver.** No UI, no video, no answers file. All your time goes into making the agent good.
3. **The scoring is clear.** Every practice case gives you an exact score and the supplier's reasons in words, so you always know what to fix.
4. **The upside.** A top-5 pitch in front of the jury, and Tacto is hiring AI engineers in Munich.

**What you're accepting:**
- **It's the most popular track**, so expect strong competition.
- **One live hour decides everything.** A crash or a slow model at 13:30 can cost you. You manage that with a deterministic fallback message, a rehearsal on Sunday morning, and the laptop on power.
- **A few hours learning procurement basics** (payment terms, total cost, margins). It's all in the brief.

**When to pick Synera instead:**
- Your team is mostly frontend or product people, or
- You'd rather have no live-final risk and a product you can show (UI, voice, 3D), or
- After reading the Tacto brief at kickoff, the business side really doesn't appeal to you.

**For tomorrow morning:**
- At kickoff (10:30), **get your Tacto API key at the desk straight away.**
- Ask the organisers whether code written before hacking starts is allowed, how many cases each final wave holds, and whether the hidden suppliers are already in the data.
- If you're forming a team, look for someone who enjoys data analysis or negotiation and someone solid on backend reliability.

Tonight I can help with preparation that isn't code: a short profile of each supplier, or a cheat sheet of the procurement basics you'll need.
