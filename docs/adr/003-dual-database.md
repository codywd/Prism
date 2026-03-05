# ADR-003: Neo4j for Graph Data, PostgreSQL for Everything Else

**Status:** Accepted  
**Date:** 2026-03-05

## Context

Prism's data model has two distinct shapes: a heavily-relational claim graph (nodes with typed edges, traversal queries, path analysis) and flat transactional records (user accounts, sessions, audit logs, rate limits). The question is whether to use one database or two.

## Decision

Use Neo4j Community Edition for the claim graph. Use PostgreSQL for all non-graph data.

## Rationale

The claim graph is a textbook graph database use case. Queries like "find all claims reachable from this claim through REQUIRES edges" or "find all tension points involving these two perspectives" are natural in Cypher and painful in SQL (recursive CTEs, self-joins). Neo4j's native graph storage means traversal performance does not degrade with graph size the way relational join-based approaches do.

PostgreSQL handles everything that's record-shaped: user accounts, session tokens, shared link metadata, rate limiting counters, audit logs. These are simple CRUD operations with index-based lookups. Using Neo4j for this would be using a graph database as a document store, which is wasteful.

## Alternatives Considered

**PostgreSQL only with JSONB for graph storage.** Simpler operationally (one database). But graph traversal queries in SQL are verbose, slow, and hard to maintain. The claim graph is the core product; it deserves native graph tooling.

**Neo4j only.** Possible, but Neo4j's transaction model and query patterns are awkward for simple record lookups, rate limiting counters, and sequential audit logs.

**PostgreSQL with Apache AGE extension.** Interesting hybrid (graph queries in PostgreSQL). Less mature than Neo4j. Smaller community. Revisit if operational complexity of two databases becomes a real problem.

## Consequences

**Positive:**
- Each database is used for what it's best at.
- Cypher queries for graph operations are readable and maintainable.
- PostgreSQL handles auth/sessions with battle-tested patterns.

**Negative:**
- Two databases to operate, migrate, back up, and monitor.
- Data consistency across databases requires care (e.g., deleting a user in PostgreSQL must also clean up their graphs in Neo4j).
- Local dev requires Docker Compose with multiple services.
