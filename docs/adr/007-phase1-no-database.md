# ADR-007: Phase 1 Uses No Database

**Status:** Accepted  
**Date:** 2026-03-05

## Context

Phase 1's only goal is validating decomposition quality through prompt engineering. The question is whether to set up Neo4j and PostgreSQL from the start or defer database integration.

## Decision

Phase 1 persists graphs as local JSON files. No Neo4j, no PostgreSQL. The decomposition pipeline reads a question from stdin (or a minimal web form), calls the AI, and writes the resulting graph to a `.json` file in a local output directory.

## Rationale

Phase 1's feedback loop must be tight: change a prompt, run a test question, evaluate the output. Adding database setup, schema design, and persistence logic slows this loop without contributing to the only thing that matters in Phase 1 (AI output quality). If the decomposition quality is poor, no amount of infrastructure saves the project. Database integration is Phase 2's concern.

## Consequences

**Positive:** Phase 1 is fast to start, fast to iterate, and has zero infrastructure dependencies beyond a Claude API key. A developer can clone the repo and run an evaluation in minutes.

**Negative:** Phase 1 output is not directly usable by Phase 2. There will be a migration step to move from JSON files to Neo4j/PostgreSQL. This is acceptable because Phase 1's deliverable is validated prompts, not production data.
