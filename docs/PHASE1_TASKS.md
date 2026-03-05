# Phase 1: The Engine - Task Breakdown

## Overview

Phase 1 validates that AI-driven decomposition produces useful, balanced claim graphs. There is no UI, no database, no auth. The deliverable is a working decomposition pipeline with validated prompts and a quality evaluation harness.

**Definition of Done:** 8 of 10 test questions score >= 4.0 average across all rubric dimensions (evaluated against Anthropic, not local models). See `docs/EVAL_RUBRIC.md`.

## Task Order

Work through these in sequence. Each task builds on the previous one.

---

### Task 1: Shared Types and Zod Schemas

**Location:** `packages/shared/`

Define the canonical TypeScript types from PRISM_SPEC.md Section 2, and corresponding Zod schemas for runtime validation.

Files to create:
- `src/types/ClaimNode.ts` -- ClaimNode interface, ClaimType enum
- `src/types/EvidenceNode.ts` -- EvidenceNode interface, EvidenceStrength and EvidenceDirection enums
- `src/types/TensionNode.ts` -- TensionNode interface, TensionType enum
- `src/types/QuestionNode.ts` -- QuestionNode interface
- `src/types/Perspective.ts` -- Perspective interface
- `src/types/ValueDimension.ts` -- ValueDimension interface
- `src/types/Edge.ts` -- DependencyEdge, PerspectiveWeight interfaces, RelationshipType enum
- `src/types/Graph.ts` -- ClaimGraph aggregate type (the full decomposition response)
- `src/constants/enums.ts` -- All enum values as const objects
- `src/schemas/` -- Zod schemas matching each type, plus a DecompositionResponseSchema that validates the full AI output structure
- Barrel exports in `src/index.ts` and `src/types/index.ts`

Set up `package.json` with `typescript`, `zod`, and a build script that compiles to `dist/`.

**Done when:** `pnpm build` in `packages/shared/` compiles cleanly. Zod schemas can parse a hand-written sample JSON matching the spec's Appendix A example.

**Plugins:** Use `context7` to fetch current Zod docs before writing schemas. Run `pr-review-toolkit: type-design-analyzer` after completion to verify type design quality. Run `code-review` before moving to Task 4.

---

### Task 2: AI Client Abstraction

**Location:** `packages/server/src/services/ai/`

Build the dual-backend AI client per CLAUDE.md's "Dual AI Backend" section.

Files to create:
- `client.ts` -- `AIClient` interface + `createAIClient()` factory that reads `AI_PROVIDER` from env
- `anthropicClient.ts` -- Implements AIClient using `@anthropic-ai/sdk`
- `openaiClient.ts` -- Implements AIClient using `openai` npm package, pointed at `OPENAI_COMPATIBLE_BASE_URL`

Both implementations must:
- Accept system prompt, user prompt, temperature, and optional max tokens
- Return raw string response
- Implement retry logic (1 retry with 1s backoff)
- Log the provider name, model, and response length on every call
- Log the full raw response on failure

Set up `packages/server/package.json` with dependencies: `@anthropic-ai/sdk`, `openai`, `dotenv`, `zod`, `typescript`, and a dev script.

**Done when:** A simple test script can call both backends (LM Studio running locally for openai-compatible, Anthropic key for anthropic) with a "respond with JSON: {\"test\": true}" prompt and get parseable responses from both.

**Plugins:** Use `context7` to fetch current docs for `@anthropic-ai/sdk` and `openai` packages. Run `code-simplifier` after completion to keep the abstraction lean. Run `code-review` before moving to Task 5.

---

### Task 3: Prompt Files

**Location:** `packages/server/src/prompts/` and `prompts/` (root, for standalone testing)

Create the three prompt templates from PRISM_SPEC.md Section 4:
- `decompose.md` -- Decomposition system prompt (Section 4.1)
- `audit.md` -- Bias audit system prompt (Section 4.2)
- `expand.md` -- Expansion system prompt (Section 4.3)

Each prompt file should use `{{variable}}` syntax for interpolation points (e.g., `{{question_text}}`, `{{claim_text}}`, `{{existing_evidence}}`).

Also create a `promptLoader.ts` utility that:
- Reads a `.md` prompt file from disk
- Replaces `{{variable}}` placeholders with provided values
- Returns the final prompt string

Copy the prompt files to both locations (server prompts for the app, root prompts for standalone testing).

**Done when:** `promptLoader.ts` can load each prompt and interpolate variables. The prompts match the spec's Section 4 exactly (modulo interpolation syntax).

**Plugins:** No specific plugins needed. Run `code-review` before moving to Task 5.

---

### Task 4: Response Parsers

**Location:** `packages/server/src/parsers/`

Build the defensive parsing layer per CLAUDE.md's "AI Response Handling" section.

Files to create:
- `decompositionParser.ts` -- Parses decomposition responses into validated ClaimGraph
- `auditParser.ts` -- Parses audit responses into validated AuditResult
- `expansionParser.ts` -- Parses expansion responses into validated ExpansionResult
- `common.ts` -- Shared utilities: strip markdown fencing, extract JSON substring, replace placeholder IDs with UUIDs

Each parser must:
1. Strip markdown fencing (` ```json `, ` ``` `)
2. Attempt `JSON.parse()` on the stripped string
3. If that fails, find the first `{` and last `}` and try parsing that substring
4. Run the result through the corresponding Zod schema (`.safeParse()`)
5. If validation fails, log the raw response + Zod error details and throw a structured error
6. If validation passes, replace placeholder IDs (e.g., `claim_001`) with real UUIDs
7. Return the typed result

**Done when:** Unit tests pass for each parser, covering: clean JSON input, JSON with markdown fencing, JSON with preamble text, missing optional fields, completely invalid responses. Use saved fixture files for test inputs.

**Plugins:** Use `superpowers: test-driven-development` -- write parser tests first from fixtures, then implement parsers to pass them. Run `pr-review-toolkit: silent-failure-hunter` after completion to verify no error paths are swallowed. Run `code-review` before moving to Task 5.

---

### Task 5: Decomposer, Auditor, Expander Services

**Location:** `packages/server/src/services/ai/`

Build the three AI service functions that compose the client + prompts + parsers.

Files to create:
- `decomposer.ts` -- `decompose(question: string): Promise<ClaimGraph>`
  - Loads decompose prompt, interpolates question
  - Calls AI client
  - Parses response with decompositionParser
  - Returns validated ClaimGraph

- `auditor.ts` -- `audit(graph: ClaimGraph): Promise<AuditResult>`
  - Loads audit prompt, interpolates serialized graph
  - Calls AI client
  - Parses response with auditParser
  - Returns validated AuditResult

- `expander.ts` -- `expand(claim: ClaimNode, context: ClaimContext): Promise<ExpansionResult>`
  - Loads expand prompt, interpolates claim + context
  - Calls AI client
  - Parses response with expansionParser
  - Returns validated ExpansionResult

**Done when:** Each service can be called independently. `decompose("Should I switch careers?")` returns a valid ClaimGraph (test against LM Studio for structure, note that content quality is not evaluated here).

**Plugins:** Use `superpowers: verification-before-completion` to verify each service meets its interface contract. Run `code-review` before moving to Task 6.

---

### Task 6: Orchestrator

**Location:** `packages/server/src/services/ai/orchestrator.ts`

Wire the three services into the full pipeline: decompose -> audit -> remediate.

```
orchestrate(question: string): Promise<{graph: ClaimGraph, audit: AuditResult}>
```

Pipeline:
1. Call `decompose(question)` to get initial graph
2. Call `audit(graph)` to get audit results
3. If audit identifies high-severity gaps (missing perspectives, unbalanced evidence), trigger targeted follow-up:
   - For missing perspectives: call decomposer with a narrowed prompt asking specifically for the missing perspective
   - For missing evidence: call expander on the under-evidenced claims
4. Merge remediation results into the graph
5. Return final graph + audit results

Also implement:
- Timing: log how long each step takes
- Error handling: if decomposition fails, throw. If audit fails, return the unaudited graph with a warning flag.
- Provider logging: log which AI provider and model were used

**Done when:** Full pipeline runs end-to-end. `orchestrate("Should cities invest in light rail?")` produces a complete graph with audit results. Test against LM Studio for structural validation.

**Plugins:** Use `superpowers: write-plan` if the orchestrator logic feels too complex to implement in one pass. Run `pr-review-toolkit: silent-failure-hunter` to verify error handling paths. Run `code-simplifier` to keep the module lean. Run `code-review` before moving to Task 7.

---

### Task 7: CLI Runner

**Location:** `packages/server/src/cli.ts` (or `scripts/eval/src/`)

Build a simple CLI that takes a question and runs the full pipeline.

```bash
# Run a single question
pnpm run:question "Should I switch careers from engineering to teaching?"

# Output: pretty-printed JSON of the graph + audit results, saved to scripts/eval/output/
```

This is the primary interface for Phase 1 iteration. No web server needed yet.

**Done when:** The CLI runs, calls the pipeline, and saves output JSON files. Works with both AI providers.

**Plugins:** Use `superpowers: verification-before-completion` to confirm both providers work end-to-end.

---

### Task 8: Evaluation Harness

**Location:** `scripts/eval/`

Build the automated evaluation runner per `docs/EVAL_RUBRIC.md`.

Files to create:
- `src/questions.ts` -- The 10 test questions from the rubric, exported as an array
- `src/evaluate.ts` -- Main runner: iterates questions, calls orchestrator, saves output
- `src/rubric.ts` -- (Phase 1 manual scoring) Generates a blank rubric template for each question's output

The harness should:
1. Run all 10 questions through the orchestrator
2. Save each output as `output/q{N}_{timestamp}.json`
3. Generate a blank scoring template at `output/scores_{timestamp}.md` pre-filled with question text and empty rubric tables
4. Log total time, cost estimate (based on token counts if available), and provider used
5. Support `--provider anthropic` flag to override the env default for evaluation runs
6. Support `--question N` flag to run a single question

**Done when:** `pnpm eval` runs all 10 questions, saves outputs, and generates the scoring template. Manual scoring begins here.

**Plugins:** Use `superpowers: verification-before-completion` for final validation that the full pipeline works. Run `code-review` on the complete `packages/server` and `scripts/eval` packages as a final quality gate for Phase 1 code.

---

### Task 9: Prompt Iteration

**Not a code task.** This is the actual Phase 1 work.

1. Run the evaluation harness against Anthropic (`AI_PROVIDER=anthropic pnpm eval`)
2. Score each question manually using the rubric
3. Record scores in `docs/PROMPT_LOG.md`
4. Identify weakest dimensions
5. Modify prompts to address weaknesses
6. Re-run evaluation
7. Repeat until 8 of 10 questions average >= 4.0

Use LM Studio for rapid structural iteration between Anthropic evaluation runs.

---

## Dependency Graph

```
Task 1 (Shared Types)
  └── Task 4 (Parsers) ──────────┐
                                  │
Task 2 (AI Client)                ├── Task 5 (Services) ── Task 6 (Orchestrator) ── Task 7 (CLI) ── Task 8 (Eval Harness)
                                  │
Task 3 (Prompts) ────────────────┘
```

Tasks 1, 2, and 3 can be done in parallel. Use `superpowers: dispatching-parallel-agents` or `superpowers: subagent-driven-development` to run them simultaneously. Task 4 depends on 1. Task 5 depends on 2, 3, and 4. Everything after that is sequential.