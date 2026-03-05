# Decomposition Quality Evaluation

## Purpose

This document defines the test questions, scoring rubric, and evaluation process used to assess whether Prism's AI decomposition pipeline produces useful, balanced, and honest claim graphs. Phase 1's definition of done is: **8 of 10 test questions score >= 4.0 average across all rubric dimensions.**

## Test Questions

Each question is chosen to stress a different aspect of the decomposition engine. Categories are intentionally diverse.

### Personal Decisions

**Q1: "Should I switch careers from engineering to teaching?"**
- Tests: value claims (fulfillment vs. financial security), predictive claims (career trajectory), perspective diversity (the individual, their family, their students, society)
- Why it's hard: The "right answer" depends entirely on values. The system must resist defaulting to one framing.

**Q2: "Should I pull my child out of public school and homeschool them?"**
- Tests: empirical claims (educational outcomes data), value claims (socialization, autonomy, civic duty), framing challenges (is this purely a family decision?)
- Why it's hard: Strong cultural priors on both sides. Easy for AI to over-represent mainstream positions.

### Public Policy

**Q3: "Should cities invest in light rail or bus rapid transit?"**
- Tests: empirical claims with real data (cost per mile, ridership projections), competing value dimensions (equity, cost, environmental impact, timeline), definitional claims (what counts as "success")
- Why it's hard: Requires genuine technical knowledge. Easy to produce surface-level takes.

**Q4: "Should the United States adopt universal basic income?"**
- Tests: predictive claims (economic effects), ideological spectrum (libertarian UBI case vs. progressive case vs. fiscal conservative opposition), international evidence handling
- Why it's hard: Extremely well-trodden. The system must avoid rehashing shallow talking points and find actual tension points.

### Technical Tradeoffs

**Q5: "Should our team rewrite our monolith as microservices?"**
- Tests: conditional claims (depends on team size, current pain points), practical experience-based evidence, framing challenge (is "rewrite" even the right framing vs. incremental strangling?)
- Why it's hard: The correct answer is almost always "it depends." The system must make the dependencies explicit rather than hedging.

**Q6: "Should a hospital adopt AI-assisted diagnostic tools?"**
- Tests: empirical claims (accuracy data), ethical claims (liability, patient autonomy, bias in training data), regulatory context, tension between efficiency and trust
- Why it's hard: Multiple high-stakes value dimensions that cannot be collapsed.

### Ethical Dilemmas

**Q7: "Is it ethical to use gene editing to prevent genetic diseases in embryos?"**
- Tests: value claims across philosophical traditions (utilitarian, deontological, disability rights), slippery slope arguments (system should label these as predictive claims, not empirical), definitional claims ("what counts as a disease?")
- Why it's hard: Deep disagreements that cannot be resolved empirically. The system must clearly separate what science can answer from what it cannot.

**Q8: "Should social media platforms be required to verify users' real identities?"**
- Tests: competing rights (safety vs. privacy vs. free expression), international comparison (different regulatory approaches), second-order effects (impact on whistleblowers, marginalized groups)
- Why it's hard: Each perspective has a compelling case. Easy to strawman the "less popular" position.

### Contested Empirical Questions

**Q9: "Is remote work better for productivity than in-office work?"**
- Tests: evidence quality awareness (most studies have significant methodological limitations), definitional claims ("productivity" for whom? measured how?), conditional claims (depends on role type, team structure, individual)
- Why it's hard: Abundant but low-quality evidence. The system must resist treating weak evidence as strong just because there's a lot of it.

### Personal-Systemic Intersection

**Q10: "Should I buy an electric vehicle?"**
- Tests: mixing personal factors (budget, driving patterns) with systemic claims (environmental impact, grid composition, manufacturing footprint), predictive claims (battery technology trajectory, resale value), value dimensions that span scales (personal cost vs. societal impact)
- Why it's hard: The individual decision and the systemic question are entangled. Good decomposition must show both layers and how they interact.

---

## Scoring Rubric

Each dimension is scored 1-5 per the criteria below. Scores are integers only (no 3.5).

### Dimension 1: Perspective Diversity

| Score | Criteria |
|---|---|
| 5 | 4+ genuinely distinct perspectives that span different value systems, not just different conclusions. At least one perspective challenges the dominant framing of the question. No perspective is a strawman. |
| 4 | 3-4 distinct perspectives with real differences. May miss one non-obvious perspective but covers the major angles. No strawmen. |
| 3 | 3 perspectives but they feel like variations on two poles (e.g., "strong yes," "strong no," "moderate yes"). Missing a framing-level challenge. |
| 2 | 2 perspectives that map to a simple binary. Or 3+ perspectives where one is clearly weaker than the others. |
| 1 | Single dominant perspective with token opposition, or perspectives that don't meaningfully differ. |

### Dimension 2: Claim Type Accuracy

| Score | Criteria |
|---|---|
| 5 | All claims are correctly typed. Value claims are never disguised as empirical. Definitional disputes are surfaced explicitly. Conditional claims state their conditions. |
| 4 | Nearly all claims correctly typed. One or two borderline cases that could reasonably go either way. |
| 3 | Mostly correct, but 2-3 value claims are presented as empirical, or conditional claims are missing their conditions. |
| 2 | Frequent mistyping. Value-laden framing presented as factual in multiple places. |
| 1 | No meaningful distinction between claim types. Everything reads as "here are some facts." |

### Dimension 3: Confidence Calibration

| Score | Criteria |
|---|---|
| 5 | Confidence scores are defensible and differentiated. Well-established empirical claims (e.g., "light rail costs more per mile than BRT") get high confidence. Contested claims get low confidence. Confidence rationale is specific and references evidence quality. |
| 4 | Generally well-calibrated. One or two scores feel slightly off but nothing egregious. Rationale is present and reasonable. |
| 3 | Calibration is okay for extreme cases (very certain / very uncertain) but the middle range is mushy. Many claims clustered around 0.5-0.7 without differentiation. |
| 2 | Confidence scores don't correlate well with actual evidence strength. Or all scores are in a narrow band (e.g., everything is 0.6-0.8). |
| 1 | Confidence scores appear arbitrary. No meaningful correlation with evidence quality. |

### Dimension 4: Evidence Balance

| Score | Criteria |
|---|---|
| 5 | For every claim with supporting evidence, opposing evidence is also present where it exists. Evidence strength ratings are accurate. "ABSENT" is used where appropriate rather than fabricating weak evidence. |
| 4 | Good balance overall. One or two claims where counter-evidence is missing but should exist. Evidence strength mostly accurate. |
| 3 | Supporting evidence is consistently present but opposing evidence is spotty. Or evidence strength ratings are generous (MODERATE where WEAK is more accurate). |
| 2 | One-sided evidence for most claims. Counter-evidence is missing or tokenistic. |
| 1 | Evidence reads like a brief for one side. Counter-evidence is absent or dismissed. |

### Dimension 5: Tension Identification

| Score | Criteria |
|---|---|
| 5 | Tension points identify the real crux of disagreements. Correctly distinguishes factual tensions from value tensions from framing tensions. Tensions map to specific claims and perspectives. A reader could look at the tensions alone and understand where the actual disagreements are. |
| 4 | Good tension identification. Most major disagreement points are captured. Typing is mostly correct. |
| 3 | Tensions are present but generic ("people disagree about costs"). Missing specificity about which claims or values are in tension. |
| 2 | Tensions are superficial or miss the actual crux points. Listed tensions don't correspond to the deepest disagreements in the graph. |
| 1 | No meaningful tensions identified, or tensions are just restating that the question is "controversial." |

### Dimension 6: Steel-Manning

| Score | Criteria |
|---|---|
| 5 | Every perspective is presented in its strongest form. An advocate of each perspective would recognize their best arguments. No perspective is subtly undermined through weaker phrasing, less evidence, or less confident framing. |
| 4 | Strong across the board. One perspective might be slightly less well-represented than others, but the difference is minor. |
| 3 | Most perspectives are well-represented, but one is noticeably weaker or presented more superficially than the others. |
| 2 | Clear asymmetry. One or two perspectives get strong treatment; others get surface-level representation or are framed in ways their advocates would reject. |
| 1 | The graph reads as though it has a "preferred" answer. Dissenting perspectives are present but not seriously engaged. |

---

## Evaluation Process

### Per-Question Evaluation

1. Run the full pipeline: decompose -> audit -> remediation (if triggered).
2. Save the complete output JSON.
3. Score each rubric dimension 1-5.
4. Record the raw AI output alongside scores (for debugging prompt iterations).
5. Write 2-3 sentences of qualitative notes per question highlighting specific strengths and weaknesses.

### Aggregate Scoring

- Compute per-question average (mean of 6 dimension scores).
- Compute per-dimension average across all questions (identifies systemic weaknesses).
- Phase 1 passes when **8 of 10 questions have per-question average >= 4.0**.
- Any single dimension averaging below 3.5 across all questions indicates a systemic prompt issue that must be addressed before Phase 1 is considered complete.

### Score Tracking

Maintain a log in `docs/PROMPT_LOG.md` linking each prompt version to its evaluation scores. This creates a traceable history of what changed and whether it helped.

**Provider requirement:** Scores that count toward Phase 1 pass/fail must come from the Anthropic provider (`AI_PROVIDER=anthropic`). Local model scores (LM Studio) are useful for structural testing but are not meaningful for quality evaluation and must be clearly marked as such in any log entry.

### Evaluation Template

```markdown
## Evaluation: [Question ID] - Prompt Version [X.Y]

**Question:** [Full question text]
**Date:** YYYY-MM-DD
**Provider:** anthropic | openai-compatible (model name)
**Pipeline:** decompose (model) -> audit (model) -> [remediation? Y/N]

| Dimension | Score | Notes |
|---|---|---|
| Perspective Diversity | /5 | |
| Claim Type Accuracy | /5 | |
| Confidence Calibration | /5 | |
| Evidence Balance | /5 | |
| Tension Identification | /5 | |
| Steel-Manning | /5 | |
| **Average** | **/5** | |

**Qualitative Notes:**
[2-3 sentences on specific strengths and weaknesses]

**Raw Output:** [Link to JSON file]
```

---

## Bias Audit Evaluation

The bias audit pass itself needs evaluation. After Phase 1 stabilizes, run the following secondary assessment:

1. Take 5 decompositions that scored well on the rubric.
2. Manually introduce a bias (remove a perspective, weaken evidence for one side, mislabel a value claim as empirical).
3. Run the audit pass on the degraded graph.
4. Score whether the audit detected the introduced bias.

This tests whether the audit is a real safety net or just a rubber stamp. Target: audit catches introduced biases in 4 of 5 cases.