# ADR-006: Shared Types Package as Single Source of Truth

**Status:** Accepted  
**Date:** 2026-03-05

## Context

The claim graph data model (ClaimNode, EvidenceNode, TensionNode, Perspective, etc.) is used by the server (to construct and persist graphs), the client (to render and interact with graphs), and the AI response parsers (to validate output). Type drift between these layers would cause subtle, hard-to-debug mismatches.

## Decision

All canonical TypeScript types live in `packages/shared/src/types/`. Both client and server import from this package. No type definitions for domain objects exist outside of `shared/`.

## Rationale

Single source of truth eliminates an entire class of bugs. When a field is added to ClaimNode, the compiler surfaces every location that needs to handle it across both client and server. Zod schemas for AI response validation are derived from the same types, so parsing validation stays in sync with the domain model automatically.

## Consequences

**Positive:** Type changes propagate to all consumers at compile time. Impossible to have a server that writes a field the client doesn't read, or vice versa.

**Negative:** Adds a third package to the monorepo. Requires pnpm workspaces or similar tooling. Changes to shared types require rebuilding both client and server (mitigated by Vite's HMR and Fastify's watch mode).
