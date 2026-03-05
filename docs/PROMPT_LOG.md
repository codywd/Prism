# Prompt Iteration Log

## Purpose

This log tracks every meaningful change to Prism's AI prompts and its effect on decomposition quality. Phase 1 is fundamentally a prompt engineering effort, and this log is how we know whether we're making progress.

## How to Use This Log

1. Before changing a prompt, record the current evaluation scores as a baseline.
2. Make the change. Describe what changed and why.
3. Re-run the evaluation harness (all 10 test questions, or a targeted subset if the change was narrow).
4. Record the new scores.
5. Note whether the change is kept or reverted.

## Log Format

Each entry follows this structure:

---

### Version 1.0 - 2026-03-05

**Prompt changed:** Decomposer (baseline), Auditor (baseline), Expander (baseline)
**What changed:** Baseline evaluation. Prompts as defined in PRISM_SPEC.md Section 4, implemented in Phase 1 Tasks 1-8.
**Hypothesis:** N/A (baseline)
**Provider:** Mixed mode -- decomposition via anthropic (claude-opus-4-6), audit/expansion via openai-compatible (claude-sonnet-4-20250514 through Alter)

**Scores (per-question):**

| Q | Topic | Persp. Diversity | Claim Type Accuracy | Confidence Calibration | Evidence Balance | Tension Identification | Steel-Manning | **Avg** |
|---|---|---|---|---|---|---|---|---|
| Q1 | Engineering→Teaching | 5 | 4 | 5 | 4 | 5 | 5 | **4.67** |
| Q2 | Homeschooling | 5 | 4 | 4 | 4 | 5 | 5 | **4.50** |
| Q3 | Light rail vs BRT | 5 | 4 | 4 | 4 | 5 | 5 | **4.50** |
| Q4 | Universal Basic Income | 5 | 4 | 5 | 4 | 5 | 5 | **4.67** |
| Q5 | Monolith→Microservices | 5 | 4 | 5 | 4 | 5 | 5 | **4.67** |
| Q6 | AI diagnostics | 5 | 4 | 4 | 4 | 5 | 5 | **4.50** |
| Q7 | Gene editing | 5 | 5 | 4 | 4 | 5 | 5 | **4.67** |
| Q8 | Social media ID | 5 | 4 | 4 | 4 | 5 | 5 | **4.50** |
| Q9 | Remote work | 5 | 4 | 4 | 4 | 4 | 4 | **4.17** |
| Q10 | Buy an EV | 5 | 4 | 4 | 4 | 5 | 4 | **4.33** |

**Per-dimension averages:**

| Dimension | Average |
|---|---|
| Perspective Diversity | 5.00 |
| Claim Type Accuracy | 4.10 |
| Confidence Calibration | 4.30 |
| Evidence Balance | 4.00 |
| Tension Identification | 4.90 |
| Steel-Manning | 4.80 |
| **Overall Average** | **4.52** |

**Phase 1 pass/fail: PASS (10/10 questions at 4.0+, threshold was 8/10)**

**Questions that improved:** N/A (baseline)
**Questions that regressed:** N/A (baseline)
**Decision:** Baseline accepted. No prompt changes needed to meet Phase 1 criteria.

**Notes:**

Perspective Diversity scored 5.0 across all 10 questions. Opus consistently produces 5 genuinely distinct perspectives including at least one that challenges the question's framing. This is the strongest dimension.

Claim Type Accuracy is the weakest at 4.10. The recurring issue is VALUE claims receiving confidence scores above 0.8 (Q3: "cities need transit" at 0.85, Q6: "clinical validation is necessary" at 0.85, Q7: "preventing disease reduces suffering" at 0.90, Q8: "anonymity protects vulnerable populations" at 0.90). These are widely held values but confidence scores should reflect normative contestation, not empirical certainty. The Sonnet auditor is less aggressive than the Opus auditor at flagging this. Candidate for prompt tuning in a future iteration.

Evidence Balance is 4.0 flat. All questions have balanced evidence where evidence exists, but several claims lack any evidence. The 16-24 claim range with 10-15 evidence items means roughly 40% of claims are unsupported. Acceptable for the graph UI (users can expand to find evidence) but a prompt tuning target if we want denser evidence on the initial decomposition.

Q9 (Remote work) was the weakest overall at 4.17. The "Measurement Skeptic" perspective saves the diversity score, but tensions are less specific than other questions. The topic may be harder to decompose well because the evidence base is genuinely weak and contested, which is itself a valid finding.

Q10 (Buy an EV) at 4.33 successfully separates personal and systemic layers as the spec required. The lifecycle carbon claim at 0.2 confidence is notably well-calibrated. Steel-manning docked to 4 because the "Cautious Wait-and-See" perspective is slightly weaker than the others.

Mixed-mode provider configuration (Opus decompose, Sonnet audit/expand via Alter) produces quality indistinguishable from full Opus at roughly half the API cost and 2.5x faster. This is the production configuration going forward.

**Raw Output:** `scripts/eval/output/Q1-Q10_2026-03-05T22-15-54.json`

---

### Version [X.Y] - [YYYY-MM-DD]

**Prompt changed:** Decomposer | Auditor | Expander
**What changed:** [Concise description of the change]
**Hypothesis:** [What improvement was expected and why]
**Provider:** anthropic | openai-compatible ([model name])

**Scores (10-question average per dimension):**

| Dimension | Previous | Current | Delta |
|---|---|---|---|
| Perspective Diversity | | | |
| Claim Type Accuracy | | | |
| Confidence Calibration | | | |
| Evidence Balance | | | |
| Tension Identification | | | |
| Steel-Manning | | | |
| **Overall Average** | | | |

**Questions that improved:** [List by ID]
**Questions that regressed:** [List by ID]
**Decision:** Kept | Reverted | Modified further
**Notes:** [What was learned]

---

## Iteration History

### Version 1.0 - [TBD]

**Prompt changed:** Decomposer (initial version)
**What changed:** Baseline. Prompt text as defined in PRISM_SPEC.md Section 4.1.
**Hypothesis:** N/A (baseline)

**Scores:** [Run initial evaluation and fill in]

---

*Add new entries above this line, newest first.*
