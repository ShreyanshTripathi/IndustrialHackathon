# Results

Scores and experiments so far on the worked example `dev-rear-lamp` (190 expected requirements from UN R148, R48, R150, R10). The pipeline is described in `overflow.md`, and the design in `docs/DESIGN.md`. All run files are in `out/` (git-ignored, local only).

## Best submission

**`out/best_dev-rear-lamp.json`.** This is v1, uploaded on 24 Oct at 15:40, with `team_id` corrected to `team-08`.

| Level | Precision | Recall | F1 | F2 |
|---|---|---|---|---|
| Requirements (platform judge) | 31.5% | 71.1% | 43.6% | **56.8%** |
| Pages | 65.0% | 98.1% | 78.2% | |
| Regulations | 100% | 100% | 100% | |

It has 429 requirements and passes `tools/validate.py`. The uploaded original is kept in `out/uploads/dev-rear-lamp_v1_F2-0.568.json`.

## All runs

Requirement-level scores come from our own judge (`eval/judge.py`), except where the platform is named.

| Run | File | Extractor | Requirements | Matched | F2 (ours) | F2 (platform) |
|---|---|---|---|---|---|---|
| **v1** | `out/uploads/dev-rear-lamp_v1_F2-0.568.json` | close to the wording, subject named after the product | 429 | 143–146 | 0.601–0.614 | **0.568** |
| v1b | `out/dev-rear-lamp/v1b.json` | v1 prompt restored | 421 | 144 | 0.610 | — |
| v2 | `out/dev-rear-lamp/v2.json` | strictly verbatim; every "shall" and list item split | 412 | 127 | 0.542 | — |
| v2, unfiltered | `out/dev-rear-lamp/v2_all.json` | v2 before the critic filter | 599 | 148 | 0.545 | — |
| v3 | `out/dev-rear-lamp/v3.json` | verbatim, but tolerances and exceptions kept with the obligation | 389 | 128 | 0.557 | — |
| v3, unfiltered | `out/dev-rear-lamp/v3_all.json` | v3 before the critic filter | 572 | 138 | 0.518 | — |
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
- **How to read it:** a local F2 of 0.60 is about 0.57 on the platform.

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

## Not done yet

- **Sub-goal (⑦ change analyst):** not built; it's 15% of the score. The version matching it needs already exists in the graph.
- **UI and demo:** not built; it's 20% of the score.
- **Held-out case `heldout-front-bumper`:** released Sunday 08:00. Uploads close 13:00, and the last upload counts.
