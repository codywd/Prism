# CLAUDE.md - Prism

## What is Prism?

Prism is a collaborative sense-making platform that decomposes complex questions into interactive claim graphs. Users explore questions by examining claims, evidence, perspectives, and tensions -- then manipulate value sliders to feel tradeoffs in real time. The goal is to help people think better, not to give them answers.

Read `PRISM_SPEC.md` for the full specification. That document is authoritative. If this file and the spec conflict, the spec wins.

**Currently building Phase 1.** Start with `docs/PHASE1_TASKS.md` for the ordered task checklist and dependency graph.

## Project Structure

```
prism/
├── CLAUDE.md                    # You are here
├── PRISM_SPEC.md                # Authoritative specification
├── README.md                    # Project overview and quick start
├── tsconfig.base.json           # Base TypeScript config (all packages extend this)
├── packages/
│   ├── client/                  # React + TypeScript frontend (Vite)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── graph/       # D3 graph rendering, node/edge components
│   │   │   │   ├── sidebar/     # Perspectives, sliders, tensions list
│   │   │   │   ├── detail/      # Claim detail panel
│   │   │   │   └── shared/      # Buttons, inputs, layout primitives
│   │   │   ├── hooks/           # Custom React hooks
│   │   │   ├── stores/          # Zustand stores for graph state
│   │   │   ├── api/             # API client functions
│   │   │   ├── types/           # TypeScript types (mirroring spec data model)
│   │   │   ├── utils/           # Reweighting math, graph layout helpers
│   │   │   └── pages/           # Route-level page components
│   │   └── public/
│   ├── server/                  # Node.js API server (Fastify)
│   │   ├── src/
│   │   │   ├── routes/          # Route handlers organized by resource
│   │   │   ├── services/        # Business logic layer
│   │   │   │   ├── ai/          # AI orchestration
│   │   │   │   │   ├── client.ts          # AIClient interface + factory
│   │   │   │   │   ├── anthropicClient.ts # Anthropic SDK implementation
│   │   │   │   │   ├── openaiClient.ts    # OpenAI-compatible implementation (LM Studio)
│   │   │   │   │   ├── orchestrator.ts    # decompose -> audit -> remediate pipeline
│   │   │   │   │   ├── decomposer.ts
│   │   │   │   │   ├── auditor.ts
│   │   │   │   │   └── expander.ts
│   │   │   │   ├── graph/       # Graph CRUD, traversal, export
│   │   │   │   └── collaboration/ # WebSocket session management
│   │   │   ├── db/              # Database clients and queries
│   │   │   │   ├── neo4j/       # Cypher queries, graph persistence
│   │   │   │   └── postgres/    # User accounts, metadata, audit logs
│   │   │   ├── prompts/         # AI prompt templates (decomposition, audit, expansion)
│   │   │   ├── parsers/         # Parse and validate AI JSON responses
│   │   │   ├── types/           # Shared TypeScript types
│   │   │   └── middleware/      # Auth, rate limiting, error handling
│   │   └── tests/
│   └── shared/                  # Types and utilities shared between client and server
│       └── src/
│           ├── types/           # Canonical type definitions (ClaimNode, Edge, etc.)
│           └── constants/       # Enums, shared config values
├── prompts/                     # Standalone prompt files for testing outside the app
│   ├── decompose.md
│   ├── audit.md
│   └── expand.md
├── scripts/                     # Dev tooling, seed data, evaluation scripts
│   └── eval/                    # Decomposition quality evaluation harness
├── docs/
│   ├── PHASE1_TASKS.md          # Ordered task checklist for Phase 1
│   ├── EVAL_RUBRIC.md           # Test questions + scoring rubric
│   ├── PROMPT_LOG.md            # Prompt iteration history with scores
│   └── adr/                     # Architecture Decision Records (ADR-001 through ADR-009)
├── docker-compose.yml           # Neo4j + PostgreSQL + Redis for local dev
└── .env.example
```

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | React 18+ with TypeScript, Vite | SPA required for graph interactivity |
| Styling | Tailwind CSS | Utility-first. No component library except where noted. |
| State management | Zustand | Lightweight, works well with D3 integration |
| Graph rendering | D3.js (force simulation) | Canvas renderer for performance. SVG only for small graphs (<50 nodes). |
| Routing | React Router v6 | Standard file-based-ish routing |
| API server | Fastify (TypeScript) | Preferred over Express for schema validation and performance |
| Graph database | Neo4j Community Edition | Cypher for all graph queries |
| Relational database | PostgreSQL 16 | Users, sessions, audit logs, non-graph data |
| Cache | Redis | Session state, rate limiting, hot graph caching |
| AI | Anthropic Claude API + OpenAI-compatible (LM Studio) | Dual backend. LM Studio for dev iteration, Anthropic for evaluation and production. See ADR-009. |
| Auth | Clerk | Managed auth. Not the interesting problem. |
| Package manager | pnpm | Monorepo with pnpm workspaces |
| Testing | Vitest (unit), Playwright (e2e) | Vitest for both client and server |

## Development Commands

```bash
# Setup
pnpm install
docker compose up -d            # Neo4j, PostgreSQL, Redis
cp .env.example .env            # Fill in ANTHROPIC_API_KEY, database URLs, Clerk keys

# Development
pnpm dev                        # Starts both client (Vite) and server (Fastify) concurrently
pnpm dev:client                 # Client only (port 5173)
pnpm dev:server                 # Server only (port 3000)

# Testing
pnpm test                       # All tests
pnpm test:client                # Client unit tests
pnpm test:server                # Server unit tests
pnpm test:e2e                   # Playwright end-to-end
pnpm eval                       # Run decomposition quality evaluation harness

# Build
pnpm build                      # Production build for both packages
pnpm typecheck                  # TypeScript type checking across all packages

# Database
pnpm db:migrate                 # Run PostgreSQL migrations
pnpm db:seed                    # Seed with example questions and graphs
pnpm db:reset                   # Drop and recreate all databases
```

## Architecture Rules

### The claim graph is the product.
Every feature decision should be evaluated against: "Does this make the claim graph more useful, more honest, or more explorable?" If the answer is no, question whether the feature belongs.

### Three-prompt architecture for AI calls.
AI orchestration uses three distinct prompt roles. They are separate by design. Do not merge them.
1. **Decomposer** (Opus) -- Takes a question, produces the initial claim graph as structured JSON.
2. **Auditor** (Sonnet) -- Reviews a decomposer's output for bias, missing perspectives, miscalibrated confidence. This is the integrity mechanism.
3. **Expander** (Sonnet) -- Takes a single claim + its context, produces sub-claims and evidence.

Prompt templates live in `packages/server/src/prompts/` as `.md` files with interpolation markers. The exact prompt text is defined in `PRISM_SPEC.md` Section 4.

### Prompts are server-side only.
The client never constructs, sees, or influences raw AI prompts. All AI calls flow through the server's AI orchestration service. User-provided text (questions, custom claims) is sanitized before inclusion in prompts.

### Reweighting is client-side.
When a user adjusts a value slider or toggles a perspective, the reweighting computation happens entirely in the browser. No API call. The math is:

```
relevance(claim) = SUM(perspective_weight[claim] * slider_value[dimension])
normalized to [0.0, 1.0]
```

This must run in under 16ms for 200 nodes to maintain 60fps during slider dragging. Profile this.

### Types are defined once in `shared/`.
The canonical TypeScript types for ClaimNode, EvidenceNode, TensionNode, Perspective, ValueDimension, and all edges live in `packages/shared/src/types/`. Both client and server import from there. Do not duplicate type definitions.

### Graph database for graph data, relational for everything else.
Neo4j stores the claim graph (nodes, edges, perspectives, tensions). PostgreSQL stores user accounts, session metadata, audit logs, rate limiting state, and shared link tokens. If you are unsure where something goes: if it has relationships that you'd traverse, it goes in Neo4j. If it's a flat record you'd query by ID or filter by column, it goes in PostgreSQL.

## Coding Conventions

### TypeScript
- Strict mode enabled. No `any` types except in AI response parsing boundaries (where you immediately validate and cast).
- Prefer `interface` over `type` for object shapes.
- Use discriminated unions for node types and edge types (matching the spec's enums).
- Exhaustive switch statements for enums. The compiler should catch missing cases.

### File naming
- Components: `PascalCase.tsx` (e.g., `ClaimNode.tsx`, `PerspectiveSidebar.tsx`)
- Hooks: `camelCase.ts` prefixed with `use` (e.g., `useGraphLayout.ts`)
- Utilities: `camelCase.ts` (e.g., `reweight.ts`, `graphTraversal.ts`)
- Types: `PascalCase.ts` (e.g., `ClaimNode.ts`, `GraphTypes.ts`)
- Routes (server): `camelCase.ts` grouped by resource (e.g., `questions.ts`, `claims.ts`)
- Prompts: `kebab-case.md` (e.g., `decompose.md`, `bias-audit.md`)

### React
- Functional components only. No class components.
- Zustand for global state (graph data, active perspectives, slider values).
- Local component state (`useState`) for UI-only concerns (panel open/closed, hover state).
- D3 integration: D3 owns the Canvas/SVG rendering. React owns the surrounding UI (sidebar, detail panel, controls). Do not fight D3 with React's virtual DOM. Use refs to give D3 a container, then let D3 manage its own DOM within that container.

### D3 / Graph Rendering
- Force simulation runs in a Web Worker if node count exceeds 100. Main thread must stay free for UI.
- Node shapes are drawn programmatically on Canvas (not as individual DOM elements).
- Hit detection for clicks/hovers uses a hidden canvas with unique colors per node (color picking).
- Animation frames use `requestAnimationFrame`, not `setInterval`.
- Respect the visual encoding table in PRISM_SPEC.md Section 5.2.1 exactly. Node shapes, edge styles, and opacity rules are specified there.

### Server
- Fastify with JSON Schema validation on all route inputs.
- Services layer between routes and database. Routes do not query databases directly.
- AI orchestration is its own service with clear interfaces: `decompose(question: string): Promise<ClaimGraph>`, `audit(graph: ClaimGraph): Promise<AuditResult>`, `expand(claim: ClaimNode, context: ClaimContext): Promise<ExpansionResult>`.
- All AI responses are parsed and validated immediately after receipt. If parsing fails, log the raw response and return a structured error. Do not pass malformed AI output downstream.

### Error Handling
- API errors use a consistent envelope: `{ error: { code: string, message: string, details?: any } }`.
- AI call failures are retried once with exponential backoff (1s, then 2s). After two failures, return a user-friendly error indicating the decomposition could not be completed.
- Graph rendering errors are caught at the component boundary. Show a fallback message, never a blank canvas.

### Testing
- Unit tests for: reweighting math, graph traversal utilities, AI response parsers, Cypher query builders.
- Integration tests for: full decomposition pipeline (question in, graph out), API route handlers with mocked databases.
- E2E tests for: question submission flow, node expansion, perspective toggling, slider interaction.
- Decomposition quality evaluation (see below) is a separate concern from unit/integration tests.

## Dual AI Backend: Anthropic + LM Studio

The AI client supports two backends, selected by `AI_PROVIDER` in `.env`. See ADR-009 for full rationale.

**Mixed-provider mode:** `AI_DECOMPOSE_PROVIDER` and `AI_AUDIT_PROVIDER` override `AI_PROVIDER` per role. `AI_AUDIT_PROVIDER` applies to both audit and expand. This enables running decomposition against Anthropic Opus and audit/expand against a cheaper OpenAI-compatible endpoint (e.g. Alter Sonnet).

### Architecture

```
services/ai/
├── client.ts          # AIClient interface + factory function
├── anthropicClient.ts # Anthropic SDK implementation
├── openaiClient.ts    # OpenAI SDK implementation (LM Studio, Ollama, etc.)
├── decomposer.ts      # Uses AIClient, doesn't know which backend
├── auditor.ts         # Uses AIClient, doesn't know which backend
├── expander.ts        # Uses AIClient, doesn't know which backend
└── orchestrator.ts    # Wires everything together
```

### The AIClient Interface

```typescript
interface AIClient {
  complete(params: {
    systemPrompt: string;
    userPrompt: string;
    temperature: number;
    maxTokens?: number;
  }): Promise<string>;  // Returns raw text response
}
```

Both `anthropicClient.ts` and `openaiClient.ts` implement this interface. The factory in `client.ts` calls `resolveProvider(role)` which checks `AI_DECOMPOSE_PROVIDER` / `AI_AUDIT_PROVIDER` before falling back to `AI_PROVIDER`, then instantiates the correct client. All downstream services depend on the interface, never on a concrete client.

### Provider Differences to Handle

| Concern | Anthropic | LM Studio / OpenAI-compatible |
|---|---|---|
| SDK | `@anthropic-ai/sdk` | `openai` (npm package) |
| Model selection | Per-role (Opus for decompose, Sonnet for expand/audit) | Per-role via `OPENAI_COMPATIBLE_DECOMPOSE/AUDIT/EXPAND_MODEL`; all fall back to `OPENAI_COMPATIBLE_MODEL` |
| JSON compliance | Generally strong with explicit instructions | Varies by model. Expect more markdown fencing, occasional preamble, and field omissions. |
| Structured output | Reliable with clear schema instructions | Less reliable. The parser layer must be more forgiving. |
| Max tokens | Model-dependent, handled by SDK | Must be set explicitly. Default to 4096 for local. |

### Development Workflow

**Day-to-day iteration (LM Studio):**
```bash
# .env has AI_PROVIDER=openai-compatible
# LM Studio is running with a model loaded
pnpm dev:server
# Fast, free, good for structural testing
```

**Evaluation runs (Anthropic):**
```bash
# Switch provider for quality assessment
AI_PROVIDER=anthropic pnpm eval
# Or set it in .env temporarily
```

The `pnpm eval` command should log which provider it's using at startup so there's no ambiguity about whether scores came from a local model or Anthropic.

### Rules

1. **Never merge the two clients into one.** The SDKs have different APIs. Wrapping them in a shared interface is the correct abstraction. Do not try to use the OpenAI SDK to call Anthropic or vice versa.
2. **Parsers must handle both backends.** Local models produce messier output. The Zod validation + fencing stripping must handle: markdown fencing, preamble text before JSON, trailing text after JSON, missing optional fields, and slightly malformed enums. Use `.safeParse()` everywhere, and when it fails, attempt a best-effort extraction (find the first `{` and last `}` in the response, try parsing that substring) before giving up.
3. **Evaluation scores from local models are not meaningful.** They test structure, not quality. The PROMPT_LOG.md must always record which provider produced the scores. Only Anthropic scores count toward Phase 1's pass/fail criteria.
4. **Log the raw response on parse failure regardless of provider.** This is how you debug prompt issues. Include the provider name, model identifier, and full response text in the log.

### LM Studio Tips for Prism

- Load the largest model your hardware can run. Structured JSON output quality scales with model size.
- 7B models will produce parseable JSON maybe 60-70% of the time. 13B+ is significantly better. 70B+ approaches Sonnet-level structural compliance.
- Set temperature to 0.2-0.3 in LM Studio's server settings (or let Prism's config override it).
- If a model consistently fails to produce valid JSON, try adding "You must respond with ONLY valid JSON. No other text." as both the first and last line of the system prompt. Some local models respond better to repeated emphasis.

## AI Response Handling

AI responses are the most fragile part of the system. Defensive coding here is non-negotiable.

1. **Request structured JSON only.** Every prompt ends with explicit instructions for JSON-only output, no markdown fencing, no preamble.
2. **Strip fencing anyway.** Before parsing, strip any `` ```json `` or `` ``` `` wrappers. Models sometimes add them despite instructions.
3. **Validate against schema.** Use Zod schemas that mirror the spec's data model. Parse with `schema.safeParse()`. If validation fails, log the raw response + validation errors.
4. **Sanitize user input before prompt inclusion.** Any user-provided text (question, custom claim) that goes into a prompt must be escaped. Prevent prompt injection by wrapping user content in clear delimiters within the prompt template and instructing the model to treat it as data.
5. **ID generation happens server-side.** AI responses use placeholder IDs (e.g., `claim_001`). The server replaces these with real UUIDs before persisting. The AI never generates real IDs.

## Decomposition Quality Evaluation

Phase 1's success depends on decomposition quality. The evaluation harness (`scripts/eval/`) works as follows:

1. Define 10+ test questions spanning categories: personal decisions, public policy, technical tradeoffs, ethical dilemmas.
2. For each question, run the full decomposition pipeline (decompose + audit + remediation).
3. Score each output on a rubric:
   - **Perspective diversity** (1-5): Are there 3+ genuinely distinct perspectives? Do they span different value systems, not just different conclusions?
   - **Claim type accuracy** (1-5): Are empirical, value, and definitional claims correctly labeled?
   - **Confidence calibration** (1-5): Are confidence scores defensible? High confidence on well-established claims, low on contested ones?
   - **Evidence balance** (1-5): For each claim, is there both supporting and opposing evidence where it exists?
   - **Tension identification** (1-5): Does the system find the real crux points where perspectives diverge?
   - **Steel-manning** (1-5): Is each perspective's strongest case presented, or are some perspectives given weaker representations?
4. Output a summary report. Track scores over time as prompts are iterated.

Definition of done for Phase 1: 8 of 10 test questions score >= 4.0 average across all rubric dimensions.

## Phased Build

Development follows four phases defined in PRISM_SPEC.md Section 7. Each phase has a clear scope and definition of done. Do not scope-creep across phases.

**Phase 1 - The Engine:** CLI/minimal web form. Decomposition + audit + expansion pipelines. No graph UI. Quality evaluation harness. No database (JSON files). The only goal is getting AI output quality right. **See `docs/PHASE1_TASKS.md` for the ordered task checklist and dependency graph.**

**Phase 2 - The Map:** React app with D3 graph visualization. Click-to-expand. Detail panel. Neo4j + PostgreSQL integration. Clerk auth. The goal is a working end-to-end flow.

**Phase 3 - Perspectives and Reweighting:** Sidebar with perspective toggles and value sliders. Client-side reweighting with animated transitions. Tension detection and display. Outline view for accessibility. Summary page. This is where Prism becomes Prism.

**Phase 4 - Share and Collaborate:** Shareable links. Collaborative mode with WebSockets. "Where do we diverge?" feature. Export options. Onboarding. Performance optimization for large graphs.

## Environment Variables

```
# AI Provider ("anthropic" or "openai-compatible")
AI_PROVIDER=openai-compatible    # Default to local for dev. Use "anthropic" for eval runs.
AI_DECOMPOSE_PROVIDER=           # Optional — overrides AI_PROVIDER for decompose role
AI_AUDIT_PROVIDER=               # Optional — overrides AI_PROVIDER for audit + expand roles

# Anthropic (when AI_PROVIDER=anthropic)
ANTHROPIC_API_KEY=               # Claude API key

# OpenAI-compatible / LM Studio (when AI_PROVIDER=openai-compatible)
OPENAI_COMPATIBLE_BASE_URL=http://localhost:1234/v1
OPENAI_COMPATIBLE_API_KEY=lm-studio
OPENAI_COMPATIBLE_MODEL=         # Fallback model used for all roles unless overridden below
OPENAI_COMPATIBLE_DECOMPOSE_MODEL= # Optional — overrides OPENAI_COMPATIBLE_MODEL for decompose role
OPENAI_COMPATIBLE_AUDIT_MODEL=   # Optional — overrides OPENAI_COMPATIBLE_MODEL for audit role
OPENAI_COMPATIBLE_EXPAND_MODEL=  # Optional — overrides OPENAI_COMPATIBLE_MODEL for expand role

# Model overrides (Anthropic only)
AI_DECOMPOSE_MODEL=claude-opus-4-6
AI_EXPAND_MODEL=claude-sonnet-4-6
AI_AUDIT_MODEL=claude-sonnet-4-6

# Temperature (both providers)
AI_TEMPERATURE_DECOMPOSE=0.3
AI_TEMPERATURE_EXPAND=0.3
AI_TEMPERATURE_AUDIT=0.2

# Databases (Phase 2+)
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=
DATABASE_URL=                    # PostgreSQL connection string
REDIS_URL=redis://localhost:6379

# Auth (Phase 2+)
CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Application
LOG_LEVEL=info
MAX_GRAPH_NODES=500
RATE_LIMIT_QUESTIONS_PER_HOUR=10
```

## Common Pitfalls

**Do not let React re-render the D3 canvas.** React and D3 both want to own the DOM. The boundary is: React renders a `<div ref={canvasRef} />`. D3 takes that ref and manages everything inside it. React never touches D3's DOM. D3 never touches React's DOM. Communication happens through Zustand stores and callbacks.

**Do not trust AI output structure.** Even with explicit JSON instructions, models occasionally produce malformed output, extra commentary, or missing fields. Every AI response goes through Zod validation. Handle parse failures gracefully.

**Do not make API calls on slider drag.** Slider reweighting is pure client-side math. If you find yourself writing a fetch call inside a slider's onChange handler, stop. The reweighting algorithm is defined in the spec and runs entirely in the browser.

**Do not merge the three prompt roles.** It is tempting to combine decomposition and auditing into a single "do it right the first time" prompt. This produces worse results than two separate passes. The auditor needs to see the decomposer's output as a finished artifact to critique. Keep them separate.

**Do not use Neo4j for non-graph data.** User accounts, session tokens, rate limiting counters, and audit logs go in PostgreSQL. Neo4j is for the claim graph and nothing else.

**Do not skip the bias audit.** Even during development, always run the audit pass after decomposition. Skipping it "to save API calls" during testing means you are testing a different system than what ships.

## Writing Style in UI Copy

Prism's voice is: clear, honest, and self-aware about its limitations. It does not pretend to be neutral (it aims for balance, which is different). It does not pretend to be comprehensive (it surfaces what it can and flags what it might be missing).

Examples of good UI copy:
- "This graph represents one decomposition of your question. Other framings are possible."
- "Confidence: 0.55 -- Evidence is mixed. Tap to see what supports and challenges this claim."
- "The bias audit flagged a potentially missing perspective. Tap to see details."

Examples of bad UI copy:
- "Here's the answer to your question." (Prism does not give answers.)
- "The balanced view is..." (Balance is the method, not a conclusion.)
- "Experts agree that..." (Prism shows what experts disagree about, not false consensus.)

## Cortex Integration

This project uses `prism` as its Cortex project name. All memories captured during development should use `project: "prism"`. The Cortex MCP server is configured globally and the protocol in `~/.claude/instructions.md` applies.

Key things to capture in Cortex during Prism development:
- Prompt iteration decisions (what changed and why, complements PROMPT_LOG.md)
- Architectural discoveries (things learned during implementation that aren't in the ADRs)
- Blockers and workarounds (especially AI response quirks from LM Studio vs. Anthropic)
- Task completion notes (what was done, what's next, any open questions)

## GitHub Issues: Autonomous Tracking

Claude Code has access to `gh` CLI and should use it to file, manage, and resolve GitHub issues autonomously. This is how the project tracks problems, improvements, and observations that fall outside the current task scope.

### Prerequisites

The `gh` CLI must be authenticated. If `gh auth status` fails, ask the user to run `gh auth login` before proceeding.

After creating the repo and pushing the initial commit, run the label setup script once:
```bash
./scripts/setup-labels.sh owner/prism
```

### Slash Commands

Three project-level commands are available:

| Command | When to use |
|---|---|
| `/review-and-file-issues` | After completing a task. Does a full self-review and files issues for anything noticed but not addressed. |
| `/file-issue` | Mid-task, when you notice something worth tracking. Quick, single-issue filing. |
| `/triage-issues` | At session start or when deciding what to work on next. Reviews open issues and suggests priorities. |

### When to File Issues Autonomously

**File an issue immediately (don't wait for review) when you encounter:**
- A parse failure from a model response that reveals a gap in the parser
- A test that fails intermittently or reveals an edge case
- A TODO, FIXME, HACK, or WORKAROUND you write in the code
- An observation about prompt quality during any test run
- A dependency version conflict or deprecation warning

**File during `/review-and-file-issues` (at task boundaries) for:**
- Technical debt you introduced intentionally to stay in scope
- Missing test coverage you noticed but didn't write
- Enhancement ideas that came up during implementation
- Documentation gaps in the spec or CLAUDE.md
- Anything that would make the next developer's life easier

**Do NOT file issues for:**
- Things already tracked in `docs/PHASE1_TASKS.md` as upcoming work
- Cosmetic preferences or subjective style choices
- Speculative concerns with no concrete evidence
- Things you can fix in under 2 minutes (just fix them)

### Issue Quality Rules

1. **Every issue gets `claude-filed` label.** This is non-negotiable. It allows filtering autonomous issues from human-filed ones.
2. **Every issue gets a phase label and a priority label.** No unlabeled issues.
3. **Titles are specific and actionable.** "Parser fails on Qwen2 markdown-fenced output with trailing newlines" not "Parser issue."
4. **Bodies include reproduction context.** Which model, which prompt, which test question, which file. Future-you (or the developer) needs to reproduce this without re-discovering the problem.
5. **Check for duplicates first.** Run `gh issue list --label claude-filed --search "<keywords>"` before creating.
6. **Close issues you resolve.** When you fix something that has an open issue, close it with `gh issue close <number> --comment "Fixed in <commit or description>"`.

### Workflow Integration

**At session start:**
1. Run `/triage-issues` to see what's open
2. Load Cortex context for the project
3. Decide whether to continue the current task or pick up a high-priority issue

**During task work:**
- If you notice something outside the current task scope, run `/file-issue` and move on. Do not chase it.
- If you write a TODO/FIXME comment in the code, file a corresponding issue immediately.

**At task completion:**
1. Run `/review-and-file-issues` for a structured self-review
2. Run `code-review` plugin for quality gate
3. Capture a Cortex memory summarizing the task
4. Check that any issues you resolved during this task are closed

**At session end:**
1. Any open work that isn't captured in an issue or Cortex memory is lost context. File it or capture it.

## Plugins and Skills

The developer has the following Claude Code plugins enabled. Use them as described below. Do not use plugins that are not listed here for this project.

### Always use (Phase 1)

**typescript-lsp** -- Active at all times. Provides real-time type checking across the monorepo. Rely on it to catch type mismatches between `packages/shared` and `packages/server`. Do not ignore its diagnostics.

**context7** -- Use `resolve-library-id` then `get-library-docs` to fetch current documentation for these dependencies before writing code that uses them:
- `zod` -- Schema API, `.safeParse()` patterns, transform and refinement syntax
- `@anthropic-ai/sdk` -- Message creation, streaming, error types
- `openai` -- Chat completion API, base URL configuration, compatibility mode

Do not rely on training data for these APIs. Fetch the docs.

**cortex (MCP)** -- Follow the global Cortex protocol. Use `project: "prism"` for all memories.

### Use at task boundaries

**superpowers: verification-before-completion** -- Run this before marking any task in `docs/PHASE1_TASKS.md` as complete. It performs a structured check that the deliverable matches the "Done when" criteria.

**superpowers: test-driven-development** -- Use for Task 4 (Parsers). Write parser tests first from the fixture files, then implement the parsers to pass them. The TDD skill has specific patterns for this.

**superpowers: systematic-debugging** -- Use when AI response parsing fails in unexpected ways. The skill's root-cause tracing is specifically useful for diagnosing why a local model's output doesn't match the expected schema.

**code-review** -- Run `/code-review` after completing each task before moving to the next. Focus the review on: type safety, error handling completeness, and adherence to CLAUDE.md conventions.

### Use when relevant

**superpowers: subagent-driven-development** -- Tasks 1, 2, and 3 in PHASE1_TASKS.md are independent and can be parallelized using subagents. Use the implementer and spec-reviewer prompts from this skill.

**superpowers: dispatching-parallel-agents** -- Use this to run Tasks 1, 2, and 3 simultaneously. Each task has a clear scope and no dependencies on the others.

**superpowers: write-plan / execute-plan** -- If a single task (especially Task 6: Orchestrator or Task 8: Eval Harness) feels too large, break it into a plan using this skill and execute step by step.

**pr-review-toolkit: type-design-analyzer** -- Run after Task 1 (Shared Types) to verify the type design is clean, discriminated unions are exhaustive, and the Zod schemas correctly mirror the interfaces.

**pr-review-toolkit: silent-failure-hunter** -- Run after Task 4 (Parsers) and Task 6 (Orchestrator). These are the layers most likely to swallow errors or degrade silently.

**code-simplifier** -- Run after Task 2 (AI Client) and Task 6 (Orchestrator). These modules must stay lean. If the abstraction is getting complicated, simplify.

**feature-dev: code-architect** -- Use if the initial package scaffolding (package.json files, tsconfig.json files, build scripts) needs to be generated from scratch rather than hand-configured.

### Do not use (Phase 1)

These plugins are enabled globally but are not relevant to Phase 1. Do not invoke them.

- **frontend-design** -- No UI in Phase 1.
- **playwright** -- No E2E tests in Phase 1.
- **vercel** -- No deployment in Phase 1.
- **ralph-loop** -- Autonomous looping is too risky for a project at this stage.
- **greptile** -- Codebase is too small to benefit from search.
- **coderabbit** -- Overlaps with code-review and pr-review-toolkit. Use those instead.
- **serena** -- Not applicable to this project.
- **humanizer** -- Not applicable to code. Relevant in Phase 3+ for UI copy, but not now.