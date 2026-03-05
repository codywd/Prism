# Phase 2: The Map - Task Breakdown

## Overview

Phase 2 delivers the core visual experience: type a question, see the claim graph, explore it interactively. The sequencing is **UI-first** -- get the graph rendering working against Phase 1's pipeline output before adding databases, API layers, or auth. This lets us see the product and course-correct the design before investing in infrastructure.

**Definition of Done:** A user can type a question, wait for decomposition, see an interactive force-directed claim graph, click nodes to see details, see perspectives and tensions in a sidebar, and expand claims for deeper analysis. Persistence (saving questions, user accounts) is included but secondary to the core exploration experience.

## Architecture Note

Phase 2a (Tasks 1-9) runs the entire app without databases. The React client calls the Fastify server, which calls the AI pipeline and returns graph JSON. Graphs live only in memory/session. Phase 2b (Tasks 10-13) adds Neo4j, PostgreSQL, Clerk auth, and persistence.

## Task Order

---

### Task 1: React App Scaffold + Static Data Loading

**Location:** `packages/client/`

Stand up the React + TypeScript + Vite app and load Phase 1 eval outputs as static mock data for development.

**Scope:**
- Initialize Vite + React + TypeScript project in `packages/client/`
- Install dependencies: `react-router-dom`, `zustand`, `d3`, `tailwindcss`
- Set up Tailwind CSS with the base config
- Set up React Router with routes from PRISM_SPEC.md Section 5.3: `/`, `/q/:id`, `/q/:id/summary`, `/account`
- Create Zustand stores: `graphStore` (graph data, selected node), `perspectiveStore` (active perspectives, slider values), `uiStore` (panel state, zoom level)
- Build a mock data loader that reads Phase 1 eval JSON files (copy 2-3 Q outputs into `packages/client/public/mock/`) and populates the graph store
- Create a minimal `ExplorePage` that loads mock data on mount and renders a placeholder `<div>` where the graph will go
- `tsconfig.json` extends `../../tsconfig.base.json`, imports from `@prism/shared`

**Done when:** `pnpm dev:client` starts, navigating to `/q/mock` loads a Phase 1 eval output into Zustand, and the store contents are visible in React DevTools or a debug `<pre>` dump on the page.

**Plugins:** Use `context7` to fetch current Vite and Tailwind docs. Use `feature-dev: code-architect` for initial scaffold.

---

### Task 2: D3 Force-Directed Graph Canvas

**Location:** `packages/client/src/components/graph/`

This is the hardest and most uncertain task in Phase 2. Get a force-directed graph rendering on a Canvas element using D3.

**Scope:**
- Create `GraphCanvas.tsx` -- a React component that renders a `<canvas>` element and gives D3 full ownership via a ref
- Implement D3 force simulation with: `forceLink` (edges), `forceManyBody` (repulsion), `forceCenter`, `forceCollide`
- Draw nodes as circles (shape encoding comes in Task 3) and edges as lines
- Nodes labeled with truncated claim text (first 40 chars)
- Implement zoom (scroll wheel) and pan (drag canvas) using `d3.zoom()`
- Simulation stabilizes after initial layout, then re-heats on data changes
- Canvas resizes with the container (ResizeObserver)
- Use the mock data from Task 1's graph store

**Key constraint:** React renders the `<canvas>` container. D3 manages everything inside it. Do not mix React's virtual DOM with D3's DOM manipulation. Communication flows through Zustand: React writes to the store (e.g., window resize), D3 reads from the store (graph data) and writes interaction state back (e.g., hovered node).

**Performance target:** 60fps pan/zoom with the largest mock graph (Q4 at 23 claims + edges). If this is met with circles, it will be met with shapes.

**Done when:** Loading `/q/mock` shows a force-directed graph with nodes and edges that stabilizes, and you can zoom and pan smoothly.

**Plugins:** Use `context7` to fetch current D3 force simulation docs. This is the task most likely to need `superpowers: systematic-debugging`.

---

### Task 3: Visual Encoding (Node Shapes + Edge Styles)

**Location:** `packages/client/src/components/graph/NodeRenderer.ts`, `EdgeRenderer.ts`

Implement the visual encoding table from PRISM_SPEC.md Section 5.2.

**Scope:**
- `NodeRenderer.ts` -- Canvas draw functions for each claim type shape:
  - EMPIRICAL = circle
  - VALUE = diamond
  - DEFINITIONAL = square
  - PREDICTIVE = triangle
  - CONDITIONAL = pentagon
- Node size scales with depth (depth 0 = largest)
- Border thickness scales with confidence
- Unexpanded nodes are outlined (inviting click); expanded are filled
- `EdgeRenderer.ts` -- Canvas draw functions for each relationship type:
  - REQUIRES = solid line + arrow
  - STRENGTHENED_BY = dashed line + arrow + green tint
  - WEAKENED_BY = dashed line + arrow + red tint
  - CONTRADICTS = dotted line + double arrow + red
  - ASSUMES = thin solid line + gray + arrow
- Line thickness scales with edge weight
- Color palette defined as constants (not hardcoded hex in draw functions)

**Done when:** The mock graph renders with correct shapes per claim type, correct line styles per relationship type, and visual weight differences are clearly distinguishable at default zoom.

**Plugins:** Run `code-review` after completion. Visual encoding must match the spec table exactly.

---

### Task 4: Hit Detection + Interactions

**Location:** `packages/client/src/components/graph/HitDetection.ts`, `useGraphInteraction.ts`

Canvas elements have no built-in click targets. Implement color-picking hit detection and wire up click/hover/drag interactions.

**Scope:**
- `HitDetection.ts` -- Hidden offscreen canvas where each node is drawn with a unique color. On mouse events, read the pixel color at the cursor position and map it back to a node ID.
- Click node: set `selectedNode` in graph store (opens detail panel in Task 5)
- Hover node: highlight connected edges and adjacent nodes, dim unconnected nodes. Write `hoveredNode` to graph store.
- Double-click node: trigger expansion (wired to API in Task 9, for now just log "expand requested for {nodeId}")
- Drag node: pin node to dragged position. Double-click pinned node to unpin.
- Click empty canvas: deselect node, close detail panel
- Keyboard: Escape to deselect, +/- for zoom, arrow keys for pan

**Done when:** Clicking a node logs its ID to console and updates the store. Hovering highlights connections. Dragging repositions. All interactions feel responsive (no perceptible delay between click and feedback).

**Plugins:** Use `superpowers: test-driven-development` for the color-picking logic (deterministic mapping between colors and node IDs).

---

### Task 5: Detail Panel

**Location:** `packages/client/src/components/detail/`

When a node is selected, a panel slides up from the bottom showing the claim's full information.

**Scope:**
- `DetailPanel.tsx` -- slide-up panel anchored to the bottom of the canvas area. 300px default height, resizable by dragging the top edge.
- `ClaimDetail.tsx` -- displays for the selected claim:
  - Full claim text
  - Claim type (with shape icon matching the graph)
  - Confidence score with visual bar + rationale text
  - "Explore deeper" button (wired in Task 9)
- `EvidenceList.tsx` -- list of evidence items linked to this claim:
  - Evidence text
  - Source description
  - Strength badge (STRONG/MODERATE/WEAK/ABSENT with color coding)
  - Direction badge (SUPPORTS = green, OPPOSES = red, MIXED = amber)
- Show connected claims: "Depends on" and "Depended on by" lists with claim text + relationship type
- Panel closes on Escape or clicking the X or clicking empty canvas

**Done when:** Clicking any node in the mock graph opens the detail panel with correct claim info, evidence, and connected claims. Panel slides smoothly, closes cleanly.

**Plugins:** Use `frontend-design` for the panel layout and styling.

---

### Task 6: Sidebar (Perspectives, Tensions, Legend)

**Location:** `packages/client/src/components/sidebar/`

The left sidebar showing the question, perspectives, value sliders, tensions, and the visual legend.

**Scope:**
- `Sidebar.tsx` -- 280px fixed sidebar, collapsible to icon rail
- `QuestionDisplay.tsx` -- shows the current question text at the top
- `PerspectiveList.tsx` -- list of perspectives with checkboxes. Multiple can be active. Checking a perspective writes to the perspective store. (Visual reweighting comes in Phase 3, but the toggles should exist now and update the store.)
- `TensionList.tsx` -- list of auto-detected tensions. Each shows:
  - Tension text
  - Type badge (FACTUAL/VALUE/FRAMING/PREDICTIVE)
  - Involved perspectives
  - Clickable: clicking a tension highlights its involved claims in the graph (pulse animation or temporary glow)
- `Legend.tsx` -- visual key showing node shapes, edge styles, and what they mean
- `ValueSliders.tsx` -- render value dimension sliders. Moving a slider writes to the perspective store. (Reweighting animation is Phase 3, but the sliders should exist and update state.)

**Done when:** Sidebar renders with all sections populated from mock data. Perspective checkboxes update the store. Tension clicks highlight relevant nodes. Sliders move and update state. Sidebar collapses and expands.

**Plugins:** Use `frontend-design` for sidebar styling. Run `code-review` after completion.

---

### Task 7: Fastify API Server

**Location:** `packages/server/`

Wrap the Phase 1 pipeline in an HTTP API so the client can call it.

**Scope:**
- Set up Fastify server in `packages/server/src/index.ts`
- Implement routes:
  - `POST /api/questions` -- accepts `{ question: string }`, runs the orchestrator, returns the full graph JSON. This is a long-running request (1-2 min). Use Server-Sent Events (SSE) to stream progress updates: "decomposing...", "auditing...", "expanding claim 1 of 3...", then the final graph.
  - `GET /api/questions/:id/graph` -- returns a cached graph by ID (in-memory Map for now, Neo4j in Task 10)
  - `POST /api/claims/:id/expand` -- runs the expander on a single claim, returns new sub-claims and edges
- CORS configured for `http://localhost:5173`
- Request validation with JSON Schema
- Error envelope: `{ error: { code, message, details? } }`
- In-memory graph cache: `Map<string, ClaimGraph>` keyed by a generated question ID. No database yet.
- Wire up the mixed-mode provider config (Opus decompose, Sonnet audit/expand via Alter)

**Done when:** `pnpm dev:server` starts on port 3000. `curl -X POST http://localhost:3000/api/questions -d '{"question":"test"}' -H 'Content-Type: application/json'` returns a valid graph JSON (or SSE stream with progress + final result). The expand endpoint works for a claim ID in the cached graph.

**Plugins:** Use `context7` to fetch Fastify docs. Use `superpowers: verification-before-completion` before marking done.

---

### Task 8: Question Input + Live Pipeline Integration

**Location:** `packages/client/src/pages/HomePage.tsx`, `packages/client/src/api/`

Connect the React frontend to the Fastify backend. User types a question, sees progress, gets the graph.

**Scope:**
- `HomePage.tsx` -- centered question input with submit button. Clean, minimal design. "What question are you thinking about?" placeholder.
- `client.ts` -- base fetch/SSE client that connects to the API
- `questions.ts` -- `submitQuestion(question: string)` function that:
  - POSTs to `/api/questions`
  - Listens to SSE progress events and updates a loading state
  - On completion, populates the graph store and navigates to `/q/:id`
- Loading state UI: show progress messages from SSE ("Decomposing your question...", "Auditing for balance...", "Expanding under-evidenced claims...") with a subtle animation. This is the user's first impression of the product. It should feel like something thoughtful is happening, not like the page is frozen.
- Error handling: if the pipeline fails, show a clear error message with retry option
- Remove the mock data loader from Task 1 (or keep it behind a `?mock=true` query param for development)

**Done when:** The full end-to-end flow works: type a question on the homepage, see progress updates, arrive at the explore page with a live graph rendered from the AI pipeline. This is the first time you'll see Prism do its actual thing.

**Plugins:** Use `frontend-design` for the homepage and loading state. Run `code-review` after completion.

---

### Task 9: Node Expansion (Interactive Deepening)

**Location:** `packages/client/src/components/graph/`, `packages/client/src/api/claims.ts`

Wire the "Explore deeper" button and double-click to trigger real-time claim expansion.

**Scope:**
- `claims.ts` -- `expandClaim(claimId: string)` function that POSTs to `/api/claims/:id/expand`
- On expansion response:
  - Add new sub-claims and edges to the graph store
  - Mark the parent claim as `is_expanded: true` (changes rendering from outlined to filled)
  - Animate new nodes: fade in from 0 opacity + scale from 0.3 to 1.0, originating from the parent node's position
  - Re-heat the force simulation to integrate new nodes into the layout
- Show a spinner on the node while expansion is in progress
- Handle expansion failure gracefully (show error in detail panel, don't break the graph)
- Limit expansion depth: if a claim is already at depth 3+, show a message instead of expanding further

**Done when:** Double-clicking a node (or clicking "Explore deeper" in the detail panel) triggers an API call, and new sub-claims animate into the graph smoothly. The parent node visually changes to indicate it has been expanded.

**Plugins:** This is the most animation-heavy task. Use `superpowers: systematic-debugging` if transitions are janky. Run `code-review` after completion.

---

### Task 10: Neo4j Graph Persistence

**Location:** `packages/server/src/db/neo4j/`

Replace the in-memory graph cache with Neo4j. Every decomposition is persisted and can be retrieved.

**Scope:**
- `client.ts` -- Neo4j driver initialization using env vars from `.env`
- `queries.ts` -- Cypher query functions:
  - `saveGraph(questionId, graph)` -- write all nodes (Question, Claim, Evidence, Tension, Perspective, ValueDimension) and edges to Neo4j
  - `loadGraph(questionId)` -- reconstruct the full ClaimGraph from Neo4j
  - `addExpansionResults(parentClaimId, expansionResult)` -- append new claims/edges from expansion
  - `deleteGraph(questionId)` -- remove a question and all its graph data
- Update the server routes to use Neo4j instead of the in-memory Map
- Ensure `docker compose up -d` starts Neo4j and it's accessible
- Create indexes on frequently queried properties (question_id, claim_id)

**Done when:** Submit a question, close the browser, reopen, navigate to `/q/:id`, and the graph loads from Neo4j. Expansion results are also persisted.

**Plugins:** Use `context7` to fetch Neo4j JavaScript driver docs. Run `pr-review-toolkit: silent-failure-hunter` to verify error handling on database operations.

---

### Task 11: PostgreSQL + Migrations

**Location:** `packages/server/src/db/postgres/`

Set up PostgreSQL for user-related data, session metadata, and audit logs.

**Scope:**
- `client.ts` -- PostgreSQL connection pool using `pg` or `postgres` (the npm package)
- Create migration framework (simple numbered SQL files in `migrations/`)
- Migration 001: `users` table (id, clerk_id, email, created_at)
- Migration 002: `questions` table (id, user_id, question_text, created_at, updated_at) -- links a Neo4j graph to a user
- Migration 003: `audit_log` table (id, user_id, action, question_id, details_json, created_at) -- tracks decompositions, expansions, etc.
- `queries.ts` -- CRUD functions for questions (list by user, create, delete)
- Update server routes: `POST /api/questions` now creates a PostgreSQL record and links it to the Neo4j graph
- `pnpm db:migrate` runs all pending migrations

**Done when:** Submitting a question creates records in both PostgreSQL (question metadata) and Neo4j (graph data). The questions list endpoint returns questions from PostgreSQL.

**Plugins:** Run `code-review` after completion.

---

### Task 12: Clerk Auth

**Location:** `packages/server/src/middleware/auth.ts`, `packages/client/`

Add user authentication. Users must sign in to submit questions.

**Scope:**
- Install and configure Clerk on the client (React SDK)
- Add sign-in/sign-up flow (Clerk's hosted UI components)
- Protect routes: `/q/:id` and question submission require auth. Homepage is public.
- Server middleware: validate Clerk session tokens on all protected API routes
- Create/update PostgreSQL user record on first sign-in
- Questions are scoped to the authenticated user (can only see your own)
- Account page (`/account`): basic profile info, list of saved questions

**Done when:** New users can sign up, sign in, submit questions, and see only their own questions. Unauthenticated users see the homepage but cannot submit.

**Plugins:** Use `context7` to fetch Clerk React SDK docs. Run `superpowers: verification-before-completion`.

---

### Task 13: Polish + Integration Testing

**Location:** Across all packages

Final quality pass before Phase 2 is considered complete.

**Scope:**
- Loading states: every async operation (decomposition, expansion, graph loading from DB) has a clear loading indicator
- Error states: every failure path shows a user-friendly message
- Empty states: new user with no questions sees helpful onboarding text
- Responsive behavior: test at 1024px+ (full layout), 768-1024px (collapsed sidebar), and note any mobile breakages (acceptable per spec)
- Graph performance: test with the largest graph from eval (Q10, 24 claims). Pan/zoom should be 60fps.
- Keyboard navigation: Tab through sidebar elements, Escape to close panels, +/- for zoom
- Outline view stub: add a toggle in the sidebar that switches from graph view to a nested list view of claims (basic implementation for accessibility, full version in Phase 3)
- Write Playwright e2e tests for: submit question flow, node click + detail panel, expansion, sign in/out
- Run `/review-and-file-issues` for a comprehensive self-audit

**Done when:** The full flow works end-to-end with no console errors, no unhandled promise rejections, no visual glitches at default zoom. E2e tests pass. A non-technical person could use it without guidance (after signing in).

**Plugins:** Use `playwright` for e2e tests. Use `frontend-design` for polish pass. Run `code-review` as final quality gate.

---

## Dependency Graph

```
Task 1 (Scaffold + Mock Data)
  └── Task 2 (D3 Canvas) ── Task 3 (Visual Encoding) ── Task 4 (Hit Detection)
                                                              │
                                                              ├── Task 5 (Detail Panel)
                                                              │
                                                              └── Task 6 (Sidebar)
                                                                    │
Task 7 (Fastify API) ─────────────────────────── Task 8 (Live Pipeline)
                                                              │
                                                              └── Task 9 (Expansion)
                                                                    │
                                                              Task 10 (Neo4j) ── Task 11 (PostgreSQL) ── Task 12 (Clerk Auth)
                                                                                                              │
                                                                                                        Task 13 (Polish)
```

Tasks 1-6 (frontend) and Task 7 (backend) can be parallelized. Task 8 requires both to be complete. Tasks 10-12 are sequential infrastructure. Task 13 is last.

## Phase 2a vs 2b

**Phase 2a (Tasks 1-9):** Pure UI + live pipeline. No database, no auth. A user can type a question and explore the graph, but nothing persists. This is the milestone where you first see the product.

**Phase 2b (Tasks 10-13):** Infrastructure and polish. Neo4j, PostgreSQL, Clerk, persistence, and production readiness.

Phase 2a is the creative work. Phase 2b is the plumbing. If Phase 2a reveals that the graph visualization needs a fundamentally different approach, you'll know before investing in persistence infrastructure.