# Prism

**Collaborative sense-making platform that decomposes complex questions into explorable claim graphs.**

Prism takes a natural language question ("Should cities invest in light rail?", "Should I homeschool my kids?", "Is nuclear power worth the investment?") and decomposes it into an interactive graph of claims, evidence, perspectives, and tensions. Users explore the graph, toggle between perspectives, and adjust value sliders to feel tradeoffs in real time.

The goal is not to give answers. The goal is to help people think better.

## Project Status

**Phase 1: The Engine** -- COMPLETE. AI decomposition pipeline validated. 10/10 eval questions scored 4.0+ (avg 4.52). See `docs/PROMPT_LOG.md`.

**Phase 2: The Map** -- Building the interactive graph visualization and API server.

See `docs/PHASE2_TASKS.md` for the current task breakdown.

## Key Documents

| Document | Purpose |
|---|---|
| `PRISM_SPEC.md` | Authoritative specification. If anything conflicts, the spec wins. |
| `CLAUDE.md` | Development conventions, architecture rules, and pitfalls for Claude Code. |
| `docs/PHASE2_TASKS.md` | Ordered task checklist for Phase 2 (current phase). |
| `docs/PHASE1_TASKS.md` | Phase 1 task checklist (complete). |
| `docs/EVAL_RUBRIC.md` | Test questions and scoring rubric for decomposition quality. |
| `docs/PROMPT_LOG.md` | Tracks prompt iterations and their effect on quality scores. |
| `docs/adr/` | Architecture Decision Records explaining why key decisions were made. |

## Quick Start (Phase 1)

```bash
# Prerequisites: Node.js 20+, pnpm 9+
# For local AI: LM Studio running with a model loaded

# Setup
pnpm install
cp .env.example .env
# Edit .env: set OPENAI_COMPATIBLE_MODEL to your loaded model name

# Run a single question
pnpm run:question "Should I switch careers from engineering to teaching?"

# Run full evaluation
pnpm eval

# Run evaluation against Anthropic (for quality scoring)
AI_PROVIDER=anthropic pnpm eval
```

## Architecture

Prism uses a three-prompt AI architecture:

1. **Decomposer** -- Takes a question, produces an initial claim graph
2. **Auditor** -- Reviews the graph for bias, missing perspectives, and miscalibrated confidence
3. **Expander** -- Drills deeper into a single claim when a user requests it

The AI backend supports both Anthropic (Claude API) and OpenAI-compatible endpoints (LM Studio) for development. See `docs/adr/009-dual-ai-backend.md`.

## Monorepo Structure

```
packages/
  shared/    # Canonical TypeScript types and Zod schemas
  server/    # Fastify API server + AI orchestration
  client/    # React + D3 graph visualization (Phase 2+)
```

## License

TBD