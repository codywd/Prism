# Architecture Decision Records

ADRs capture the reasoning behind significant technical and design decisions. They exist so that future contributors (human or AI) do not reverse deliberate choices without understanding why they were made.

## Format

Each ADR follows this structure:

```
# ADR-NNN: Title

**Status:** Accepted | Superseded | Deprecated
**Date:** YYYY-MM-DD
**Context:** What problem or question prompted this decision?
**Decision:** What did we decide?
**Rationale:** Why this option over alternatives?
**Alternatives Considered:** What else was on the table?
**Consequences:** What follows from this decision, both positive and negative?
```

## Index

| ADR | Title | Status | Date |
|---|---|---|---|
| 001 | Three-prompt AI architecture | Accepted | 2026-03-05 |
| 002 | React + D3 over server-rendered UI | Accepted | 2026-03-05 |
| 003 | Neo4j for graph data, PostgreSQL for everything else | Accepted | 2026-03-05 |
| 004 | Client-side reweighting with no API round-trip | Accepted | 2026-03-05 |
| 005 | Bias audit as a mandatory second pass | Accepted | 2026-03-05 |
| 006 | Shared types package as single source of truth | Accepted | 2026-03-05 |
| 007 | Phase 1 uses no database | Accepted | 2026-03-05 |
| 008 | Canvas rendering over SVG for graph | Accepted | 2026-03-05 |
| 009 | Dual AI backend: Anthropic + OpenAI-compatible local models | Accepted | 2026-03-05 |