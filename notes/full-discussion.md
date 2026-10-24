# Full discussion transcript

> Source: Claude Code session `af8ef3c5`, 23–24 Oct 2026. Saved from the conversation as-is.



---

### You · 2026-10-23 20:59 UTC

Hey, I am participating in a hackathon, this hackathon is about industrial agents. You can learn more about it here: https://www.industrialagents.dev/?utm_source=luma

There are 3 tracks by 3 companies: synera, tacto, certivity

Look at the link and tell me what you understand.

---

### Claude · 2026-10-23 21:00 UTC

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

---

### You · 2026-10-23 21:06 UTC

i already registered, now I want you to look at the pages, webiste and documents for each of these companies, basically all the information you can get, and predict what problems can they pitch to us tomorrow at the hackathon.

---

### Claude · 2026-10-23 21:06 UTC

I'll research all three companies in parallel, then put together the predictions.

---

### Claude · 2026-10-23 21:06 UTC

Three research agents are running, one each for Synera, Tacto and Certivity. Each one is going through the company's website, product pages, case studies, blog, job postings (a good signal for what they're building next), press and interviews. Once they report back, I'll combine everything into predictions of the problems each company is likely to pitch tomorrow.

---

*[Research subagent report: see [research/certivity.md](research/certivity.md)]*

---

### Claude · 2026-10-23 21:13 UTC

Certivity's research is done. I'm still waiting on Synera and Tacto, and I'll write up all three together once they finish.

---

*[Research subagent report: see [research/synera.md](research/synera.md)]*

---

### Claude · 2026-10-23 21:14 UTC

I checked the big finding myself: **Synera's real Track 01 brief is already on GitHub.** It's at github.com/Synera-GmbH/industrial-agents-hackathon-2026, committed by a Synera engineer at about 22:00 tonight. It's an indoor-navigation agent you talk to, which isn't what you'd guess from their CAD and simulation business. Tacto seems to have published its kit as well, a "Negotiation Arena". I've sent the Tacto research agent to read that repo in full. When it reports back I'll write up all three tracks together.

---

*[Research subagent report: see [research/tacto-company.md](research/tacto-company.md)]*

---

### Claude · 2026-10-23 21:15 UTC

The Tacto report came back before the agent got my note about the repo, so I'll check the kit myself.

---

### Claude · 2026-10-23 21:15 UTC

The Tacto kit is real. It's from Adrian Hupka, Tacto's Head of Engineering, with updates as recent as this morning, and it includes a brief, an API, a SQLite "world", contracts, a simulator and an MCP server. The Tacto agent is now reading it in full. Once it reports, I'll send you the final write-up for all three tracks.

---

*[Research subagent report: see [research/tacto-challenge.md](research/tacto-challenge.md)]*

---

### Claude · 2026-10-23 21:18 UTC

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

---

### You · 2026-10-24 03:35 UTC

check again for certivity, did they add something?

---

### Claude · 2026-10-24 03:35 UTC

Found it: Certivity/industrial-ai-hackathon, pushed last night. Cloning it now to read.

---

### Claude · 2026-10-24 03:36 UTC

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

---

### You · 2026-10-24 03:48 UTC

given that I have a lot of claude credits that I can use to build stuff quickly, which one of these projects do you think I should pick. Judge this on the following criteria: probability of other people choosing this, technical feasibility, and other criteria that you feel fit.

---

### Claude · 2026-10-24 03:49 UTC

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

---

### You · 2026-10-24 06:02 UTC

which of the startups: Synera, Tacto is better suited to my profile?

---

### Claude · 2026-10-24 06:03 UTC

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

---

### Claude · 2026-10-24 06:03 UTC

I also saved your background and the hackathon details (track repos, Tacto recommendation) to memory, so I'll have them in future sessions.

---

### You · 2026-10-24 06:07 UTC

give me certivity link github

---

### Claude · 2026-10-24 06:07 UTC

https://github.com/Certivity/industrial-ai-hackathon

The held-out case gets added to that repo on Sunday morning, so run `git pull` then.

---

### You · 2026-10-24 06:09 UTC

for tacto, I wanna build a plan, how can we approach the problem. Also is it a 2 player problem (my agent against Tacto's) or is it a multiplayer problem (my agent and other teams' agents against tacto's)?

---

### Claude · 2026-10-24 06:10 UTC

## 1. Is it two-player or multiplayer?

**Two-player, against Tacto's bots only.** Other teams never interact with your agent.

- **Each case is your buyer agent against 1–3 Tacto supplier bots.**
  - Most cases have a single supplier.
  - RFQ cases have 2–3 suppliers in parallel threads. You can play them against each other: citing a rival's quote is allowed, but it reveals that quote to the supplier you cite it to.
- **Every team gets its own sessions.** A supplier "remembers only within a case," so nothing another team does carries over to you.
- **Your score is absolute.** It's measured against a fixed best deal (`C_best`) per case, so other teams' deals don't change it. They only matter for ranking: the top 5 by points pitch.
- **The bots don't always reply the same way.** The rules say "identical messages need not get identical replies."

So this isn't game theory against other teams. It's modelling an LLM opponent, then optimising a cost function. That's close to the trading-agent work you did for Volty.

## 2. What actually decides the score
From `brief.md` and `api.md`:

1. **It's total cost, not price.** The levers are:
   - `unit_price`, `payment_days`, `effective_date` (pushing a price increase later)
   - `contract_months` and `volume_per_year` (uncovered need is charged at fallback price plus a risk percentage, so a short contract can score 0)
   - `incoterm`, `lead_time_days`, `ppm_commitment`, chargebacks, `index_clause`, tooling
2. **The best trades help both sides.** The supplier's margin is computed on cash, at *its own* cost of money. A supplier short of cash that gives a lower price for faster payment doesn't count as squeezed. These are the "find the trade" deals the brief hints at.
3. **Don't over-squeeze strategic suppliers.** In `stabilise` and `secure_supply` cases you're charged for every margin point the deal leaves the supplier below a sustainable margin.
4. **The binding limit is time, not rounds.** A wave lasts 8 minutes and a supplier reply can take about 60 s, so you realistically get **5–7 rounds** of the 10 allowed. Anything still open at the cap ends with no deal.
5. **Checkable claims.** At most 3 per message. A wrong figure counts as contradicted and costs trust. Correct data can disarm a supplier, but isn't automatically rewarded.
6. **Hard rules.** A broken must-have scores 0. Fields you leave out default to the supplier's standard terms in its quote PDF. Walking away is sometimes the best move.
7. **Practice gives you a free learning signal.** After every practice case you get the exact score, the cost breakdown, a trace with **the supplier's reasons in words**, and the supplier's internal back office.

**A data point I checked:** 46 suppliers have contracts and documents in the data, but the 19 practice cases only cover about 20 of them. The hidden cases use "suppliers practice never shows," so they're most likely the other ~26. **You can profile every one of them in advance**, which is a good use of your credits.

## 3. Architecture

```
case opens ─► Dossier (pre-built, cached) ─► Economics engine ─► Strategist LLM ─► Validator ─► send
                     ▲                              ▲                                    │
                     └──── Opponent model ◄──── supplier reply (sheet, status, claims) ◄─┘
                                      └──► Closer (accept / walk / continue, watches seconds_left)
```

**A. Supplier dossiers, built offline and cached for all 46 detailed suppliers**
- **SQL pulls per supplier:**
  - notes, e-mails and letters, news
  - invoices (does Hollerau pay late?) and "overdue invoice" e-mails
  - scorecards and quality notifications
  - `negotiation_history` (what they asked vs. what they settled for)
  - `should_cost`, contract clauses (notice periods, index clauses), price conditions, PO price history
- **Derived facts:**
  - 12-month index changes for each part's cost drivers
  - notice-period violations (letter vs. contract)
  - how much the supplier has historically conceded
  - estimated margin (should-cost vs. price)
  - whether a second source exists
- **An Opus-written persona per supplier:**
  - Short of cash? Wants partnership? Near-monopoly? Short on capacity?
  - Which levers move it, and which arguments it will dismiss as "not our reality".
- **At runtime,** merge in the case's own `facts` and the **Sunday 08:00 release**.

**B. Economics engine, all code and no LLM**
- `arena_kit.total_cost()` for your side, plus an estimate of the supplier's value and margin (`cost.supplier_value`) using its estimated full cost and cost of money.
- **Generate candidate term sheets** over a grid of price, payment days, effective date, contract months and Incoterm.
- **Keep the Pareto front:** sheets where your saving is large and the supplier's pain is small.
- **Set three numbers per case:** opening anchor, target, and walk-away (alternative or fallback).
- **Plan concessions across about 6 rounds.**
- **Check every sheet** for must-haves and completeness before sending.

**C. Strategist LLM, which writes the e-mail**
- Picks **which 3 claims** to make, the tone, and which 2–3 sheets to offer.
- Offering several sheets is how you learn what the supplier values, as in a bandit problem.
- Figures always come from code, never from the LLM.
- **Model split:**
  - Opus for offline preparation.
  - For each live move, a fast model (Opus at low effort, or Sonnet 5.5) with a hard 40-second budget.
  - If the LLM is too slow, send a deterministic fallback message so you never time out.

**D. Validator**
- Every ID must exist in `facts.json`.
- Every figure must be within tolerance of the true value.
- One argument per sentence, and no leaked urgency or budget.
- Drop anything that would come back "contradicted".

**E. Opponent model**
- After each reply, update your estimate of the supplier's floor from its standing sheet, status (`final_offer` means stop pushing), reply delay, `missing_fields` and claim results.
- In RFQ cases, play the threads against each other.

**F. Closer**
- Accept when the standing offer beats your target.
- On `final_offer`, accept if it beats the alternative.
- Accept the best standing offer across all threads when `seconds_left` drops below about 90 s.
- Walk away when everything is worse than the alternative.
- Read the quote PDF's standard terms before accepting.

**G. Runtime**
- Async, 10 parallel sessions, a watchdog on the 60-second limit, `X-Move-Id` for safe retries, and full logs.
- Start from the kit's `play_waves`.

## 4. Testing loop
1. **`arena-sim`** for plumbing only. Its supplier is scripted and dumb.
2. **Your own LLM supplier simulator.** Each simulated supplier gets the persona from its dossier, a hidden cost floor from should-cost, a boss who must approve bigger moves, and limited patience. Calibrate it against the reasons in the practice traces. This is where credits buy the most: thousands of offline negotiations for tuning and regression tests, at no cost to your practice quota.
3. **Hosted practice: 200 sessions per 24 hours.**
   - Rough budget: about 60 on Saturday, 60 overnight in automated batches, 60 on Sunday morning, 20 kept in reserve.
   - Keep 3–4 practice cases out of tuning and use them to check that the agent works on unseen cases. The hidden suppliers are new, so overfitting to practice is the main risk.
4. **Keep a lessons file** built from trace reasons and back offices, and feed it into the strategist prompt.

## 5. Timeline
| When | What |
|---|---|
| **Sat 10:30** | Kickoff. **Get your API key at the desk straight away.** At office hours, ask: how many cases per wave, whether hidden suppliers are in the data package, and whether the Sunday release adds suppliers. |
| 12–14 | Plumbing, then naive and LLM agents on the sandbox and practice cases for a baseline score. Logging. |
| 14–18 | Dossier builder, economics engine, validator. |
| 18–22 | Strategist, opponent model, closer. Practice runs; read every replay. |
| 22–02 | Supplier simulator. Start the offline dossier and persona build for all 46 suppliers. Tuning batches. |
| Night | Sleep in shifts while automated runs continue. **Clocks go back at 03:00.** |
| **Sun 08:00** | Load the Sunday release (`uv run arena data`) and rebuild the affected dossiers. |
| 08–11 | Make it robust. **Rehearse the final:** all hosted cases in parallel within 8 minutes, from the machine and network you'll use. |
| 11–12:30 | Feature freeze. Pick 1–2 replays for the pitch. |
| **13:00** | Push and submit the commit hash. **Runner started and polling by 13:20.** Laptop on power, sleep disabled. |

**If you have a team of 3–4:**
1. Data and dossiers.
2. Economics engine and closer.
3. LLM strategist and validator.
4. Simulator, testing and pitch.

If you're solo, merge roles 1+4 and 2+3, and treat the simulator as optional.

## 6. Pitch angle
The jury asks: "Why did your agent write that? Would it work on a real supplier? What did it learn, and from where?"

The dossiers, explicit trade-offs and closer give you a clear answer to all three. Show one replay where the agent found a deal that helped both sides, for example faster payment in exchange for price, with the supplier's own reasons on screen.

I can build the first layer tonight: install the kit, run the baselines against `arena-sim`, and write the dossier builder and economics engine against the SQLite data. All of that works without your API key, and you'd start tomorrow with prep and maths already working.

---

### You · 2026-10-24 06:16 UTC

is it mostly prompt engineering?

---

### Claude · 2026-10-24 06:16 UTC

**No. Prompting is maybe a third of it, and the larger part is engineering.** The supplier bots are LLMs that read your e-mail, so wording does matter. But the score comes from a formula applied to the term sheet you accept, and "term sheets bind, nothing else."

## Where prompting matters
- **The e-mail itself.** Tone, which argument you lead with, and how you frame a trade. The bots react to threats, appreciation, urgency and relationship as people would.
- **Reading the supplier.** Turning call notes, letters and quote remarks into a judgement like "this owner needs cash and values partnership."
- **Choosing arguments.** Picking the 3 claims that will move *this* supplier, not just the 3 that are true.

## Where engineering decides the score
- **Cost maths.** Total cost has about 10 parts: uncovered need, interest, freight, the index clause, the relationship charge and more. An LLM doing this in its head will accept deals that look cheaper and score 0. One example: a lower price on a 12-month contract can be worse than the opening quote because half the need isn't covered.
- **Searching for the best trade.** Finding sheets where your saving is large and the supplier's pain is small, such as payment days vs. price vs. effective date, is an optimisation problem.
- **Mining the data.** Notice-period violations, index changes, should-cost margins and payment history are SQL and arithmetic over 24 tables. Getting a figure wrong makes the claim "contradicted," which costs trust.
- **Hard rules that score 0 if broken.** Must-haves, fields that fall back to the supplier's standard terms, complete term sheets.
- **Timing and reliability.** 60 s per move, an 8-minute cap per wave, up to 10 parallel sessions, rate limits, no human allowed. One crash or slow model during the final loses a whole wave.
- **When to stop.** Accepting vs. pushing vs. walking away, based on status, time left and your estimate of the supplier's floor.

## Why this matters for you
The starter kit's `LLMAgent` is already a single prompt. Most teams will spend the weekend tuning that prompt, so that's where the crowd will be. Your edge is everything around it: the cost engine, offer search, an opponent model and a simulator to test against. The LLM then becomes the part that writes the e-mail and judges the supplier, inside limits set by code.

A good split of your time: about 30% on prompts and supplier understanding, about 70% on the economics, data, testing and runtime.

---

### You · 2026-10-24 06:19 UTC

okay but we can't build it now before we know about the supplier bots, right?

---

### Claude · 2026-10-24 06:20 UTC

**Most of it, yes.** The supplier bots only affect calibration. Nearly everything else is public already:

| Part | Depends on the bots? | Why |
|---|---|---|
| Data mining and dossiers | No | The full data package is in the repo, and it's the same world the cases use |
| Cost engine and offer search | No | The formula is published and `arena_kit.total_cost()` implements it |
| Claim validator | No | `facts.json` holds every citable ID and the values the arena checks |
| Runtime: parallel play, 60 s watchdog, retries, closer timing | No | `arena-sim` speaks the exact API |
| How the bots decide | Partly | The brief describes it: cost floor, a boss who must approve bigger moves, nothing given without a move from you, reactions to tone |
| Tone, concession speed, how far data moves them | **Yes** | You learn this from practice replays, where suppliers explain their reasons in words, once you have an API key at kickoff |
| Calibrating your own supplier simulator | **Yes** | Same reason |

So you can build about 70% before seeing a bot, and use practice to tune the other 30%.

**But check whether you're allowed to write code before hacking starts.** Neither the kit nor the website has an explicit rule on prior work. The brief does frame everything as handed out "at the kickoff," with hacking starting Saturday at 12:00. Tacto also checks the top-5 repos, and commit history shows when code was written. Pre-built code could get you disqualified, or at least look bad in the pitch. I offered earlier to build parts tonight; I should have flagged this first.

What's safe tonight:
- **Read and plan:** the brief, `api.md`, the starter kit code, and the data tables.
- **Analyse:** go through the 46 suppliers' notes and letters as research notes, and work through the cost formula on paper with the brief's example.
- **Design:** settle the architecture and who does what on your team, so you can start coding at 12:00.
- **Ask the organisers:** at kickoff or at akshat.tandon@tum.de, ask whether prepared code is allowed. If it is, you've lost nothing. If not, you're still ahead on planning.

I can help with the research and design tonight, for example a supplier-by-supplier analysis or a worked cost-formula sheet, without writing any agent code.

---

### You · 2026-10-24 06:23 UTC

explain the project and the discussion we've had in simple terms

---

### Claude · 2026-10-24 06:23 UTC

## The hackathon
This weekend (24–25 Oct) you're at the Industrial Agents Hackathon in Munich. Teams build AI agents for three startups backed by the same investor, UVC Partners. Each startup has published its challenge on GitHub:

- **Synera:** an assistant you talk to that knows a building ("Where's the 3D printer? How do I get there without stairs?").
- **Tacto:** an AI that negotiates with suppliers by e-mail on behalf of a factory's purchasing team.
- **Certivity:** an AI that reads a product description and lists every rule from vehicle regulations it must follow, with page numbers.

## Which track
- On pure odds, I first suggested **Certivity**: fewest competitors, and extra Claude credits help most there.
- After reading your CV and comparing Synera with Tacto, I recommended **Tacto**. Your background is in agents that interact, trading agents, simulations and red-teaming, and that matches a negotiation game. Synera would mainly reward polished UI and geometry code, which any team can produce with Claude.

## How the Tacto challenge works
- You play the buyer at a fictional pump factory. Tacto runs AI "suppliers," like a foundry announcing a 9.5% price increase.
- Your agent reads the company's data (orders, contracts, e-mails, notes on each supplier), negotiates by e-mail, then accepts a deal or walks away.
- **It's you against Tacto's bots, not against other teams.** Each deal is scored against the best deal that was possible. Other teams only matter for the leaderboard.
- The final is Sunday at 13:30: 5 rounds of new cases, 8 minutes each, and no human allowed to step in.

## How to approach it
- **It's not mainly prompt writing.** The score comes from a total-cost formula covering price, payment terms, contract length, delivery, quality and more. The words in the e-mail matter, but the numbers in the deal decide the score.
- So the plan is: **code does the maths and the strategy, and the AI writes the e-mails and reads each supplier's personality.** Most teams will only tweak the starter prompt, and this approach is where you can beat them.
- **Most of it can be built before you've seen the bots,** because the data, the scoring formula and a local test server are all public. You'll tune the rest once you can practise against the real bots after kickoff.

## One caution
It's unclear whether you're allowed to write code before hacking starts at 12:00 on Saturday. To be safe, spend tonight reading, analysing the suppliers and planning, and ask the organisers at kickoff.

---

### You · 2026-10-24 06:23 UTC

No I meant explain the tacto challenge and the discussion we've had on tacto challenge in simple terms.

---

### Claude · 2026-10-24 06:24 UTC

## The Tacto challenge

**The story.** You're the purchasing department of a made-up German company that makes pumps. It buys parts like castings, motors, seals and screws from about 45 suppliers. Your inbox is full of problems. One supplier wants to raise prices by 9.5%. A contract is expiring. A new product needs quotes from several suppliers. Another supplier keeps delivering faulty parts.

**Your job.** Build an AI agent that handles these situations the way a human buyer would: by negotiating over e-mail.

**The other side.** Tacto runs the suppliers, and they're AI bots that behave like real businesspeople. Each one has a lowest price it will never go below, and a boss who has to approve bigger discounts. Each also has its own personality, like the family business that values loyalty, the small shop that needs cash quickly, or the big company that barely moves. The bots react to tone, so being rude or desperate has consequences.

**How one negotiation goes:**
1. The supplier sends its offer.
2. Your agent replies with an e-mail and up to 3 concrete offers (price, payment terms, contract length, delivery, and so on).
3. The supplier answers with a counter-offer.
4. This repeats for a few rounds, until your agent accepts a deal or walks away.

**What you get to work with.** Three years of the company's records: past orders and prices, contracts, invoices, quality reports, market price data, cost estimates, and notes from past calls and e-mails with each supplier. The useful clues are hidden in there. Maybe this supplier is short of cash, or it raised prices without giving the notice its contract requires.

**How you're scored.** Not just on the price. The deal's *total cost* counts. For example:
- Paying a supplier sooner costs you money.
- A contract that only covers half of what you need means buying the rest later at a worse price.
- Squeezing an important supplier too hard counts against you, because it could go out of business.

Each deal gets a score from 0 to 1, measured against the best deal that was possible.

**The final (Sunday 13:30).** 5 rounds of brand-new negotiations, 8 minutes each, all running at once. No human may touch anything. The 5 teams with the most points pitch to a jury, which picks the winners.

## What we discussed

**1. Is it you against other teams?** No. Each negotiation is just your agent against Tacto's bots. Other teams can't affect your deals; they only compete with you on the leaderboard.

**2. Is it mostly prompt writing?** No. The wording of the e-mails matters because the bots read them like people do. But the score comes from the numbers in the deal you accept, and AI models are unreliable at that maths. So the plan is:
- **Code** does the maths: it calculates total cost, finds trades that help both sides (like "we'll pay you faster if you lower the price"), and decides when to accept or walk away.
- **The AI** writes the e-mails and reads each supplier's personality from the notes.

Most teams will only tweak the starter AI prompt, and this split is how you can beat them.

**3. The plan, in short:**
- **Before each negotiation:** build a profile of the supplier from the data. What it cares about, how it behaved in the past, and which facts you can use against it.
- **During:** code picks good offers, the AI writes a convincing e-mail, and a checker makes sure every fact you cite is correct (wrong facts cost you trust).
- **Closing:** accept when the deal is good enough or time is running out, and walk away if nothing beats your backup option.
- **Practice:** learn from practice rounds, where suppliers explain their reasoning afterwards, and from your own fake suppliers built to test against.

**4. Can you build it before seeing the bots?** Mostly yes. The data, the scoring formula and a local test server are all public. Only fine-tuning, such as tone and how fast to concede, needs the real bots, which you can practise against after kickoff.

**5. One caution.** It's unclear whether writing code before hacking starts (Saturday 12:00) is allowed. Spend tonight reading and planning, and ask the organisers at kickoff.

---

### You · 2026-10-24 06:28 UTC

okay tell me what kind of data you already have from tacto in simple terms.

---

### Claude · 2026-10-24 06:28 UTC

Everything below is in the Tacto kit on your laptop. Think of it as the full filing cabinet of a made-up pump company.

## The company
**Hollerau Pumpenwerke**, a family-owned pump maker in Bavaria with about €250M revenue and 910 employees. It spends about €35M a year on parts. A one-page company profile sets out its rules: it normally pays suppliers after 60 days, bigger deals need a boss's approval, and important parts should have two suppliers.

## Who it buys from and what it buys
- **Suppliers:** 447 in total, but only **46 matter**, and those have detailed records. The rest are small one-off suppliers.
- **Parts:** 60 important parts, such as pump casings, shafts, motors, seals and screws.
- **Backup suppliers:** for each part, which other supplier is approved as a second source.
- **Background on each supplier:** how financially healthy it is, its size, and its credit rating.

## Three years of business history
- **Orders:** about 5,400 lines showing what was bought, when, how many and at what price.
- **Deliveries:** about 5,600 records of what actually arrived and when, so you can see who delivers late.
- **Invoices:** about 5,600, including whether the pump company paid on time (it often doesn't).
- **Quality complaints:** about 1,000 cases of faulty parts.
- **Supplier report cards:** quarterly grades for on-time delivery and defect rates.
- **Forecasts:** how many parts the company expects to need.
- **Spending summary:** where all the money goes.

## Contracts and prices
- **46 contracts**, one per important supplier, plus about 280 individual clauses. These cover things like how much notice a supplier must give before raising prices, or whether prices follow a market index.
- **Agreed prices** for each part and supplier.
- **Past quote requests and quotes:** about 50 requests and 108 quotes.
- **Past negotiations:** 300 records of what a supplier asked for vs. what it finally accepted. This shows how much each supplier usually gives in.

## What things *should* cost
- **Cost estimates:** for 28 important parts, an estimate of what the part costs the supplier to make. If the price is far above that, the supplier has room to drop it.
- **Cost ingredients:** what each part's cost is made of, e.g. "60% steel, 20% energy, 20% labour".
- **Market prices:** 33 real public price series (steel, iron, copper, energy, wages, exchange rates), monthly up to September 2026. You can use these to show "steel actually got cheaper, so why are you raising prices?"

## The human side, where the best clues are
**208 documents** written like real office paperwork:
- 84 e-mails, e.g. "your invoice is overdue", complaints, price discussions
- 69 meeting notes and 40 call notes, e.g. "the owner said he's worried about cash", "they're short of capacity"
- 11 letters, such as price-increase announcements
- 2 internal memos and 2 quote requests

There are also 39 news items, like a supplier expanding or struggling, or a chip shortage.

This is where you learn each supplier's personality and pressure points. Some notes are deliberately useless noise.

## Two helper files
- **A fact list:** every fact you're allowed to quote in a negotiation, each with an ID, e.g. "steel price index, August 2026". The bots check your claims against this list.
- **Known issues:** messy data, on purpose, just like a real company's records. One supplier appears twice under different numbers, some prices are per 100 pieces instead of per piece, and some prices are out of date.

## What you don't have yet
- **The negotiation cases themselves:** the case files with "here's the situation, here's your goal". These come from Tacto's server once you have your team key at kickoff.
- **The supplier bots:** you can only talk to them after kickoff.
- **The Sunday release:** fresh news, letters and a memo, published Sunday at 08:00.
- **The final's secret cases:** revealed live on Sunday from 13:30.

The trigger letters for the 19 practice cases *are* already in the documents, such as the foundry's 9.5% price-increase letter. So you can already read what each practice situation is about.

---

### You · 2026-10-24 06:31 UTC

okay now let's discuss the synera case: explain the case in simple terms.

---

### Claude · 2026-10-24 06:31 UTC

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

---

### You · 2026-10-24 06:42 UTC

How much business understanding is needed for both these cases?

---

### Claude · 2026-10-24 06:42 UTC

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

---

### You · 2026-10-24 06:45 UTC

What are the deliverables for both?

---

### Claude · 2026-10-24 06:46 UTC

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

---

### You · 2026-10-24 06:46 UTC

okay which one of these should I choose?

---

### Claude · 2026-10-24 06:47 UTC

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

---

### You · 2026-10-24 06:51 UTC

okay, I have decided to build Synera's case: give me a plan on how to do it.

---

### Claude · 2026-10-24 06:51 UTC

Good choice. I'll check the kit details first so the plan matches it exactly.

---

### Claude · 2026-10-24 06:52 UTC

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

---

### Claude · 2026-10-24 06:52 UTC

I also updated my notes from this session to record that you've chosen Synera, so I'll remember it next time.

---

### You · 2026-10-24 06:56 UTC

which of the startups are better funded and have more job roles suiting me.

---

### Claude · 2026-10-24 06:56 UTC

**Synera comes out ahead on both counts.** Conveniently, that's also the track you picked.

## Funding
| | Total raised | Latest round | Investors |
|---|---|---|---|
| **Synera** | **~$58M** | **$40M Series B, April 2026** | Revaia, Capgemini, UVC, BMW iVentures, Cherry |
| **Tacto** | ~€55M | €50M, **Dec 2023** (no new round found since) | Sequoia, Index, Cherry, UVC |
| **Certivity** | ~€15M | €13.3M Series A, July 2025 | Almaz, UVC, Earlybird |

- **Synera** has the freshest and largest round. Its revenue doubled in 2025, and 60% of new business came from AI, so it's in hiring mode.
- **Tacto** raised a similar total but almost three years ago. With 100+ staff and 300–400 customers it may be running on revenue, but I found no newer round.
- **Certivity** is the smallest and earliest stage.

## Open roles that fit your profile (checked live just now)

**Synera:** 18 openings, **all remote in Germany**, which works from Saarbrücken.
- ⭐ **Senior AI Engineer:** their "Agentic Ants" team builds multi-agent systems and an evaluation framework that tests every change (golden datasets, LLM-as-judge, regression tests). Their 12-month goal is "agents that improve themselves." That matches your multi-agent and AI-safety evaluation work closely. "Senior" is a stretch on paper, but research experience, a publication and a hackathon win make a credible case.
- **Data Engineer:** an internal "superagent" over all company data.
- **Senior Fullstack Developer:** relevant to your TypeScript and Next.js experience.
- The rest are mostly sales, pre-sales and marketing.

**Tacto:** 23 openings, **all on-site in Munich**.
- **Forward Deployed Engineer:** builds agents and data pipelines on customers' real data.
- **Product Engineer / Builder.**
- **(Senior) Value Engineer:** quickly builds AI demos from a prospect's data.
- **(Intern) AI Automation Engineer** and **(Intern) Product Engineer:** good if you want something during your MSc.
- **Leap: Fast-Track Generalist Program.**
- No dedicated ML or AI research role. It's more applied engineering and building.

**Certivity:** 5 openings, Munich.
- **Senior Software Engineer, Document Ingestion & Extraction,** and **Python Engineer, Web Crawling & Data Extraction:** both fit your PDF-extraction work at Aidetic, but they're narrower and not about agents.

## Overall
| | Funding | Roles that fit | Location |
|---|---|---|---|
| **Synera** | Best (fresh Series B) | Best: a real AI/agents role | Remote in Germany |
| Tacto | Good (older round) | Several builder/engineer roles, internships | Munich on-site |
| Certivity | Smallest | Narrow (extraction) | Munich |

**Use the hackathon to get noticed.** The Synera kit was written by **Tino Bog** from Synera, and Synera engineers will review every Track 01 submission. A strong benchmark score plus a clean, well-tested core is effectively a work sample for the Senior AI Engineer role. Talk to the Synera people at office hours on Saturday afternoon, and mention your multi-agent and evaluation background.

The funding figures come from public announcements; a company may have raised money it hasn't announced. The job lists are live as of now.

---

### You · 2026-10-24 06:57 UTC

give me a link to the job posting?

---

### Claude · 2026-10-24 06:57 UTC

I took you to mean the Synera Senior AI Engineer role:

**https://jobs.synera.de/o/senior-ai-engineer-fmd-remote-in-germany**

The other two Synera roles that fit you:
- Data Engineer: https://jobs.synera.de/o/data-engineer-remote-in-germany
- Senior Fullstack Developer: https://jobs.synera.de/o/senior-fullstack-developer-fmd-remote-in-germany

All of Synera's openings are listed at https://jobs.synera.de

---

### You · 2026-10-24 06:58 UTC

this link does not exist: https://jobs.synera.de/o/senior-ai-engineer-fmd-remote-in-germany

---

### Claude · 2026-10-24 06:58 UTC

You're right, sorry. I copied that link from Synera's job feed without opening it, and the jobs.synera.de domain doesn't load at all right now. The same postings do load on their hiring platform, and I've checked these open the right pages:

- **Senior AI Engineer:** https://synera.recruitee.com/o/senior-ai-engineer-fmd-remote-in-germany
- Data Engineer: https://synera.recruitee.com/o/data-engineer-remote-in-germany
- Senior Fullstack Developer: https://synera.recruitee.com/o/senior-fullstack-developer-fmd-remote-in-germany
- All Synera jobs: https://synera.recruitee.com/
