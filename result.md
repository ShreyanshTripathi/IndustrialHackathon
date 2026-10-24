# Results

Scores and experiments so far on the worked example `dev-rear-lamp` (190 expected requirements from UN R148, R48, R150, R10). The pipeline is described in `overflow.md`, and the design in `docs/DESIGN.md`. All run files are in `out/` (git-ignored, local only).

## Best submission

**Best scored on the platform: `out/best_dev-rear-lamp.json`.** This is v6b, uploaded on 24 Oct at 17:36: the critic filter, then the paragraph ranker (score ≥ 20), then duplicate removal at ≥ 93%. These are now the pipeline defaults.

| Level | Precision | Recall | F1 | F2 |
|---|---|---|---|---|
| Requirements (platform judge) | 43.4% | 71.1% | 53.9% | **63.0%** |
| Pages | 71.4% | 94.3% | 81.3% | |
| Regulations | 100% | 100% | 100% | |

It has 311 requirements and passes `tools/validate.py`. The other uploads were v1 (0.568), v2 (0.499), v5 (0.625), v6a (0.607) and v9 (0.630, a tie with fewer requirements), all kept in `out/uploads/`.

## All runs

Requirement-level scores come from our own judge (`eval/judge.py`), except where the platform is named.

| Run | File | Extractor | Requirements | Matched | F2 (ours) | F2 (platform) |
|---|---|---|---|---|---|---|
| **v1** | `out/uploads/dev-rear-lamp_v1_F2-0.568.json` | close to the wording, subject named after the product | 429 | 143–146 | 0.601–0.614 | **0.568** |
| v1b | `out/dev-rear-lamp/v1b.json` | v1 prompt restored | 421 | 144 | 0.610 | — |
| v2 | `out/dev-rear-lamp/v2.json` | strictly verbatim; every "shall" and list item split | 412 | 127 | 0.542 | **0.499** (P 28.4%, R 61.6%; pages 66.2% / 100%) |
| v2, unfiltered | `out/dev-rear-lamp/v2_all.json` | v2 before the critic filter | 599 | 148 | 0.545 | — |
| v3 | `out/dev-rear-lamp/v3.json` | verbatim, but tolerances and exceptions kept with the obligation | 389 | 128 | 0.557 | — |
| v3, unfiltered | `out/dev-rear-lamp/v3_all.json` | v3 before the critic filter | 572 | 138 | 0.518 | — |
| v4 | `out/dev-rear-lamp/v4.json` | v1 rules + retrieved expert examples + parent context | 408 | 141 | 0.604 | — |
| v4, unfiltered | `out/dev-rear-lamp/v4_all.json` | v4 before the critic filter | 599 | 147 | 0.541 | — |
| v5 | `out/uploads/dev-rear-lamp_v5_F2-0.625.json` | v1b + paragraph ranker (score ≥ 20) + duplicate removal (≥ 97%) | 352 | 141 | **0.634** | **0.625** (P 39.5%, R 73.2%; pages 71.4% / 94.3%) |
| v6a | `out/uploads/dev-rear-lamp_v6a_F2-0.607.json` | v5 with ranker cut-off 30 instead of 20 | 311 | 131 | 0.612 | **0.607** (P 41.8%, R 68.4%; pages 76.9% / 94.3%) |
| **v6b (best)** | `out/uploads/dev-rear-lamp_v6b_F2-0.630.json` | v5 with duplicate threshold 93% instead of 97% | 311 | 136 | 0.635 | **0.630** (P 43.4%, R 71.1%; pages 71.4% / 94.3%) |
| v7 | `out/dev-rear-lamp/v7_new_drawing.json` | full fresh run on the new labelled drawing | 360 | 122 | 0.545 | — |
| v8 | `out/dev-rear-lamp/v8_union2_dedup93.json` | v5 and v7 combined, duplicates removed at 93% | 508 | 136 | 0.536 | — |
| v9 | `out/uploads/dev-rear-lamp_v9_F2-0.630.json` | scope fix: regulation's full scope kept (categories, device and colour lists, exceptions); fresh run on the new drawing | 295 | 141 | **0.668** | **0.630** (P 45.1%, R 70.0%; pages 69.3% / 98.1%) |
| offline test | `out/dev-rear-lamp/offline_test.json` | v1b, rerun from saved stages with 0 API calls | 421 | 144 | 0.610 | — |

Next to each file, `<name>.judge.json` lists the matched pairs, the misses and the extras.

## Results by stage

| Stage | Result on dev-rear-lamp |
|---|---|
| 0 Ingest | 43,746 paragraphs from 94 PDFs; all 284 worked-example citations resolve to the right paragraph and page |
| 0 Graph | 12 of 16 golden annex paragraphs reachable by references within 2 hops; sub-goal alignment flags every changed requirement |
| ①–③ Regulation choice | exactly R10, R148, R150, R48; R3, R7, R23 dropped as superseded |
| ④ Section choice | sections holding all 190 golden paragraphs are selected (190/190) |
| ⑤ Extraction | requirements extracted from 185/190 golden paragraphs |
| ⑥ Critic filter | 179/190 golden paragraphs survive |
| Platform matching | ~135/190 match |

**Where recall is lost:** not in finding the right paragraph, but in how the requirement is written, merged or split.

## Dry run: invented front bumper

`out/dryrun-front-bumper/`, run up to regulation choice only.
- **Selected:** R10, R127, R148, R149, R26, R42, R48. R6 and R19 dropped as superseded.
- **Excluded, with reasons:** GTR 9 (transposed into R127), R94 and R137 (whole-vehicle crash tests), R128, R155, R156, R175.

There's no expected answer for this case; the selection is a judgement call.

## Calibration of our judge

| Version of `eval/judge.py` | Matched on v1 | F2 on v1 | vs platform (~135, 0.568) |
|---|---|---|---|
| first (lenient) | 160 | 0.673 | +10 F2 points |
| strict ("when in doubt, do not pair") | 111 | 0.467 | −10 F2 points |
| **current** (scope, condition and numbers must agree) | 143 / 146 | 0.601 / 0.614 | +3–4 F2 points |

- **Noise:** two fresh runs on the same file differ by about ±3 matches.
- **Sixth upload (v9, 24 Oct 19:16):** platform 0.630 against 0.668 from our judge, an offset of 3.8 points (≈133 matched on the platform against 141 on ours). It ties v6b: precision is up (45.1% vs 43.4%) and recall is down (70.0% vs 71.1%).
- **Fifth upload (v6b):** platform 0.630 against 0.635 from our judge. Duplicates at 93% beat 97%, so 93 is the new default.
- **Fourth upload (v6a):** platform 0.607 against 0.612 from our judge. Cut-off 30 loses more recall than it gains in precision, so 20 stays the default.
- **Run-to-run variance:** a full fresh run on the new drawing (v7) matched 122 against 144 for v1b. The missed obligations are spread across all regulations (27 lost, 5 gained): the extractor emits a different subset each run. Combining two runs (v8) doesn't help, because their wordings differ too much for duplicate removal to merge them.
- **Third upload (v5):** platform 0.625 against 0.634 from our judge, so it was only 0.9 points high this time. The offset varies (0.9 to 4.6), but the ranking of files was right in all three uploads: v5 > v1 > v2.
- **Confirmed on a second upload:** v2 scored 0.499 on the platform against 0.542 from our judge. Our judge sits a steady ~4 F2 points above the platform. It predicted v1 → v2 as −5.9 to −7.2, and the platform measured −6.9. Use it to rank candidate files before uploading.
- **How to read it:** a local F2 of 0.60 is about 0.57 on the platform.

## Retrieval and ranking experiments (v4, v5)

- **Paragraph ranker** (`pipeline/rank.py`): one call per section. It sees retrieved expert examples (paragraphs listed, with their requirement, and paragraphs not listed) from other regulations and from the R175 sub-goal data, leaving out the same case and regulation.
  - It separates expert from non-expert paragraphs with an AUC of 0.80 (R10 0.93, R148 0.82, R150 0.80, R48 0.75).
  - Only the bottom cut pays: below a score of 20 the hit rate is 6%, under the 12% break-even. Between 20 and 30 it's 24%.
  - Net gain: +0.010 F2.
- **Duplicate removal** (`verify.dedup`, ≥ 97% similar within a regulation): +0.013 F2, costs at most 1 match.
- **Retrieved style examples + parent context in the extractor (v4):** 141 matches against 143–146 for v1, so no gain. Turned off (`extract.STYLE_EXAMPLES = False`).
- **Plateau:** every extractor variant (v1–v4) reaches 140–148 matches before filtering. A perfect paragraph filter would give 0.714 on our judge (~0.67 on the platform). The ranker gets about a tenth of that gap.

## Scope narrowing (v9)

- **Diagnosis:** the extractor narrowed the regulation's scope to the product ("M1 and N1" → "M1", "red, amber or white" → "red", S3/S4 dropped, a logo rule split per lamp). The graph text and the section choice were complete. The cause was the extractor prompt ("skip vehicle categories this product does not have", "split per lamp function"), helped by the profile keeping only `M1` and dropping the spec's "apply across M and N categories".
- **The judge allows a narrower subject but not a narrower condition:** expert requirements with a generic subject matched 14 of 19 even when we named our lamp. Requirements with vehicle categories matched only 1 of 5.
- **Fix:** the extractor keeps every category, device list, colour list and exception, and keeps a broader subject whole. The profile has a new `regulatory_scope` field. The section selector and critic skip only what is *only* about other products.
- **Result (our judge):** of the 8 targeted paragraphs, 6 expert requirements newly matched and 1 was lost. Vehicle-category cases went from 1/5 to 3/5. Total matches 141 (v1b 144), with 295 requirements instead of 311.
- **Platform:** 0.630, the same as v6b. The targeted cases improved, but run-to-run variance elsewhere cancelled the gain. Still missed: R48 6.4.4.2 (off-road exception) and 6.10.7.

## What we learned

- **Scoring formula:** F2 = 5·M / (4·190 + S), where M is matched and S is submitted. An extra requirement is worth keeping if it has more than F2/5 ≈ 11% chance of matching. Recall gains count about 4× more than cuts.
- **Critic categories:** the hit rates below were measured across v1, v2 and v3.

  | Category | Hit rate | Decision |
  |---|---|---|
  | product requirement | 39–40% | kept |
  | limit-defining test condition | 15–23% | kept |
  | optional / advisory | 16–31% | kept |
  | lab procedure | 6–8% | dropped |
  | manufacturer process | 0–2% | dropped |
  | condition not met | 0% | dropped |

- **Regulation choice needs scope plus dedicated provisions.** The rule "a whole-vehicle regulation counts only if it has provisions written for the component" keeps R26 out for a lamp and in for a bumper.
- **The answer's style is not pure verbatim.** It keeps tolerances and exceptions with the obligation and writes full sentences that name the subject. Making our extractor more verbatim (v2, v3) lowered the score.
- **Reproducibility:** the order of set iteration in the graph build and in the reconciler changed prompts between runs. It's fixed (sorted), and the graph is now identical across hash seeds.

## Cost

About $30 of the $150 budget spent so far. Approximate cost per stage:

| Stage | Cost | Time |
|---|---|---|
| Regulation selection (58 calls) | ~$1.45 | <90 s |
| Section selection + extraction + critic | ~$5.5 | ~4 min |
| One judge run | ~$0.5 | ~30 s |
| Rerun from cache or with `--resume` | $0 | seconds |

## Sub-goal: `subgoal-dev` (UN R175 0.1.0 → 1.0.0)

**`out/subgoal-dev/changes.json`**: 23 changes (6 modified, 1 removed, 16 added). Passes `validate.py --requirements-old`. Built in plain code (`pipeline/subgoal.py`), with no model calls. Scored offline with `eval/subgoal_score.py` against the 24 expected changes:

| Measure | Result |
|---|---|
| Flagged recall | 0.917 (22/24) |
| Flagged precision | 0.957 |
| **Platform (uploaded 24 Oct 16:35)** | **flag recall 83.3%, flag precision 87.0%, change accuracy 94.7%** |
| Modified/removed: flagged / right change type | 7/7, 7/7 |
| Added: found / submitted | 15/17, 16 |
| `new_text` wording vs expected (modified / added) | 93% / ~91% similar |

- **Missed (2):** "Tests without a target may be combined where feasible" (a clause the experts split out of a sentence), and the second of two 6.6.2.1 items, which the PDF lists inline as "(a) …, (b) …".
- **Reasons:** use the expected template ("'a' became 'b'; 'c' was added"). R-018 and R-090 match the expected reason almost word for word.
- **Platform vs ours:** the platform matched 2 fewer changes. They must be among the added items, since modified and removed are matched by ID. Our offline pairing of added items (same paragraph plus loose wording) is too generous. The uploaded file is kept as `out/uploads/subgoal-dev_v1_recall-0.833.json`.
- **Caveat:** the two thresholds (`MODIFIED_MIN = 56`, `ADDED_MAX = 75`) were tuned on this one pair, which is the only one we have.

## Not done yet

- **UI and demo:** not built; it's 20% of the score.
- **Held-out case `heldout-front-bumper`:** released Sunday 08:00. Uploads close 13:00, and the last upload counts.
