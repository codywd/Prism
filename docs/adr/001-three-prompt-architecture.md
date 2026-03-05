# ADR-001: Three-Prompt AI Architecture

**Status:** Accepted  
**Date:** 2026-03-05

## Context

Prism's core value proposition depends on producing balanced, high-quality claim graph decompositions from natural language questions. The system needs to decompose questions, check its own work for bias, and allow users to drill deeper into individual claims. The question is whether these responsibilities should live in a single prompt, two prompts, or three.

## Decision

Use three distinct prompt roles, each with its own system prompt and (potentially) its own model selection:

1. **Decomposer** (Claude Opus) -- Takes a question, produces the initial claim graph.
2. **Auditor** (Claude Sonnet) -- Reviews the decomposer's output for bias, missing perspectives, miscalibrated confidence, and mislabeled claim types.
3. **Expander** (Claude Sonnet) -- Takes a single claim plus its graph context, produces sub-claims, new evidence, and new edges.

These prompts are never merged. They operate as independent steps in a pipeline.

## Rationale

A single "do it all right the first time" prompt consistently produces worse results than a two-pass approach where a second model critiques the first model's output. This mirrors a well-established pattern in AI system design: generator-critic architectures outperform single-pass generation for tasks requiring balance and self-awareness.

The decomposer has the hardest job (open-ended structured generation), so it gets the most capable model (Opus). The auditor and expander are more constrained tasks operating on existing structured data, so Sonnet's speed/cost tradeoff is acceptable.

Separating the expander from the decomposer means expansion calls are scoped and fast, which matters for interactive UX (user clicks a node, expects sub-claims in under 3 seconds).

## Alternatives Considered

**Single prompt with self-critique instructions.** Tested informally. The model tends to soften its own critique when generating and auditing in a single pass. The auditor needs to see the decomposer's output as a finished artifact to critique effectively.

**Two prompts (decompose + audit, with expansion folded into decomposition).** Would require the initial decomposition to go arbitrarily deep, which makes the first response slow and produces a lot of content the user may never explore. Lazy expansion on demand is both cheaper and more responsive.

**Fine-tuned model.** Premature. Prompt engineering should be exhausted first. Fine-tuning is a Phase 2+ consideration if prompt iteration plateaus.

## Consequences

**Positive:**
- Clear separation of concerns makes each prompt easier to iterate and evaluate independently.
- The audit pass is the primary integrity mechanism. Its independence from the decomposer is what makes it trustworthy.
- Expansion is fast and cheap because it's scoped to a single claim.

**Negative:**
- Each question costs at minimum two API calls (decompose + audit), plus one per expansion. Cost per question is non-trivial.
- Latency for initial decomposition is the sum of decompose + audit + any remediation calls. Target is under 8 seconds total, which is tight.
- Three prompt templates to maintain and iterate instead of one.
