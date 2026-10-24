# Tacto track: Negotiation Arena kit

> Source: Claude Code session `af8ef3c5`, 23–24 Oct 2026. Saved from the conversation as-is.

# Tacto track: the actual challenge (Negotiation Arena kit) plus company background

## A. The Tacto track: "Tacto Negotiation Arena" (facts, read in full from the repo)

**Repo and clone**
- I cloned it to `(old temp clone) negotiation-arena-kit`. The directory already held a clone with origin `github.com/tacto-playground/negotiation-arena-kit`; I fetched it and it is level with origin/main.
- **Latest commit:** `75eecd19bf42c4f4b5a93f01139fa2a757ec5c07`, "Kit update from aa0cc2d", by **Adrian Hupka <adrian.hupka@tacto.ai>** (Tacto's Head of Engineering), **2026-10-23 12:27:33 +0200**.
- History: 8 commits, the first on 2026-10-09 20:18 (ab719cb), and three updates on 23 Oct. Expect more pushes before kickoff.
- Licences: code MIT, data and docs CC BY 4.0.
- The hosted arena is live: `https://arena.tacto.ai/health` returns `{"ok":true}`. The Sunday data release is not public yet; it is scheduled for 2026-10-25 07:00 UTC (08:00 CET).
- I found no prompt-injection text in the docs or code.

**Mission**
- You are the purchasing team of the fictional **Hollerau Pumpenwerke GmbH**: Bavarian pump maker, about €252M revenue, 910 staff, about €35M parts spend, 46 detailed suppliers, 60 parts. "Today" is 30 Sep 2026.
- Build an **autonomous AI buyer agent** that:
  1. **prepares**: reads the case file and mines the data;
  2. **negotiates by e-mail** with Tacto-hosted LLM **supplier bots**;
  3. **closes**: accepts one supplier term sheet, or walks away.
- Each supplier bot has roles behind it: sales or owner, a boss who must approve bigger moves, and engineering, quality, logistics, finance and legal, who attach documents.
- Bring your own LLM. The kit defaults to `LLM_PROVIDER=anthropic`, `LLM_MODEL=claude-opus-5-5`, `LLM_EFFORT=low`.
- Tagline: "Your agent. Our suppliers. Real money."

**Case types** (API field `type`)
- `price_increase`, `renewal`, `rfq` (2–3 suppliers in parallel threads; accepting one ends the case), `bundling`, `raw_material`, `capacity`, `quality`.
- Each case has a `category_goal`: `stabilise`, `secure_supply`, `quality_first`, `leverage` or `routine`. The goal sets the cost rates.

**The 19 practice cases**, from their trigger documents in `data/correspondence/*-P*.md`:

| Type | Cases |
|---|---|
| Price increase | P01 Brandlhuber foundry +9.5% on volute casings from 1 Nov 2026 (letter gives 51 days' notice); P02 Nordmark motors +6.5% (copper and electronics); P13 Lindlbauer +7%; P17 Platinenwerk +8% |
| Renewal | P03 Selvbrunn, P04 Wälzlager-Zentrum, P14 Kabelwerk Rhönsberg, P19 Kugellager Inntal |
| RFQ | P05 pump shaft HX; P06 volute casing HX 80-200 (new HX series, SOP 2027-03) |
| Bundling | P07 and P15, both "One supplier for the kit" (bolts, nuts and washers, about 30k kits a year) |
| Raw material / surcharge clause | P08 Edelstahl Donautal, P16 Rupprecht-Kessel, P18 Blankstahl |
| Capacity | P09 Obermaier & Huber, P10 Dichtungswerk Ravensteiner |
| Quality escalation | P11, P12 |

- 10 of the 19 are hosted for play. There is a sandbox (D01 price increase, D02 two-supplier RFQ). The **Live Final uses hidden cases**: new suppliers and situations, the same rules, and some cite the Sunday release.

**Negotiation mechanics**
- **Round 0:** every supplier sends a quote e-mail with a **quote PDF**. The PDF holds the standard terms, which apply to every field you leave out.
- **Your message:** subject, body (≤8,000 chars), **up to 3 term sheets** (each must carry every negotiable field), up to 20 data-ID `refs`, and up to 5 attachments (md, csv or json are read).
- **The reply carries:**
  - the supplier's standing term sheet and a status: `open`, `final_offer` (push further and it may walk), `agreed`, `walked_away` or `no_bid`;
  - `signals` (reply_delay_days, validity_days) and `missing_fields`;
  - `claim_results` for each argument: `verified`, `contradicted` (costs trust), `irrelevant` or `duplicate`.
- **Documents on request:** cost breakdown XLSX (ask; open suppliers send it), 8D report PDF, delivery schedule XLSX, and the order confirmation at the deal.
- **Only term sheets bind; prose never does.** Cheaper engineering variants a supplier mentions are information, not terms.
- **Limits:**
  - 10 messages per thread by default;
  - **60 seconds per message**, counted from the supplier's reply. A timeout repeats your last offer and lowers the supplier's patience. Three in a row, or one after the last round, end the thread;
  - a supplier reply can take about 60 s and is not counted against you;
  - 10 calls per second and 10 open sessions per key.
- **Supplier behaviour:** it never sells below its cost floor, bigger moves need its boss, it gives nothing without a move from you, and it reacts to tone, threats, urgency and relationship. "Padding does not buy price."

**Claim checking** (the arena checks figures against `data/facts.json`)
- At most 3 checks per message; write one argument per sentence, with the figure next to the ID.
- What can be checked:
  - two `idx` values of one series, ≤12 months apart, ending within the last 12 months: the % change;
  - a `quote` or rival `offer`: its price. Citing a rival's quote reveals it to that supplier;
  - `sc` / `qn`: mean on-time delivery or ppm;
  - 2–8 `po` lines of one part: the order prices;
  - `fc` / `cost` / `news`: the recorded change, the estimate, or that the item concerns this supplier;
  - **a letter `doc` plus the contract `ctr`: the notice the letter gives against the notice the contract requires.**
- Tolerance is ±0.5 pp for %, otherwise ±0.5%.

**Terms (the structured fields)**
- `unit_price`, `payment_days` (0–120), `lead_time_days`, `volume_per_year`, `contract_months` (0–36), `effective_date`.
- `index_clause` `{series, material_share, deadband_pct, base_month}`, `incoterm` (EXW, FCA or DAP).
- `tooling_eur`, `ppm_commitment`, `chargeback_eur_per_complaint`.
- The case file gives `negotiable`, `fixed_terms` and `term_options`.
- The `buyer` block gives need per year, horizon, current, fallback and alternative prices, interest rate (8%), reference payment days (60), late cost per day, cost per defect, fallback and index risk %, sustainable margin with € per margin point, freight per Incoterm, index paths, `must_haves` and `alternative`.

**Scoring**
- **Total cost C** is computed over the fixed need and horizon. It adds up:
  - price spend (units bought before `effective_date` count at the current price);
  - uncovered need at the fallback price × (1 + fallback risk);
  - interest for paying before the 60-day reference;
  - freight by Incoterm and late-lead-time cost;
  - expected defects × (cost per defect − chargeback), and tooling;
  - index-clause exposure and index risk;
  - **for `stabilise` and `secure_supply` only, a relationship charge** when the deal leaves the supplier below a sustainable margin: soft(g) = g²/10 up to 5 points, then g − 2.5.
- The full formula is in `brief/api.md`, and `arena_kit.total_cost()` computes it.
- **Case score = clip((C_open − C_deal)/(C_open − C_best), 0, 1).** C_open is the cheapest opening quote. C_best is hidden and fixed: the better of the best package any supplier would ever accept and your alternative.
- No deal scores your alternative (0 if there is none), and some cases are best walked away from. **A broken must-have scores 0.**
- The brief's worked example: €41.60 at 60 days against an opening of €43.20 at 30 days scores 0.64.

**Live Final and judging**
- **5 themed waves, 8-minute hard cap each.** All cases in a wave appear at once, in your own order, with one attempt per case. Anything still open at the cap ends with no deal.
- Each wave scores 0–100 (mean case score × 100), so the maximum is 500 points.
- **No human in the loop.** Your agent may not read `/v1/events`, `/screen`, `/leaderboard` or `/results` during the final.
- Ties go to more deals, then fewer rounds.
- The **top 5 by points pitch** (5 min + 2 min Q&A, 15:10 at the Tacto office). **The jury sets places 1–3 from score plus pitch**, and every replay is open to it.
- Expected questions: "Why did your agent write that? Would it work on a real supplier? What did it learn about suppliers, and from where?"
- "Everything else counts, including weaknesses you find in our bots", but the jury sees the replays.
- Prizes: robots, caps and a small extra.

**Schedule (Sat 24 – Sun 25 Oct)**
- Sat 10:30 kickoff at the Tacto office; 12:00 hacking at MUCL (Munich Urban Colab); office hours from 14:00.
- **Sun 08:00 new data release:** run `uv run arena data` again.
- Sun 13:00 code freeze; 13:30–14:30 Live Final; 15:10 top-5 pitches; 16:20 awards.
- **Clocks go back overnight (03:00 becomes 02:00).**

**Submission** (`brief/submission.md`), on the organisers' platform by Sun 13:00:
- the repo with the agent, a README with run instructions and env var names (no keys), and the **commit hash** used in the final;
- a short description of the approach;
- slides if you make the top 5.
- The agent must already be running before 13:30 (`uv run arena run --set final --agent llm --parallel 10`). Tacto checks the top 5 for pushes after the freeze.
- Pre-flight checklist: final machine and network tested, data refreshed after 08:00, LLM credits and rate limits for about an hour of parallel play, laptop on power and not sleeping.

**API** (`https://arena.tacto.ai/v1`, header `X-API-Key`; one key per team via `arena.tacto.ai/apply` plus a desk approval)
- `GET /v1/me`, `GET /v1/cases?set=practice|sandbox|final`.
- `POST /v1/sessions`, `POST /v1/sessions/{sid}/threads/{supplier}/messages` (an `action` of accept or walk_away closes the case).
- `GET …/threads/{supplier}`, `GET …/attachments/{id}`, `GET /v1/sessions/{sid}` (score, cost breakdown, trace), `…/backoffice` (after the case ends).
- Structured path: `POST …/moves`, `…/accept`, `…/walk_away`.
- Send an `X-Move-Id` header for idempotent retries. Request bodies are capped at 64 KB.
- Status codes: 422 (invalid; no round used), 409 (ended, late or round limit), 429 (rate or quota).
- **Practice quota: 200 sessions per team per rolling 24 h.**

**Data package v1** (`data/`; the same content as `world.sqlite` and `facts.json`, the latter holding every citable ID)
- 24 tables:
  - suppliers (447, including the long tail), supplier_intel (credit index, equity ratio, turnover), parts (60), sourcing (approved second sources);
  - price_conditions, negotiation_history (asked vs settled, plus notes), contracts (46) and contract_clauses (280, including index and notice clauses);
  - po_lines (5,400), goods_receipts, invoices (payment behaviour), quality_notifications, scorecards, forecasts;
  - rfqs, quotes, spend_cube, index_series and index_values (real Eurostat PPI, LCI, World Bank metals, ECB FX and SMARD power prices, frozen at 2026-09);
  - cost_drivers (index weights per part), should_cost (28 rows; the supplier's own plant for strategic parts, ±5%), news (39) and documents (208).
- Documents: 84 e-mails, 69 meeting notes, 40 call notes, 11 letters, 2 memos, 2 RFQs.
- `KNOWN_ISSUES.md` lists deliberate ERP quirks:
  - `sup:71999` is a duplicate of `sup:70210`;
  - three different delivery dates per PO line;
  - prices per 100 or 1,000 units;
  - stale conditions;
  - late payments;
  - noisy PPM figures on small lots.

**Starter kit** (`starter-kit/`, Python 3.12 + uv)
- `ArenaClient`; `play`, `play_all` and `play_waves` (the final runner closes 90 s before each wave's cap).
- `cost.py` (total C, `supplier_value`, must-have checks, term-sheet completion) and `docs.py` (PDF/XLSX to text; quote PDF to its offered, standard and fixed terms).
- `data.py`, which merges the Sunday release automatically.
- `NaiveAgent`: anchors 10% low, splits the difference, accepts early.
- `LLMAgent`: one JSON-output prompt; code computes C, drops unknown IDs and blocks bad accepts. It only sees the case's `refs`.
- `arena-sim`: the local API with a dumb scripted supplier (+10%, concedes 2% per sheet). It teaches the contract, not the bots.
- A read-only **MCP server** over the data (`claude mcp add arena-data …`).
- Interface to implement: `decide(case, threads) -> {"supplier_id", "message"}`.

## B. What wins (my inference from the kit)

**1. Supplier profiling before the clock starts.** The levers are hidden in the notes. Example, P01 Brandlhuber:
- The owner works from a spreadsheet two years out of date and admits he hasn't tracked energy prices. Electricity PPI-D351 is −3.7% year on year, so index data can disarm him.
- He asked to be paid within 10 days in exchange for a cash discount. Trade payment days for price.
- He "expects partnership" (he held prices for a quarter in 2022), and castings are a `stabilise` category.
- History shows he "accepted below full cost to keep the volume", and should-cost is €132.64 against the current €126.53. Squeezing him below a sustainable margin triggers the relationship charge.
- His letter gives 51 days' notice, but contract clause 3.1 requires 90 days before year-end and fixes prices per calendar year. That is a citable `doc`+`ctr` notice claim, so push `effective_date` to 2027.

Other patterns:
- Seven suppliers sent "Overdue invoices" e-mails (70210, 70295, 70580, 70280, 70230, 70250, 70350). They are cash-sensitive, and Hollerau itself pays late.
- Look for capacity and chip-shortage news (e.g., Konvertek) and the kit memos for bundling.

**2. Numbers come from code.** Compute C, including your estimate of the supplier's margin, for every candidate sheet. Send 2–3 sheets to learn what the supplier values. Never leak urgency or a missing alternative. Read the quote PDF's standard terms before accepting. Know when walking away beats the deal.

**3. Speed and robustness.** You get 60 s per move and about 1 min per supplier reply. That means roughly 6–8 rounds inside an 8-minute wave, across up to 10 parallel sessions. Do the heavy data mining at session open, use a fast or low-effort model for each move, and never time out.

**4. Generalisation.** Hidden cases use new suppliers, so build a generic profiler (notes, news, invoices, scorecards, should-cost, contract clauses) rather than memorising practice cases. Ingest the Sunday release.

**5. Pitch.** Pick one replay and explain the agent's reasoning and why it would work on a real supplier. The jury weighs realism.

**My earlier predictions:** prediction #3 (autonomous long-tail negotiation with guardrails) was closest. The track is purely autonomous e-mail negotiation, with Defender- and Sourcing-agent style cases.

## C. Company background (facts, condensed from my earlier research)

- **Company:** Tacto Technology GmbH, Munich, founded 2020 at TUM. Management: André Petry (CEO, ex-BCG), Johannes Groll, Robert Kaiser; Adrian Hupka is Head of Engineering. Headcount 100+.
- **Funding:** €5.3M seed (2022: Cherry, UVC, Visionaries) and €50M (Dec 2023: Sequoia and Index). Gerhard Cromme is an investor.
  - Sources: https://uvcpartners.com/blog/tacto-raises-eu5-3m-to-fix-industrial-supply-chains, https://www.munich-startup.de/en/96697/ai-startup-tacto-secures-50-million-euros/
- **Product:** a "Procurement Intelligence Platform" with four modules: Supplier, Spend & Cost, Sourcing and Compliance Intelligence.
- **Agents:** they claim 250+ "AI agents"; 33 are listed, including Defender (counters price increases), Negotiation Preparation, Sourcing, Quote Parsing, Order Confirmation, Bundling, Raw Material, Target Price and Risk.
- **Sourcing Intelligence** launched as a multi-agent system in Oct 2026. It drafts or negotiates RFQ rounds by e-mail under guardrails, and buyers approve awards.
- **Data:** ERP data plus 20k+ indices. Source: https://tacto.ai/en/intelligence
- **Customers:** 300–400+, including voestalpine, Kern Liebers, Koepfer (€1.2M saved with agents), VEMAG, HYMER, Wölfle, Anton Debatin and HUBTEX.
- **ERPs:** SAP, Microsoft Dynamics and proAlpha, per a third-party review (https://www.ki-syndikat.de/tools/tacto/).
- **Award:** EY AI Award 2026.
- **Pain points they state:**
  - buyers actively manage only about 20% of articles, and roughly 10% is overpaid on the rest;
  - price-increase pressure from the Hormuz crisis, energy and tariffs;
  - "every customer has a different ERP";
  - invoice checking is still manual.
- **Job posts** stress agents that "take larger units of work off users' shoulders" and patterns for humans supervising agents. Roles: https://jobs.ashbyhq.com/tacto
- **Hackathon page:** https://www.industrialagents.dev/ and https://luma.com/070qezlj (tracks: Synera, Tacto, Certivity). Each partner picks 4 finalists. Tacto's own kit adds the top-5-by-score pitch rule.

Files from the earlier research: `/private/tmp/claude-501/-Users-shreyansh/af8ef3c5-d472-49c1-b1c1-c6daa3908645/scratchpad/tacto_jobs.json` and `/private/tmp/claude-501/-Users-shreyansh/af8ef3c5-d472-49c1-b1c1-c6daa3908645/scratchpad/jobs_text.txt`.
