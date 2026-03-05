# ADR-009: Dual AI Backend -- Anthropic API + OpenAI-Compatible Local Models

**Status:** Accepted  
**Date:** 2026-03-05

## Context

Phase 1 is entirely prompt engineering, which means frequent iteration: change a prompt, run test questions, evaluate output, repeat. Each decomposition requires at minimum two AI calls (decompose + audit), and a full 10-question evaluation run costs 20+ API calls. Running this against Anthropic's API for every iteration is cost-prohibitive during active development.

The developer already runs LM Studio locally, which exposes an OpenAI-compatible API. Local models are lower quality but free and fast, making them suitable for structural testing (does the pipeline run, does the parser handle the output, does the JSON validate) even if the content quality is lower.

## Decision

The AI client layer supports two backends, selected by environment variable:

1. **Anthropic** (`AI_PROVIDER=anthropic`) -- Uses the Anthropic SDK. For evaluation runs, production, and quality assessment.
2. **OpenAI-compatible** (`AI_PROVIDER=openai-compatible`) -- Uses the OpenAI SDK pointed at a local URL (e.g., `http://localhost:1234/v1`). For rapid iteration, structural testing, and development.

The backend is selected at startup. All downstream code (orchestrator, decomposer, auditor, expander) is backend-agnostic. They call the same client interface regardless of which provider is active.

## Rationale

Prompt engineering has two distinct feedback loops:

1. **Structural loop (fast, frequent):** Does the prompt produce valid JSON? Do the Zod schemas accept it? Are the right fields populated? Does the orchestrator pipeline complete without errors? This can run against any model that produces roughly-structured output.

2. **Quality loop (slow, expensive):** Is the decomposition balanced? Are perspectives genuinely distinct? Is confidence well-calibrated? This requires a capable model (Claude Opus/Sonnet) and is what the evaluation rubric measures.

Forcing both loops through the Anthropic API means either burning money on structural iteration or iterating slowly. Splitting them lets the developer move fast on structure and reserve API budget for quality evaluation.

## Alternatives Considered

**Anthropic API only with aggressive caching.** Caching helps for repeated identical inputs but doesn't help when the prompt itself is changing (which is the whole point of Phase 1).

**Mock responses from saved JSON fixtures.** Good for unit tests (and we should do this too) but doesn't test the actual prompt-to-parse pipeline. A local model hitting the real prompts catches issues that fixtures miss, like the model ignoring a JSON instruction or adding unexpected commentary.

**Use only cheap models (Haiku) on Anthropic.** Cheaper but still costs money per call and still has network latency. LM Studio is free and local.

## Consequences

**Positive:**
- Development iteration is fast and free for structural work.
- API budget is reserved for meaningful quality evaluation.
- The abstraction layer forces clean separation between AI client logic and business logic, which is good architecture regardless.

**Negative:**
- Local model output quality will be lower. The developer must not confuse "pipeline works with local model" with "decomposition quality is good." Quality evaluation always runs against Anthropic.
- Prompt formatting may behave differently between providers. Edge cases in JSON compliance will vary. The parsers must be robust to minor formatting differences.
- Two code paths through the AI client increase surface area for bugs. Mitigated by a shared interface and integration tests against both backends.
