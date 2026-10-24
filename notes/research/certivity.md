# Certivity research brief

> Source: Claude Code session `af8ef3c5`, 23–24 Oct 2026. Saved from the conversation as-is.

CERTIVITY RESEARCH BRIEF (as of 23 Oct 2026)

Bottom line: Certivity's platform already turns regulations into structured, paragraph-level data. It tracks changes and exports AI-drafted requirements into requirements-management (RM) tools. The pieces it has not shown publicly are the agentic layer on top: reliable impact analysis inside the customer's own engineering artifacts, verified requirement generation, and compliance-evidence or gap packages. The hackathon site's own example trace is a regulatory-change triage agent in miniature (example below, under Hackathon facts).

Hackathon facts (confirmed)
- Certivity is Track 03, alongside Synera (Track 01) and Tacto (Track 02).
- No brief is public. Briefs are read on Saturday at 10:00, and challenge owners hold office hours Saturday afternoon.
- The jury scores "agents that run." Each partner picks 4 finalists at the 13:30 track judging, then finals are 3-minute pitches plus Q&A.
  - https://www.industrialagents.dev/
  - https://luma.com/070qezlj
- The site's illustrative "agent trace" goes: ECN (engineering change notice) → plm.affected_assemblies → cad.check_fit → erp.open_orders → ask the engineer before the risky step → set status to hold → notify owners. It ends "no silent BOM edits." That is the pattern judges will expect: read the task, call the company's systems, ask a human, write back.
- A Manage & More post reposted by Certivity says it brings "a real compliance challenge." An organizer describes it as "messy, document intensive work with high stakes."

=== FACTS (sourced) ===

1. What the company does
- Munich RegTech, founded 2021 by Nico Wägerle (CEO), Bogdan "Bob" Bereczki (CPO), Jörg Ulmer (CTO) and Sami Vaaraniemi (CSO); CFO Tim Gruber.
  - Wägerle is an ex-Daimler and Argo AI lawyer who worked on automated-driving homologation (vehicle type approval).
  - Bereczki is ex-Audi and Jaguar Land Rover, and worked on certifying automated driving systems.
  - Size: 80+ employees, 15,000+ users, 50+ enterprise customers (the Aureon page says 70+ organizations). Offices in Munich and Stuttgart. https://certivity.io/about-certivity
- Funding: €13.3M Series A in July 2025, led by Almaz Capital and UVC Partners, with Earlybird X, HTGF and Plug and Play. Seed was €1.4M in 2022, led by Earlybird UNI-X.
  - https://www.uvcpartners.com/blog/certivity-raises-eu13-3-million-in-series-a-to-shape-the-future-of-technical-compliance
  - https://tech.eu/2022/06/07/taking-on-the-automotive-industry-first-certivitys-regtech-solution-draws-eur14-million-in-earlybird-uni-x-led-round/
- Tagline: "The AI-product compliance Platform. Transform regulations into engineering-ready requirements." https://www.certivity.io
- Product modules:
  - **Certivity Core**
    - Regulatory Inbox: new regulation, new version or newly monitored document, with the number of affected projects, assigned to people or teams.
    - Change View: paragraph-level diff between any two versions.
    - Link References: resolves internal and external references.
    - Text Classification: tags paragraphs as requirement, definition, scope or obligation.
    - Consolidation Order Graph: original act, amendments and corrigenda, giving the current consolidated version.
    - Timelines for transitional provisions, contact-person ownership, AI keywords, and standards-metadata monitoring (revisions, withdrawals).
    - Certivity AI: assistant, summaries, semantic or vector search across translations, "AI document chat."
    - https://www.certivity.io/platform/certivity-core
  - **Collaboration**
    - Paragraph-level interpretations with a four-eyes review. Interpretations carry over to new regulation versions with a prompt to re-review.
    - Applicability matrix by region. Project scopes range from a component or part family to a vehicle type (e.g. M1) or a whole organization.
    - AI-drafted engineering requirements, AI classifications driven by user prompts, export baselines, and "export sync alerts."
    - https://www.certivity.io/platform/collaboration
  - **Engineering Integration / Export**: exports hierarchy, tables as HTML, formulas as MathML, and page-link traceability. Delta updates touch only changed elements. https://www.certivity.io/platform/engineering-integration-export
  - **Customer Documents**: internal and customer documents (OEM requirements, internal standards, specs, compliance evidence) go through "PDF to Data," with cross-referencing between regulations, standards and customer specs. https://www.certivity.io/platform/customer-documents
  - **Data model**: Word, PDF, HTML, XML or RTF parsed into atomic paragraph or element snippets. The page says giving AI "step-by-step context at paragraph level" is what makes LLM output reliable. https://www.certivity.io/platform/certivity-data-driven-approach
- Users: homologation, product compliance, regulatory affairs and engineering teams. The LinkedIn About section says the same.
- Industries listed on the site: Automotive (the core), General Engineering, Nuclear & Waste, Defense (STANAG, MIL), Rail.
  - Stated expansion targets: heavy machinery, consumer goods, defense, aerospace, medtech, rail.
  - The Oct 2026 job post: "We started in automotive, and it is still our core. Now we are expanding into other highly regulated engineering sectors."
- Named customers:
  - Mercedes-Benz: selected in Aug 2026, replacing its in-house tool "Aureon," which shuts down 31 Dec 2026. Certivity runs a migration program for all Aureon customers. https://certivity.io/blog/press-release-certivity-x-mercedes and https://certivity.io/aureon-certivity-migration
  - Also BMW, Schaeffler, ZF, Aumovio (Continental spin-off, full rollout Sept 2025), TÜV Rheinland (partner and internal user, Sept 2025) and Aptiv.
    - https://certivity.io/blog/press-release-aumovio-x-certivity
    - https://certivity.io/blog/press-release-tuv-rheinland-x-certivity
    - Job post: https://certivity.jobs.personio.de/xml?language=en
  - Motherson: joint Plug and Play award at STARTUP AUTOBAHN 2026.
  - T-Systems: integrates Certivity's API into TypeMaster (type-approval documentation).
  - The VDE article says it also has aerospace customers.

2. AI and agent strategy
- Claude is used in both directions. Head of AI & ML Saahil Ognawala (at the 1 Jun 2026 Anthropic × UVC event at Certivity's office) said Claude Code builds the platform and Claude runs "inside the compliance agents customers use… one continuous thread rather than a bolt-on." Anthropic's Stephan von Perger, also a hackathon host, pitched "reusable skills," MCP and subagents. https://certivity.io/blog/how-do-we-build-for-the-ai-first-era-with-anthropic-uvc-partners-at-the-certivity-office
- The LinkedIn search snippet describes Ognawala's team as "building a regulatory compliance agent for global customers."
- ELIV, 15 Oct 2026, lightning talk: "From Regulations & Standards to Engineering Artefacts: How AI Agents Transform Regulatory Analysis."
  - LinkedIn names Lorenzo-Ottavio Mathias as the speaker; the VDI programme lists Dr.-Ing. Olaf Schädler.
  - https://www.vdiconference.com/eliv/specials/
- Ognawala's essay "What Compounds, Wins" (May 2026) is his personal view, not a product statement.
  - Against: generic atomic agents ("PDF extraction agent") that users wire together themselves.
  - For: job-level agents with "a context engine that grows over time," which learn from past decisions and overrides.
  - His worked example is a SOC 2 agent that produces "an audit-ready evidence package that shows exactly what's covered, what's missing."
  - He also says BM25 near the business logic can beat vector search, and calls capturing implicit expert decision patterns the hard part.
  - https://www.saahilognawala.com/technology/data/generative-ai/llm/2026/05/02/what-compounds-wins/
  - LinkedIn: the harness "matters far more than the model itself."
- Older public framing: "LLMs and domain-specific AI… law as data"; "classifies, extracts, generates, and tests requirements" (UVC). Whitepaper: AI-driven regulatory impact analysis, "from hours to minutes," citing roughly 10x regulatory volume growth in a decade. https://www.certivity.io/resources/whitepaper-ai-driven-regulatory-analysis
- Internally the RevOps role builds AI agents on Claude, with HubSpot and Clay.

3. Regulations, standards and integrations
- Sources tracked: UNECE, EU, Euro NCAP, ISO, IEC, CEN, CENELEC, ETSI, ASTM, UL, SAE, STANAG and MIL, plus about 30 national jurisdictions (CN, JP, KR, IN, US, BR, …). Coverage is quoted as 50+, 75+ or 85 jurisdictions.
- Domains named in the Mercedes release: "emissions, cybersecurity, battery, and safety regulations." Earlier coverage stresses automated driving and Level 4 law. https://www.connect-professional.de/security/mercedes-benz-setzt-auf-certivity-fuer-compliance-405148.html
- They say cars face more than 2,500 regulations worldwide, changing 3 to 4 times a year. https://www.munich-startup.de/news/certivity-7-fragen
- RM and PLM integrations:
  - Listed tools: Jama (API and Jama Connect Interchange), IBM DOORS Classic and DOORS NG, Siemens Polarion (official partner), PTC Codebeamer, Integrity and Windchill RV&S, Jira, ENOVIA, Windchill, PREEVision, OpenText, and ReqIF.
  - The CEO says it is also embedded with "PLM systems, material databases."
  - https://www.certivity.io/about-certivity/partner-ecosystem
- Certifications: ISO 27001, TISAX L2 High, SOC 2.

4. Public pain points (quotes)
- "Engineers often waste time navigating unstructured PDFs and searching for 'that one' regulation."
- "Manual workflows are error-prone… errors can cause technical, economic and legal consequences."
- "Regulation updates create chaos… interdependencies between the regulations are complex and lead to uncertainties during the engineering process." (homepage)
- "Engineers spend 30–50% of their time" on regulatory documents (UVC).
- Wägerle: "We entered the requirements manually in Excel spreadsheets," until it became untenable. Engineers should be alerted "when a planned test no longer applies." https://dialog.vde.com/en/vde-dialog-editions/2025-02-rohstoffe/2025-02-sicherheit-standardissierung
- Aumovio: hard to keep "traceability across the product lifecycle"; data "not structured or connected across teams."
- Interpretations used to be lost in email threads.
- 2021 five-year goal: integrate deeper, "including certification evidence."
- "Modern compliance in regulated industries must be integrated directly into engineering." (Wägerle)

5. Job-post and roadmap hints (Personio feed, Aug–Oct 2026)
- Python Engineer, Web Crawling & Data Extraction (posted 7 Oct)
  - Anti-bot crawling of regulator sites, HTML and PDF to structured data "including LLM-assisted extraction."
  - Quote: "silently wrong output is worse than a crash."
  - Deduplication and versioning pipelines.
  - Stack: Python, GCP Cloud Run, Azure Blob, MongoDB, Go, React.
- Senior Software Engineer, Document Ingestion & Extraction (Aug): extraction plus "tooling that verifies this data is correct"; "AI-native" with AI coding tools.
- Product Compliance Manager / Solution Engineer (15 Oct): turns customer compliance processes into platform configurations and workflows, and feeds the "AI and software roadmap." Notes the expansion beyond automotive.
- Revenue Operations Manager: "Build AI agents for account research…" on Claude.
- Roadmap themes: more coverage (standards and technical specs), "smarter AI," deeper tool integrations, new verticals, and TÜV "market access services" for cross-border compliance. The Aureon migration is a big 2026 workload.

=== INFERENCES ===
Gap analysis: the platform covers regulation → structured data → AI-drafted requirements → export, plus change diffs. Nothing public shows agents that act inside the customer's engineering artifacts or produce verified evidence. Their open problems look like correctness and trust, and closing the loop. The track will most likely be framed around homologation or automotive, using public UNECE / EUR-Lex texts. ISO and IEC standards are paywalled, so they are unlikely to be the data. Expect a mock RM export (ReqIF, CSV or JSON) or a sandboxed Certivity API.

TOP 5 PREDICTIONS (ranked)

1. Regulatory change impact agent: "a regulation changed, what do we have to do?" (most likely)
- Why:
  - It is the whitepaper topic, the Mercedes value proposition and the Regulatory Inbox.
  - It matches the ECN trace on the hackathon site one-for-one.
  - Wägerle's "planned test no longer applies" example.
- Inputs:
  - Two versions of a UNECE regulation (e.g. UN R155 cybersecurity, R156 software updates, R157 ALKS, R79 steering, R10 EMC) or an EU act (GSR 2019/2144, Euro 7 2024/1257, Battery Reg 2023/1542).
  - A mock Polarion or DOORS requirement and test set, with trace links.
- Winning demo:
  - Paragraph diff → classify the change (substantive vs. editorial).
  - Resolve cross-references and transitional deadlines.
  - Find affected requirements and tests, with a confidence score and a citation to the source paragraph.
  - Draft redlined requirement updates and ask the engineer before any write-back. Notify owners and log an audit trail.
  - Show precision and recall on a small labeled set, and "no silent edits."

2. Compliance evidence and gap agent: build the audit- or type-approval-ready package
- Why: the five-year "certification evidence" goal, Ognawala's evidence-package example, and TÜV and T-Systems homologation partnerships.
- Inputs: an applicable regulation (e.g. UN R155 Annex 5 / CSMS), engineering artifacts (requirements, test reports, design docs, supplier declarations).
- Winning demo:
  - A compliance matrix per paragraph: covered, partial or missing, with evidence links.
  - Gaps ranked by risk and deadline, plus a draft information document or test plan.
  - Human sign-off.
  - Memory of past reviewer and technical-service decisions (the "compounding" angle).

3. Verified regulation-to-requirements generation, including conflicts with customer specs
- Why: the feature exists ("AI-drafted requirements"), but trust is the open problem, per "silently wrong output is worse than a crash" and the verification-tooling job posts. Customer Documents adds OEM-spec ↔ regulation cross-referencing.
- Inputs: a regulation PDF, an OEM spec (Lastenheft), internal standards.
- Winning demo:
  - Atomic, testable requirements (INCOSE or EARS style).
  - A generator–critic loop that checks every requirement against its source text, so nothing is invented and nothing is dropped.
  - Flags conflicts or duplicates between the OEM spec and the regulation.
  - Exports ReqIF with trace links, plus an eval harness showing faithfulness.

4. Applicability and market-access agent: "which rules apply to this product in these markets, and by when?"
- Why: applicability matrices, TÜV "market access services," the international coverage, and the push into new verticals.
- Inputs: a product description or BOM (vehicle category M1/N1, EV battery, ADAS features; or a machine or robot) and target markets (EU, UK, CN, US, IN).
- Winning demo:
  - The agent asks clarifying questions, then outputs a regulation list with reasoning chains, phase-in timelines and cross-jurisdiction equivalents (UNECE vs. FMVSS vs. GB).
  - Variant for a new vertical: Machinery Regulation 2023/1230, Cyber Resilience Act, AI Act, Battery Regulation, rail TSIs.
  - Material databases point to a REACH / RoHS / PFAS substance-compliance version.

5. Self-verifying regulatory ingestion and monitoring agent
- Why: two of the five open roles are crawling and extraction with a correctness focus. It covers 85 jurisdictions and hard parts like consolidating amendments and corrigenda.
- Inputs: regulator websites (UNECE WP.29, EUR-Lex, foreign-language sources), messy PDFs and tables.
- Winning demo:
  - Detect new versions, parse the hierarchy, tables and formulas, build the consolidated version.
  - Translate, then self-validate (structural checks, round-trip, cross-model checks) and route low-confidence items to a human queue.
  - Measured error rate.
- This is less flashy, so it may be folded into #1 as a sub-task.

General advice
- Build on the Claude Agent SDK with MCP tools that mock Certivity, Polarion or Jama, and an RM export.
- Give every claim a paragraph-level citation, keep a human approval gate, and show a small eval. Add learning from reviewer overrides ("context engine") to stand out to Ognawala.
- Prepare reusable parsers ahead of time: UNECE PDFs, a EUR-Lex XML/HTML parser, a ReqIF writer and a diff engine.
- Challenge owners likely to attend: Saahil Ognawala (Head of AI & ML), plus the ELIV speaker (Lorenzo-Ottavio Mathias or Olaf Schädler).
