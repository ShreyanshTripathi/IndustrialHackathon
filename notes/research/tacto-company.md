# Tacto research brief (company and hackathon facts)

> Source: Claude Code session `af8ef3c5`, 23–24 Oct 2026. Saved from the conversation as-is.

# Tacto research brief for the Industrial Agents Hackathon (Munich, 24–25 Oct 2026)

## 0. Hackathon facts (verified; useful context)
- Site: https://www.industrialagents.dev/ — Luma: https://luma.com/070qezlj. There are three tracks: **01 Synera** ("agentic AI for hardware engineering"), **02 Tacto** ("AI procurement OS for the industrial Mittelstand") and **03 Certivity** ("turns regulations into engineering-ready requirements"). Anthropic is lead partner (Claude credits). ElevenLabs and Lovable are tech partners and give credits to every participant.
- **Kickoff and finals happen at the Tacto office.** Hacking is at Munich Urban Colab. Track briefings are Saturday at 10:00, hacking starts at 12:00, code freeze is Sunday at 13:00. **Each partner picks 4 finalists.** Finals are a **3-minute live pitch plus Q&A**, judged by UVC partners.
- The site's sample "agent trace" reads a task (an ECN: bracket wall changed from 2.0 to 2.5 mm), calls PLM, CAD and ERP (`erp.open_orders` → 240 pcs in flight), asks a human before the risky step, then writes back ("no silent BOM edits"). That is the judging spirit: **agents that act on company systems, with a human approval step and write-back.** The ECN example probably comes from Synera's world, but it overlaps Tacto's engineering-to-procurement ambition.
- No public Tacto challenge text exists yet. I found no Tacto-run hackathon in the past. Their job posts mention hosting a "2-day AI Hackathon in our office" (Tech Europe Munich; the photo page returns 403) and AI Tinkerers / AAIF meetups.

## 1. What Tacto does (FACTS)
- **Company:** Tacto Technology GmbH, Munich, founded 2020 at TUM. Management: André Petry (CEO, ex-BCG), Johannes Groll and Robert Kaiser. Head of Engineering is Adrian Hupka; engineering leads are Matthias Förth and Dan Owens. Headcount is 100+, with 60+ AI and engineering staff.
  - Sources: https://www.tacto.ai/de/uber-uns, https://www.tacto.ai/engineering
- **Funding:** €5.3M seed (Mar 2022, led by Cherry, with UVC and Visionaries) and €50M (Dec 2023, led by Sequoia and Index). Gerhard Cromme (ex-ThyssenKrupp/Siemens) is an investor and chairs the Industry Advisory Board. I found no 2025–26 round.
  - Sources: https://uvcpartners.com/blog/tacto-raises-eu5-3m-to-fix-industrial-supply-chains, https://www.munich-startup.de/en/96697/ai-startup-tacto-secures-50-million-euros/, https://www.tacto.ai/de/resources-posts/gerhard-cromme-wird-investor-bei-tacto
- **Positioning:** "Procurement Intelligence Platform", "the intelligence layer that connects AI to the physical world of manufacturing, starting with procurement." Their careers page says: **"Procurement is our gateway, not our identity."**
- **Modules** (https://www.tacto.ai/us/product):
  - **Supplier Intelligence:** master data and documents, supplier communication, order confirmations, onboarding, performance ratings, risk.
  - **Spend & Cost Intelligence:** KPI dashboards, Procurement Radar alerts, drawing-parts management and should-cost, Negotiation Cockpit (20k+ indices), category management, Savings Tracker.
  - **Sourcing Intelligence:** supplier sourcing, RFQs, quote intake from PDF, email or Excel, quote comparison, contract management.
  - **Compliance Intelligence:** supplier risk, Scope 3 carbon, REACH/RoHS/TSCA, conflict minerals, NDAA 889, and PPWR/CBAM/EUDR in webinars.
- **Platform:** "Tacto Intelligence" / "Procurement Brain" combines ERP data (item master, PO and invoice history, contracts, supplier master, info records, demand) with 20k–50k price indices, FX, labor costs and the customer's procurement strategy. They claim 250+ agents, €10B "agentized spend", 1.6M quotes parsed and 1.25M order confirmations checked. Source: https://tacto.ai/en/intelligence
- **Target users:** strategic and operational buyers, Heads of Procurement and CPOs in mid-market manufacturers. The designer job post says these are "non-technical procurement professionals." A third-party review puts the sweet spot at €50–500M procurement volume (https://www.ki-syndikat.de/tools/tacto/).
- **Industries:** machinery and plant engineering, medtech, chemicals/pharma, food, electronics, automotive, packaging/paper, consumer goods.
- **Named customers:**
  - voestalpine, Kern Liebers, Koepfer, VEMAG, HYMER, HERMA, SUSS MicroTec, Nedschroef, Arburg, Beumer, Kubota, Sumitomo, fischer, Blum, Stabilo, V-Zug, Borbet, GU, HUBTEX
  - Anton Debatin, Wölfle, Vogelsang, Meiller, Grimme, KNOLL, Broetje, Technotrans, Schenker Storen, Miele, Witron, Warema, Zerhusen, Glen Dimplex/Riedel, OWA, Sonax
- **Customer and claim figures:**
  - 300–400+ customers.
  - "Category leader in DACH, aiming for €100M+."
  - Expanding to the US (FABTECH, AME and MEMA events), the Nordics and Benelux (Founding AE roles).

## 2. AI and agent strategy, recent launches (FACTS)
- Their intelligence page lists 33 named agents (https://tacto.ai/en/intelligence):
  - **Pricing and benchmarking:** Bundling, Category Benchmark, Cheaper Sourcing Alternative, Cross-Site Consolidation, Market Deviation, Price Outlier, Price Trend, Price Variance (geometric similarity), Raw Material.
  - **Cost and drawings:** Cost Modelling, Drawing Extraction (drawings/3D to part profile), Manufacturing Family Clustering, Target Price.
  - **Negotiation and price defense:** Defender (counters supplier price increases), Negotiation Preparation.
  - **Contracts and ordering:** Framework Contracting, Inventory Optimization, Maverick Buying, MRO Buying-Dynamics, Order Confirmation, Order Quantity, Payment Terms, Tier-Price Compliance, Tier-Price Optimization, Volume Growth.
  - **Sourcing:** Quote Parsing, RFQ Benchmarking, Sourcing (shortlist to award).
  - **Suppliers, risk and compliance:** Material Compliance, Risk, Supplier Application Assessment, Supplier Deduplication, Supplier Research (VAT validation).
- **Sourcing Intelligence** launched as a **multi-agent system** in the 15 Oct 2026 webinar.
  - **Triggers:** a new need with no supplier or price, a stale purchase request (BANF) price, a new project, an expiring framework contract, a missing info record, or a Radar signal.
  - **Routes:** RFQ, negotiation prep, new-supplier search, or catalog lookup.
  - **Demo flow:** read drawing or 3D model → model manufacturing steps → target price (~€380) → pick suppliers → send RFQ by email → **negotiate or draft negotiation messages** → compare offers → award recommendation → buyer approves → ERP updated.
  - **Guardrails:** value limits, whether the agent may contact alternative suppliers or negotiate directly, and per-category award rules such as dual sourcing.
  - Source: https://www.tacto.ai/de/resources-posts/webinaraufnahme-sourcing-intelligence-wie-ki-agenten-preisanfragen-rahmenvertraege-und-b-und-c-teile-automatisch-steuern
- **Other 2026 agent webinars** (https://www.tacto.ai/de/academy):
  - Agentic order-confirmation checks (Debatin, Glen Dimplex)
  - Defender Agent (Wölfle, HYMER)
  - Agentic supplier evaluation (Kern Liebers: 38 sites, 38 different methods)
  - Agentic commodity strategy (Category Intelligence)
  - BOM to cost intelligence (HUBTEX)
  - Drawings to target prices (VEMAG)
  - "The Agent Shift" (Koepfer runs 4 agents)
- An "orchestration agent" runs specialized agents in parallel and presents results for human approval. Stated vision: "aus dem ersten Agenten wird Schritt für Schritt ein Team aus KI-Kollegen" ("step by step, the first agent becomes a team of AI colleagues"). Source: https://www.tacto.ai/de/resources-posts/webinaraufnahme-the-agent-shift-wie-ki-agenten-manuelle-arbeit-im-einkauf-uebernehmen
- **Award:** EY AI Award 2026 (June), category "AI-Enabled Market & Demand Intelligence." Source: https://www.tacto.ai/en/resources-posts/tacto-wins-ey-ai-award-2026
- **Product direction** (designer job post): "move away from dashboards toward agents that take larger units of work off users' shoulders." They explicitly reject a sidebar chat: "the product just handles it and comes back when it needs you." Source: https://www.indexventures.com/startup-jobs/tacto/seniorstaff-product-designer/
- **Trust posture:** every AI action goes to an audit log, AI runs in the EU only, no training on customer data, ISO 27001:2022. They don't name an LLM provider publicly; the subprocessor list is in https://trust.tacto.ai, which is JS-only and I couldn't read it.

## 3. Systems and data they integrate with (FACTS)
- **ERPs:** SAP (incl. S/4HANA), Microsoft Dynamics (365), proAlpha, plus Power BI via API. This comes from a third-party review (https://www.ki-syndikat.de/tools/tacto/); Tacto's own pages only say "the ERP."
  - HUBTEX runs SAP. Its old process was SAP PDF export → Copilot → Excel.
  - BOMs are pulled from ERP or **PLM**.
  - DMS is used for quotes and certificates.
  - Data objects referenced: info records, BANF (purchase requests) and framework contracts.
- **Documents and channels:**
  - Supplier emails: price-increase letters forwarded to a dedicated inbox; RFQs sent and replies read as free text.
  - PDF quotes, Excel bids, order confirmations in any format (including handwritten changes).
  - Contracts, certificates and declarations (REACH/RoHS/TSCA/PPWR).
  - Technical drawings (PDF; drawings and STEP/3D models are claimed), supplier applications, VAT/public data, credit ratings.
- **External data:** LME, Destatis (German federal statistics office) producer price indices, FX, labor costs, 20k–50k indices, and Hydro/WV Stahl market input.
- **Order-confirmation matching fields:** article no., quantity, price, delivery date, payment terms, Incoterms, with per-supplier tolerances. Tacto says image-based OCR tops out around 40% touchless posting; their agent reaches ~80% at Debatin. Source: https://www.tacto.ai/de/resources-posts/webinaraufnahme-agentische-ab-pruefungen-bei-anton-debatin-intelligente-automatisierung-bis-zur-dunkelbuchung
- **Stack** (Product Engineer post): Python, FastAPI, Postgres, ClickHouse, React/Next.js/TS/Tailwind/Storybook. "For AI, whatever ships fastest." Source: https://jobs.ashbyhq.com/tacto/e345fd59-a0f2-4298-ab18-75bef8d22df6

## 4. Pain points they state publicly (FACTS, quoted)
- **Long tail and capacity:** buyers actively manage only about 20% of article numbers, and "the rest runs via email and Excel." Companies overpay about 10% on that unmanaged spend. Only about half of framework contracts are renewed on time, and re-tendering before renewal saves about 13% (Sourcing Intelligence webinar).
- **Data scattered across systems:** "Die Preise sind vorhanden, in SAP, in alten Projekten und in den Zeichnungen, nur eben nicht auf Knopfdruck" ("The prices exist, in SAP, in old projects and in the drawings, just not at the push of a button") — HUBTEX. Most of the time goes into gathering data rather than negotiating. Drawing-only parts have no price reference, and discontinued parts need internal coordination.
- **Every customer is different:** "every single customer's reality is different: a different ERP, a different data model, decades of undocumented process. Generic platforms stall exactly there, and that gap is where most enterprise AI value quietly dies." Source: FDE Team Lead post, https://jobs.ashbyhq.com/tacto/3d60a078-a501-4583-be87-bc9b163329e3
- **Data quality limits automation:** "Automatisierung funktioniert nur mit strukturierten und verfügbaren Daten" ("automation only works with structured, available data") — Debatin.
- **Explicitly still manual:** at Debatin, **invoice checking is fully manual**, and next steps are an RFQ agent for trading goods and automated supplier evaluation. About 20% of order confirmations still have deviations that need human decisions.
- **Context the systems lack:** "Systems lack contextual knowledge (how reliable a partnership is, a supplier's real priority)," so buyers supply it (Agent Shift webinar).
- **Crises:** Gulf war / Hormuz blockade (2026), energy crisis, "Chipkrise 2.0" (webinar 21 Oct 2026), US tariffs (Section 232/301), EU–India FTA and China+1. "Entscheidend ist nicht der Konflikt selbst, sondern die Reaktionsgeschwindigkeit" ("what decides it is not the conflict itself but the speed of response"). Source: https://www.tacto.ai/de/resources-posts/wenn-lieferketten-reissen-golfkrieg-deutsche-industrie
- **Human–agent interaction:** "patterns for how procurement professionals supervise AI agents — challenges no one has solved before" (Intern Product Engineer post). "A misunderstood recommendation … costs real money" (designer post).
- **Mission gap:** "AI … stops at the factory gate. The knowledge that holds manufacturing together — part costs, suppliers, materials — is scattered across systems and people." The roadmap language is about "connecting the digital world of engineering with the physical world of manufacturing," with features "procurement **and engineering** teams use every day."

## 5. Signals from job posts and roadmap (FACTS, from the Ashby API: 23 open roles)
- **Forward Deployed Engineering is a brand-new function.** FDEs build "agents, pipelines, custom logic" on customer production data and "build and prove agents for deployment steps that can be automated." Onboarding and data mapping are the bottleneck.
- **PM areas named:** Savings, Negotiations, Price Intelligence. The PM's job is "find the balance between automation and user control."
- **Growth role:** "supplier network effects, viral mechanics in industrial supply chains, product wedges that acquire users on their own." This suggests a supplier-side product or network.
- **Value Engineer / AI Automation Engineer:** turn a prospect's raw ERP extract into a savings business case fast ("Vibe Code @Tacto … extend our demo app with new value cases").
- **International GTM:** US, Nordics, Benelux. That implies multilingual supplier communication and US compliance (TSCA, NDAA, tariffs).

## 6. Top 5 predictions for the Tacto track (INFERENCE)

**1. Close the engineering → procurement loop (ECN, BOM or drawing → cost and supply impact).**
- **Why:** this is their stated next frontier ("connect engineering with manufacturing", "procurement and engineering teams", "gateway, not identity"). The HUBTEX BOM-costing pain is fresh (Sep 2026), and the hackathon's own sample trace is an ECN hitting BOM and open orders. Drawing extraction and target prices exist, but no agent handles change impact or design-to-cost proactively.
- **Inputs:** BOM (CSV, SAP STPO-like), PDF drawings, item master, info records (EINA/EINE), open POs (EKPO), supplier list, index prices.
- **Winning demo:** an engineer changes a part or uploads a new BOM. The agent finds affected parts, open orders and framework contracts, re-prices them with target-price logic, finds reuse candidates among similar existing parts, flags lead-time risk, drafts supplier re-quote emails, and asks before cancelling or changing any PO. It shows a € delta and an audit trail.

**2. "Any ERP in, Procurement Brain out": an agentic data-onboarding agent.**
- **Why:** the FDE and Solution Engineering posts call this the place "where enterprise AI value dies" and explicitly want agents that automate deployment steps. It's an internal unsolved problem that suits a 24-hour hack and recruiting.
- **Inputs:** messy exports from SAP, proAlpha and Dynamics. Expect German column names (MATNR, LIFNR, EBELN, NETPR, Bestellmenge), mixed units and currencies, duplicate suppliers, free-text material descriptions.
- **Winning demo:** the agent infers the schema mapping, normalizes units, currency and suppliers (dedupe), classifies spend into categories, validates with checks, and asks a human only about low-confidence mappings. Then within minutes it produces a first spend cube plus 3 quantified savings levers (price variance, bundling, cross-site). This doubles as the Value Engineer's "proof of value in an hour."

**3. Autonomous long-tail (B/C-parts) sourcing and negotiation with real supplier dialogue, possibly voice.**
- **Why:** 80% of articles are unmanaged with ~10% overpay. Their current agents mostly draft, and buyers send. Multi-round autonomous negotiation under guardrails is the obvious next step. ElevenLabs being a tech partner hints at voice, for example calling suppliers.
- **Inputs:** article list with price history, framework contract expiries, supplier emails and quotes (PDF/Excel), index data, policy rules (value limits, A-supplier exclusions).
- **Winning demo:** a trigger fires (contract at 80% consumption or a stale price). The agent computes a target price and BATNA, runs RFQs, and holds a simulated email or voice negotiation with LLM supplier personas. It respects guardrails, escalates for A-suppliers, and produces an award recommendation with € saved. A live negotiation on stage is a strong 3-minute moment.

**4. Supply-shock response agent: external event → exposure → actions.**
- **Why:** their 2026 content is dominated by Hormuz, energy, chips ("Chipkrise 2.0"), tariffs and "speed of response is decisive." Their Risk agent covers credit and single-source, but mapping news to BOM and supplier exposure (including tier-n and country of origin) and then acting looks unsolved.
- **Inputs:** a news or tariff feed (e.g., a Section 232 list, Hormuz headlines), supplier master with locations and countries of origin, BOM/material groups, indices, open POs and inventory.
- **Winning demo:** paste a headline. The agent identifies affected materials, suppliers and products, quantifies margin and supply-risk impact, proposes mitigations (alternative suppliers, safety stock, pull-forward orders, Defender responses to incoming price hikes), and asks for approval before sending supplier inquiries.

**5. Close the operational P2P loop: invoice 3-way match plus delivery-date expediting.**
- **Why:** Debatin explicitly says invoice checking is still 100% manual, and none of the 33 agents covers invoices or delivery chasing. It extends their order-confirmation success (PO ↔ order confirmation ↔ goods receipt ↔ invoice). Voice is a fit for chasing late deliveries.
- **Inputs:** POs, order confirmations, goods receipts, invoice PDFs (German, mixed layouts, discounts, surcharges such as alloy and energy surcharges), supplier emails.
- **Winning demo:** the agent matches the documents, explains each deviation (missing discount, quantity variance, surcharge not in contract), auto-posts clean ones, drafts a dispute email, and chases a late shipment by voice or email. It writes the new delivery date back to the ERP and alerts planning.

**Honorable mentions:**
- An "agent supervision inbox" UX: how a non-technical buyer oversees 30 agents. They call this unsolved.
- A supplier-side agent or network play (growth role).
- An agent that captures tacit buyer knowledge into rules ("teach AI the rules"). They name lack of relationship context as a gap.

**General tips for winning (inference):**
- Use realistic German Mittelstand data (SAP field names, German supplier emails, PDF order confirmations or quotes).
- Show tool calls against mock ERP, PLM or email systems, a human-approval step, write-back and an audit log.
- Quantify € impact.
- Fit the 3-minute pitch.
- Respect Tacto's "no sidebar chat; the product handles it and comes back when it needs you" philosophy.
- Synera owns CAD/engineering and Certivity owns regulation, so keep the Tacto entry procurement- and cost-centric even when it touches BOMs.

**Raw data:** the Tacto jobs JSON is saved at `/private/tmp/claude-501/-Users-shreyansh/af8ef3c5-d472-49c1-b1c1-c6daa3908645/scratchpad/tacto_jobs.json`, with extracted job texts in `/private/tmp/claude-501/-Users-shreyansh/af8ef3c5-d472-49c1-b1c1-c6daa3908645/scratchpad/jobs_text.txt`.
