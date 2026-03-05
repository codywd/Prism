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