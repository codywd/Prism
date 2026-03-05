# ADR-005: Bias Audit as a Mandatory Second Pass

**Status:** Accepted  
**Date:** 2026-03-05

## Context

AI-generated decompositions will have blind spots. The question is whether to address this through a single more-careful prompt, a mandatory second pass, or optional user-triggered auditing.

## Decision

Every decomposition runs a mandatory bias audit pass before the graph is shown to the user. The audit is never skipped, even in development or testing. If the audit identifies gaps with high severity, targeted enrichment calls are triggered automatically before the graph is returned.

## Rationale

A tool that claims to help people think better but quietly reinforces the AI's biases would be worse than useless. It would be actively harmful, because users would trust its "balanced" framing. The audit pass is the integrity mechanism that earns that trust. Making it optional (user-triggered or dev-skippable) means it will be skipped, and the system's balance guarantees disappear.

The audit uses a different model invocation than the decomposer. This separation is intentional: a model critiquing its own output in the same context window tends to be less rigorous than a fresh context evaluating a finished artifact.

## Alternatives Considered

**Single-pass with stronger balance instructions.** Testing showed that even heavily prompted single-pass decompositions miss perspectives and over-represent mainstream framings. A second pair of eyes (even AI eyes) catches real gaps.

**User-triggered audit.** Shifts the responsibility to the user, who doesn't know what's missing. Defeats the purpose.

**Periodic batch audits instead of per-question.** Cost-saving but means users see unaudited graphs. Unacceptable for a tool whose value proposition is balance.

## Consequences

**Positive:**
- Every graph the user sees has been reviewed for balance.
- Audit results (e.g., "this perspective was added by the bias audit") are visible in the UI, building transparency and trust.

**Negative:**
- Adds one API call (and 1-3 seconds of latency) to every decomposition.
- Increases per-question cost by roughly 30-40%.
- Audit quality is only as good as the audit prompt. The audit itself could have blind spots. This is mitigated but not eliminated by continuous evaluation.
