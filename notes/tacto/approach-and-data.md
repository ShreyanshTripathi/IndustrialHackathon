# Tacto Negotiation Arena: approach, data, discussion

> Source: Claude Code session `af8ef3c5`, 23–24 Oct 2026. Saved from the conversation as-is.

## Q: for tacto, I wanna build a plan, how can we approach the problem. Also is it a 2 player problem (my agent against Tacto's) or is it a multiplayer problem (my agent and other teams' agents against tacto's)?

*2026-10-24 06:09 UTC*

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

## Q: is it mostly prompt engineering?

*2026-10-24 06:16 UTC*

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

## Q: okay but we can't build it now before we know about the supplier bots, right?

*2026-10-24 06:19 UTC*

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

## Q: No I meant explain the tacto challenge and the discussion we've had on tacto challenge in simple terms.

*2026-10-24 06:23 UTC*

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

## Q: okay tell me what kind of data you already have from tacto in simple terms.

*2026-10-24 06:28 UTC*

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
