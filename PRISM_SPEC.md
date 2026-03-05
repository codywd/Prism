# Prism: Collaborative Sense-Making Platform

## Formal Specification v1.0

**Author:** Claude (Anthropic), with Cody Dostal  
**Date:** March 5, 2026  
**Status:** Draft  
**Purpose:** Serve as the authoritative specification for Claude Code implementation.

---

## 1. Vision and Problem Statement

### 1.1 Problem

People arrive at positions on complex topics not by weighing the full decision landscape, but because the first framing they encountered anchored everything that followed. Existing tools optimize for delivering answers faster. No widely available tool optimizes for helping people *think better* about hard questions.

### 1.2 Vision

Prism is an interactive web application that decomposes complex questions into explorable claim graphs, surfaces the strongest version of every perspective, makes uncertainty visible, and lets users feel tradeoffs in real time by manipulating value weightings.

### 1.3 Core Principles

1. **Steel-man everything.** Every perspective gets its strongest possible representation.
2. **Make uncertainty visible.** Never hide thin evidence behind confident language. Show where evidence is strong, mixed, or absent.
3. **Separate facts from values.** Clearly distinguish empirical disagreements ("what is true") from value disagreements ("what matters most").
4. **Build independence, not dependence.** The goal is a user who thinks more clearly after using Prism, not one who needs Prism to think.
5. **Bias is the enemy.** The system audits its own outputs for balance and flags underrepresented perspectives.

---

## 2. Core Data Model: The Claim Graph

The claim graph is the foundational data structure. Everything in Prism derives from it.

### 2.1 Node Types

#### 2.1.1 Question Node

The root of every graph. Represents the user's original question.

```
QuestionNode {
  id: UUID
  text: string                    // Original natural language question
  normalized_text: string         // AI-cleaned version for consistency
  created_at: timestamp
  updated_at: timestamp
  decomposition_version: integer  // Tracks re-decomposition passes
}
```

#### 2.1.2 Claim Node

The primary unit of the graph. An assertion that can be examined, supported, or challenged.

```
ClaimNode {
  id: UUID
  question_id: UUID               // Root question this belongs to
  text: string                    // The claim itself, stated clearly
  claim_type: enum {
    EMPIRICAL,                    // Can be evaluated against evidence
    VALUE,                        // Reflects a priority or moral weight
    DEFINITIONAL,                 // Depends on how a term is defined
    PREDICTIVE,                   // About future outcomes, inherently uncertain
    CONDITIONAL                   // True only if some precondition holds
  }
  confidence: float [0.0 - 1.0]  // System-assessed confidence
  confidence_rationale: string    // Why this confidence level
  depth: integer                  // Distance from root question (0 = direct answer)
  is_expanded: boolean            // Whether sub-claims have been generated
  created_at: timestamp
  source_pass: enum {
    INITIAL,                      // Generated during first decomposition
    EXPANSION,                    // Generated when user drilled into a node
    AUDIT,                        // Generated during bias audit pass
    USER                          // Added manually by user
  }
}
```

#### 2.1.3 Evidence Node

Linked to claims. Represents a specific piece of supporting or opposing evidence.

```
EvidenceNode {
  id: UUID
  claim_id: UUID                  // The claim this evidence relates to
  text: string                    // Summary of the evidence
  source_description: string      // Where this comes from (study, data, expert consensus, etc.)
  source_url: string | null       // Link if available
  strength: enum {
    STRONG,                       // Replicated, high-quality, broadly accepted
    MODERATE,                     // Credible but limited or contested
    WEAK,                         // Anecdotal, single-study, or methodologically questionable
    ABSENT                        // No meaningful evidence exists (this is itself informative)
  }
  direction: enum {
    SUPPORTS,                     // Evidence favors the claim
    OPPOSES,                      // Evidence undermines the claim
    MIXED                         // Evidence is ambiguous or cuts both ways
  }
  created_at: timestamp
}
```

#### 2.1.4 Tension Node

Automatically identified points where perspectives diverge. These are the most valuable parts of the graph.

```
TensionNode {
  id: UUID
  question_id: UUID
  text: string                    // Human-readable description of the tension
  tension_type: enum {
    FACTUAL,                      // Perspectives disagree about what is true
    VALUE,                        // Perspectives agree on facts but weigh them differently
    FRAMING,                      // Perspectives define the problem differently
    PREDICTIVE                    // Perspectives agree on present but disagree on outcomes
  }
  involved_perspectives: UUID[]   // Which perspectives are in tension here
  involved_claims: UUID[]         // Which claims are at the center of this tension
  created_at: timestamp
}
```

### 2.2 Edge Types

#### 2.2.1 Dependency Edge

Represents logical dependency between claims.

```
DependencyEdge {
  id: UUID
  source_claim_id: UUID           // The claim that depends
  target_claim_id: UUID           // The claim it depends on
  relationship: enum {
    REQUIRES,                     // Source is true only if target is true
    STRENGTHENED_BY,              // Source is more likely if target is true
    WEAKENED_BY,                  // Source is less likely if target is true
    CONTRADICTS,                  // Source and target cannot both be true
    ASSUMES                       // Source takes target as given without evidence
  }
  weight: float [0.0 - 1.0]      // How much the dependency matters
}
```

#### 2.2.2 Perspective-Claim Weight Edge

Connects perspectives to claims with a relevance weight.

```
PerspectiveWeight {
  perspective_id: UUID
  claim_id: UUID
  weight: float [0.0 - 1.0]      // How much this perspective cares about this claim
  rationale: string               // Why this claim matters (or doesn't) to this perspective
}
```

### 2.3 Perspectives

Named bundles of value weightings that don't change facts but change which facts matter.

```
Perspective {
  id: UUID
  question_id: UUID
  name: string                    // e.g., "The Fiscal Conservative Case"
  short_description: string       // One-line summary
  long_description: string        // Full articulation of this perspective
  value_weights: Map<string, float>  // e.g., {"cost_sensitivity": 0.9, "equity": 0.3}
  is_system_generated: boolean
  created_at: timestamp
}
```

### 2.4 Value Dimensions

The axes along which perspectives differ. Defined per question.

```
ValueDimension {
  id: UUID
  question_id: UUID
  name: string                    // e.g., "Cost Sensitivity"
  description: string             // What this dimension means in context
  low_label: string               // e.g., "Cost is not a primary concern"
  high_label: string              // e.g., "Cost is the deciding factor"
  default_value: float [0.0 - 1.0]
}
```

---

## 3. System Architecture

### 3.1 High-Level Overview

```
[Browser Client]
       |
       | HTTPS / WebSocket
       |
[API Gateway / App Server]
       |
       +--- [AI Orchestration Layer]
       |         |
       |         +--- Claude API (decomposition, expansion, audit)
       |
       +--- [Graph Database]
       |         |
       |         +--- Neo4j or Memgraph
       |
       +--- [Relational Database]
       |         |
       |         +--- PostgreSQL (users, sessions, metadata)
       |
       +--- [Cache Layer]
                 |
                 +--- Redis (session state, rate limiting, hot graphs)
```

### 3.2 Technology Choices

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | React + TypeScript | Complex interactive graph UI demands a component-driven SPA. This is one of the rare cases where server-rendered HTML would be insufficient. |
| Graph Rendering | D3.js (force-directed) with Canvas/WebGL fallback | Performance at scale. SVG chokes past ~200 nodes. D3 gives layout control. |
| API Layer | Node.js (Express or Fastify) | Strong TypeScript ecosystem, good streaming support for AI responses. |
| Graph Database | Neo4j Community Edition | Native graph storage and traversal. Cypher query language is expressive for the claim graph model. |
| Relational Database | PostgreSQL | User accounts, session metadata, audit logs, anything not graph-shaped. |
| Cache | Redis | Hot graph caching, session state, rate limiting on AI calls. |
| AI | Claude API (production/evaluation) + OpenAI-compatible local models via LM Studio (development) | Dual backend behind a shared interface. Local models for fast, free structural iteration. Anthropic for quality evaluation and production. See ADR-009. |
| Auth | Clerk or Auth.js | Not the interesting problem. Use a managed solution. |
| Hosting | Vercel (frontend) + Railway or Fly.io (backend + databases) | Fast iteration, reasonable cost at early scale. |

### 3.3 API Design

RESTful with the following resource hierarchy. All responses are JSON.

#### 3.3.1 Questions

```
POST   /api/questions                  // Create a new question, triggers decomposition
GET    /api/questions/:id              // Get question metadata
GET    /api/questions/:id/graph        // Get the full claim graph for a question
DELETE /api/questions/:id              // Delete a question and its graph
```

#### 3.3.2 Claims

```
GET    /api/questions/:id/claims              // List all claims for a question
GET    /api/claims/:id                        // Get a single claim with edges
POST   /api/claims/:id/expand                 // Trigger AI expansion of a claim
POST   /api/questions/:id/claims              // User-added claim
PATCH  /api/claims/:id                        // User edits a claim
```

#### 3.3.3 Perspectives

```
GET    /api/questions/:id/perspectives        // List all perspectives
GET    /api/perspectives/:id                  // Single perspective with weights
POST   /api/questions/:id/perspectives        // Create custom perspective
PATCH  /api/perspectives/:id                  // Modify perspective weights
```

#### 3.3.4 Graph Operations

```
POST   /api/questions/:id/audit               // Trigger bias audit pass
POST   /api/questions/:id/reweight            // Recalculate weights given slider values
GET    /api/questions/:id/tensions            // Get all tension points
GET    /api/questions/:id/export              // Export graph as JSON, Markdown, or image
```

#### 3.3.5 Sharing and Collaboration

```
POST   /api/questions/:id/share               // Generate shareable link
GET    /api/shared/:token                      // Load shared graph (read-only)
POST   /api/questions/:id/collaborate          // Create collaborative session
WS     /ws/collaborate/:session_id             // WebSocket for real-time collaboration
```

### 3.4 Data Flow: Question Decomposition

This is the most critical flow in the system.

```
1. User submits question (natural language)
        |
2. API normalizes and stores QuestionNode
        |
3. AI Orchestration: Decomposition Call
   - System prompt establishes Prism's principles (steel-man, balance, uncertainty)
   - User prompt contains the question
   - Requested output: structured JSON matching ClaimNode/Edge schemas
   - Model: claude-opus-4-6 (quality matters here)
   - Temperature: 0.3 (structured but not robotic)
        |
4. Parse AI response into graph nodes and edges
        |
5. AI Orchestration: Perspective Generation Call
   - Input: the initial claim graph
   - Output: 3-5 named perspectives with value weights
   - Model: claude-opus-4-6
        |
6. AI Orchestration: Bias Audit Call
   - Input: the full graph + perspectives
   - Output: list of underrepresented perspectives, missing counter-evidence, balance score
   - Model: claude-sonnet-4-20250514 (speed acceptable here)
        |
7. If audit identifies gaps, trigger targeted enrichment calls
        |
8. Store complete graph in Neo4j
        |
9. Return graph to client for rendering
```

### 3.5 Data Flow: Claim Expansion

When a user clicks a claim node to drill deeper:

```
1. Client sends POST /api/claims/:id/expand
        |
2. API retrieves the claim and its immediate context (parent, siblings, evidence)
        |
3. AI Orchestration: Expansion Call
   - System prompt: Prism principles + "expand this specific claim"
   - User prompt: the claim text + its context in the graph
   - Output: 3-7 sub-claims, supporting/opposing evidence, new dependency edges
   - Model: claude-sonnet-4-20250514 (speed matters for interactivity)
        |
4. Parse, store, return new nodes to client
        |
5. Client animates new nodes into the existing graph
```

### 3.6 Data Flow: Perspective Reweighting

When a user adjusts a value slider:

```
1. Client captures new slider values as Map<dimension_id, float>
        |
2. Client-side computation (no API call needed for basic reweighting):
   - For each claim, compute weighted relevance score:
     relevance = SUM(perspective_weight[claim] * slider_value[dimension])
   - Normalize to [0.0 - 1.0]
        |
3. Update node visual properties (opacity, size, glow intensity) based on relevance
        |
4. Re-run force-directed layout with relevance-weighted node charges
        |
5. Animate transition (300-500ms ease-in-out)
```

This must be client-side and fast. No round-trip to the server for slider interactions.

---

## 4. AI Prompt Architecture

### 4.1 System Prompt: Decomposition

```
You are the analytical engine of Prism, a tool that helps people think clearly
about complex questions. Your job is to decompose a question into a claim graph.

PRINCIPLES:
- Steel-man every position. Present the strongest version of each argument.
- Separate empirical claims from value claims. Label them explicitly.
- Be honest about uncertainty. If evidence is thin, say so. "Unknown" is a
  valid and valuable answer.
- Aim for 3-5 distinct perspectives that a reasonable, informed person might hold.
- Include at least one perspective that challenges the dominant framing of
  the question itself.
- Do not editorialize. Do not hint at which perspective is "correct."

OUTPUT FORMAT:
Respond with valid JSON matching the following schema. No preamble, no markdown
fencing, no commentary outside the JSON.

{
  "claims": [
    {
      "id": "claim_001",
      "text": "...",
      "claim_type": "EMPIRICAL | VALUE | DEFINITIONAL | PREDICTIVE | CONDITIONAL",
      "confidence": 0.0-1.0,
      "confidence_rationale": "...",
      "depth": 0
    }
  ],
  "edges": [
    {
      "source": "claim_001",
      "target": "claim_002",
      "relationship": "REQUIRES | STRENGTHENED_BY | WEAKENED_BY | CONTRADICTS | ASSUMES",
      "weight": 0.0-1.0
    }
  ],
  "evidence": [
    {
      "claim_id": "claim_001",
      "text": "...",
      "source_description": "...",
      "strength": "STRONG | MODERATE | WEAK | ABSENT",
      "direction": "SUPPORTS | OPPOSES | MIXED"
    }
  ],
  "perspectives": [
    {
      "name": "...",
      "short_description": "...",
      "long_description": "...",
      "claim_weights": {
        "claim_001": 0.0-1.0,
        "claim_002": 0.0-1.0
      }
    }
  ],
  "value_dimensions": [
    {
      "name": "...",
      "description": "...",
      "low_label": "...",
      "high_label": "..."
    }
  ],
  "tensions": [
    {
      "text": "...",
      "tension_type": "FACTUAL | VALUE | FRAMING | PREDICTIVE",
      "involved_perspectives": ["..."],
      "involved_claims": ["claim_001", "claim_003"]
    }
  ]
}
```

### 4.2 System Prompt: Bias Audit

```
You are a bias auditor for Prism. You have been given a claim graph generated
by another AI system. Your job is to evaluate it for balance and completeness.

Evaluate the following:
1. PERSPECTIVE COVERAGE: Are there reasonable perspectives missing entirely?
   Think across political, cultural, economic, generational, and disciplinary lines.
2. EVIDENCE BALANCE: For claims with strong supporting evidence, is opposing
   evidence also represented? For claims with opposing evidence, is supporting
   evidence represented?
3. FRAMING BIAS: Does the graph assume a particular framing of the question
   that excludes valid alternative framings?
4. CONFIDENCE CALIBRATION: Are confidence scores appropriate? Look for
   overconfidence on contested claims and underconfidence on well-established ones.
5. CLAIM TYPE ACCURACY: Are value claims mislabeled as empirical? Are
   definitional disputes hidden inside empirical framing?

OUTPUT FORMAT:
Respond with valid JSON. No preamble.

{
  "overall_balance_score": 0.0-1.0,
  "missing_perspectives": [
    {"name": "...", "description": "...", "why_missing_matters": "..."}
  ],
  "underrepresented_evidence": [
    {"claim_id": "...", "gap": "...", "suggested_evidence": "..."}
  ],
  "framing_issues": [
    {"description": "...", "suggested_reframe": "..."}
  ],
  "confidence_adjustments": [
    {"claim_id": "...", "current": 0.0, "suggested": 0.0, "rationale": "..."}
  ],
  "type_corrections": [
    {"claim_id": "...", "current_type": "...", "suggested_type": "...", "rationale": "..."}
  ]
}
```

### 4.3 System Prompt: Expansion

```
You are expanding a single claim within a Prism claim graph. The user wants
to understand this claim more deeply.

CONTEXT:
- The root question is: {question_text}
- The claim to expand is: {claim_text}
- Its current type is: {claim_type}
- Its parent claims are: {parent_claims}
- Its current evidence: {existing_evidence}

Generate sub-claims that break this claim into its component parts. Include:
- Supporting sub-claims (what must be true for this claim to hold)
- Challenging sub-claims (what would undermine this claim)
- New evidence for any sub-claim
- New dependency edges connecting sub-claims to existing claims

OUTPUT FORMAT:
Respond with valid JSON matching the expansion schema. No preamble.

{
  "sub_claims": [...],
  "new_evidence": [...],
  "new_edges": [...],
  "new_tensions": [...]
}
```

---

## 5. Frontend Specification

### 5.1 Layout

```
+------------------------------------------------------------------+
|  [Logo: Prism]              [My Questions]  [Shared]  [Account]  |
+------------------------------------------------------------------+
|                                                                    |
|  +--SIDEBAR (280px, collapsible)--+  +--MAIN CANVAS------------+ |
|  |                                |  |                          | |
|  |  QUESTION                      |  |                          | |
|  |  "Should cities invest in      |  |     CLAIM GRAPH          | |
|  |   light rail?"                 |  |     (Force-directed)     | |
|  |                                |  |                          | |
|  |  PERSPECTIVES                  |  |     [Interactive nodes   | |
|  |  [ ] The Urbanist Case         |  |      and edges with      | |
|  |  [ ] The Fiscal Conservative   |  |      zoom, pan, click    | |
|  |  [ ] The Equity Advocate       |  |      to expand]          | |
|  |  [+] Add Perspective           |  |                          | |
|  |                                |  |                          | |
|  |  VALUE SLIDERS                 |  |                          | |
|  |  Cost Sensitivity    [====o ]  |  |                          | |
|  |  Equity Priority     [ o====]  |  |                          | |
|  |  Environmental Impact [==o==]  |  |                          | |
|  |  Timeline Urgency    [===o=]   |  |                          | |
|  |                                |  |                          | |
|  |  TENSIONS (auto-detected)      |  |                          | |
|  |  > Ridership vs. Coverage      |  |                          | |
|  |  > Upfront Cost vs. Long-term  |  |                          | |
|  |                                |  +--------------------------+ |
|  |  LEGEND                        |                               |
|  |  * Empirical  * Value          |  +--DETAIL PANEL (slide-up)-+ |
|  |  * Strong     * Weak           |  |  Claim: "Light rail..."  | |
|  |                                |  |  Type: EMPIRICAL          | |
|  +--------------------------------+  |  Confidence: 0.72         | |
|                                      |  Evidence: [3 items]      | |
|                                      |  Depends on: [2 claims]   | |
|                                      +--------------------------+ |
+------------------------------------------------------------------+
```

### 5.2 Graph Rendering Specification

#### 5.2.1 Node Visual Encoding

| Property | Visual Encoding |
|---|---|
| claim_type | Shape: EMPIRICAL = circle, VALUE = diamond, DEFINITIONAL = square, PREDICTIVE = triangle, CONDITIONAL = pentagon |
| confidence | Border thickness: higher confidence = thicker border |
| depth | Size: depth 0 = largest, decreasing with depth |
| relevance (to active perspective) | Opacity + glow: high relevance = full opacity + subtle glow, low relevance = 40% opacity, no glow |
| is_expanded | Fill: expanded = filled, unexpanded = outlined (inviting click) |
| source_pass: AUDIT | Small badge icon indicating this was added by the bias audit |

#### 5.2.2 Edge Visual Encoding

| Property | Visual Encoding |
|---|---|
| relationship: REQUIRES | Solid line, arrow |
| relationship: STRENGTHENED_BY | Dashed line, arrow, green tint |
| relationship: WEAKENED_BY | Dashed line, arrow, red tint |
| relationship: CONTRADICTS | Dotted line, double arrow, red |
| relationship: ASSUMES | Thin solid line, gray, arrow |
| weight | Line thickness |

#### 5.2.3 Interaction Behaviors

| Action | Behavior |
|---|---|
| Click node | Open detail panel. If not expanded, show "Explore deeper" button. |
| Double-click node | Trigger expansion (API call). Animate new nodes emerging from parent. |
| Hover node | Highlight all connected edges and adjacent nodes. Dim unconnected nodes. |
| Click edge | Show relationship detail in panel. |
| Scroll wheel | Zoom in/out. Semantic zoom: zooming in reveals node labels, evidence counts. Zooming out shows only shapes and structure. |
| Drag canvas | Pan. |
| Drag node | Reposition (pin in place). Double-click to unpin. |
| Adjust value slider | Smooth 300ms animated reweight of all node opacities and sizes. Layout re-stabilizes over 500ms. |
| Toggle perspective checkbox | Apply that perspective's weights. Multiple perspectives can be active (weights average). |

#### 5.2.4 Animation Spec

All graph transitions use the following defaults:

- Duration: 300-500ms
- Easing: ease-in-out (CSS cubic-bezier(0.42, 0, 0.58, 1))
- New nodes: fade in from 0 opacity + scale from 0.3 to 1.0, originating from parent node position
- Removed nodes (if filtering): fade out to 0 opacity + scale to 0.3
- Reweighting: simultaneous interpolation of opacity, size, and position

### 5.3 Pages and Routes

| Route | Description |
|---|---|
| `/` | Landing page. Question input prominently centered. Recent questions below. |
| `/q/:id` | Main exploration view for a question. The graph canvas. |
| `/q/:id/summary` | AI-generated narrative summary of the full graph and its tensions. |
| `/shared/:token` | Read-only view of a shared graph. |
| `/collaborate/:session_id` | Real-time collaborative exploration. |
| `/account` | User settings, saved questions, history. |

### 5.4 Responsive Behavior

- **Desktop (>1024px):** Full layout as specified. Sidebar + canvas + detail panel.
- **Tablet (768-1024px):** Sidebar collapses to icon rail. Detail panel becomes bottom sheet.
- **Mobile (<768px):** Sidebar becomes a drawer. Graph takes full screen. Detail panel is a modal. Value sliders are in the drawer. This is a degraded experience and that's acceptable; Prism is primarily a desktop tool.

---

## 6. Non-Functional Requirements

### 6.1 Performance

| Metric | Target |
|---|---|
| Initial decomposition (question to rendered graph) | < 8 seconds |
| Claim expansion (click to new nodes visible) | < 3 seconds |
| Slider reweighting (adjustment to animation complete) | < 500ms (client-side only) |
| Graph rendering (up to 200 nodes) | 60fps pan/zoom |
| Graph rendering (200-500 nodes) | 30fps minimum, with level-of-detail reduction |
| Page load (returning to saved question) | < 2 seconds |

### 6.2 Scalability

- Graphs are expected to stay under 500 nodes per question. If a graph grows beyond this, the system should suggest focusing on a sub-question rather than continuing to expand.
- Target: 1,000 concurrent users in initial deployment. Horizontally scalable API layer.
- AI calls are the bottleneck. Implement request queuing with user-visible progress indicators.

### 6.3 Security

- Standard web application security (OWASP Top 10).
- All AI prompts are server-side only. The client never constructs or sees raw prompts.
- User-generated claims are sanitized before inclusion in AI prompts (injection prevention).
- Shared links are read-only with expiring tokens.
- No PII is included in AI calls beyond the question text and user-added claims.

### 6.4 Accessibility

- WCAG 2.1 AA compliance for all non-graph UI elements.
- The graph visualization is inherently visual. Provide an alternative "outline view" that renders the claim graph as a nested, navigable list for screen reader users.
- All interactive elements are keyboard-navigable.
- Color is never the sole indicator of meaning (shapes + color for node types; line style + color for edge types).

---

## 7. Phased Delivery Plan

### Phase 1: The Engine (Proof of Concept)

**Goal:** Validate that AI-driven decomposition produces useful, balanced claim graphs.

**Scope:**
- CLI tool or minimal web form: input a question, get back rendered JSON
- Implement decomposition prompt + parsing
- Implement bias audit prompt + parsing
- Implement expansion prompt + parsing
- Store graphs in a local JSON file (no database yet)
- Include 10+ test questions spanning personal decisions, policy questions, technical tradeoffs, and ethical dilemmas
- Manually evaluate output quality against a rubric:
  - Are there 3+ genuinely distinct perspectives?
  - Are value claims correctly identified?
  - Is confidence calibration reasonable?
  - Does the bias audit catch real gaps?

**Deliverable:** Working decomposition pipeline with quality validation.  
**Definition of Done:** 8 of 10 test questions produce graphs rated "good" or better on the rubric.

### Phase 2: The Map (Core UI)

**Goal:** Render the claim graph as an interactive, explorable visualization.

**Scope:**
- React application with graph canvas
- Force-directed layout using D3
- Node rendering with type-based shapes and confidence-based styling
- Edge rendering with relationship-based line styles
- Click-to-expand with API integration
- Detail panel for selected nodes
- Basic question input flow
- Neo4j integration for graph persistence
- PostgreSQL for user accounts (simple email/password via Clerk)

**Deliverable:** A working web app where users can type a question, see the graph, explore nodes, and expand claims.  
**Definition of Done:** End-to-end flow works for a new user with no errors. Graph is readable and navigable for questions producing up to 50 nodes.

### Phase 3: Perspectives and Reweighting

**Goal:** Implement the feature that makes Prism unique: perspective-driven exploration.

**Scope:**
- Sidebar with perspective toggles and value sliders
- Client-side reweighting computation
- Animated graph transitions when perspectives/sliders change
- Tension node detection and display
- "Outline view" alternative rendering for accessibility
- Summary page: AI-generated narrative of the full graph

**Deliverable:** The complete core experience.  
**Definition of Done:** A user can type a question, explore the graph, toggle perspectives, adjust value sliders, see tensions, and read a narrative summary.

### Phase 4: Polish, Share, Collaborate

**Goal:** Make it social and shareable.

**Scope:**
- Shareable read-only links with token-based access
- Collaborative mode: two users explore the same graph with independent perspective sliders
- WebSocket infrastructure for real-time collaboration
- "Where do we diverge?" feature: highlights the specific claims and value dimensions where two collaborators' slider positions produce different conclusions
- Export: Markdown summary, PNG/SVG of graph, JSON of full graph data
- Onboarding flow for new users
- Performance optimization for large graphs

**Deliverable:** A complete, shareable, collaborative tool.  
**Definition of Done:** Two users can independently explore the same question, set their own value sliders, and see exactly where their perspectives diverge.

---

## 8. Open Questions and Risks

### 8.1 Open Questions

1. **Decomposition Quality Ceiling:** How good can AI decomposition get with prompt engineering alone? At what point does the system need human curation or fine-tuning?
2. **Graph Readability:** Force-directed layouts can become unreadable. At what node count does the UX break down, and what's the mitigation? (Clustering? Collapsible sub-graphs? Fisheye distortion?)
3. **Confidence Calibration:** How do we validate that the AI's confidence scores are meaningful and not just plausible-sounding numbers?
4. **Scope Creep on Perspectives:** Some questions (especially political ones) could generate dozens of valid perspectives. How many is too many? Current spec assumes 3-5 is the sweet spot.
5. **User-Added Claims:** How much should users be able to modify the graph? Full edit access risks turning a balanced tool into a confirmation bias machine. Read-only + "suggest a missing perspective" might be safer.

### 8.2 Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| AI decomposition quality is inconsistent | Medium | High | Extensive prompt iteration in Phase 1. Quality rubric. Consider fine-tuning if prompt engineering plateaus. |
| Graph visualization is overwhelming for non-technical users | High | Medium | Invest heavily in onboarding. Default to simplified view. Progressive disclosure of complexity. |
| AI costs per question are too high (multiple calls per decomposition) | Medium | Medium | Cache aggressively. Use Sonnet where Opus isn't needed. Batch evidence lookups. Set per-user rate limits. |
| Users treat Prism as an oracle rather than a thinking tool | Medium | High | UI copy and onboarding must constantly reinforce "this helps you think, not tells you what to think." No "recommended answer." |
| Bias audit is insufficient and the tool amplifies existing biases | Low-Medium | Very High | Continuous evaluation. Public methodology. Allow users to flag bias. Treat this as an ongoing process, not a one-time fix. |

---

## 9. Success Metrics

| Metric | Target | Rationale |
|---|---|---|
| Decomposition quality score (manual evaluation) | > 80% rated "good" or better | The engine must be trustworthy. |
| Average exploration depth (claims expanded per session) | > 3 | Users should go deep, not just look at the surface. |
| Perspective toggle rate (% of sessions where user switches perspectives) | > 60% | This is the core feature. If people don't use it, the tool has failed. |
| Slider interaction rate (% of sessions with slider adjustments) | > 40% | Feeling tradeoffs is the key differentiator. |
| Return rate (users who come back within 7 days) | > 30% | The tool must be valuable enough to revisit. |
| Collaboration feature usage (Phase 4) | > 15% of sessions | Social features are Phase 4 and aspirational. |
| Time per session | 5-15 minutes | Under 5 suggests shallow engagement. Over 15 suggests the tool is confusing or users are lost. |

---

## Appendix A: Example Decomposition

**Question:** "Should I switch my child from public school to homeschooling?"

**Expected Claim Graph (abbreviated):**

Claims (depth 0):
- "Homeschooling allows customized pacing and curriculum" (EMPIRICAL, confidence: 0.9)
- "Public schools provide socialization opportunities that are hard to replicate" (EMPIRICAL, confidence: 0.65)
- "A child's educational needs should be the primary driver" (VALUE)
- "Homeschooling requires significant parental time investment" (EMPIRICAL, confidence: 0.95)
- "Educational outcomes depend more on parental engagement than school setting" (EMPIRICAL, confidence: 0.55)

Perspectives:
- "The Individualized Learning Advocate" - prioritizes customization, learning speed, child autonomy
- "The Social Development Prioritizer" - prioritizes peer interaction, exposure to diversity, collaborative skills
- "The Practical Realist" - prioritizes family schedule constraints, cost, parental capacity, and sustainability
- "The Systemic Thinker" - considers effects on the public school system, community ties, civic participation

Tensions:
- (VALUE) Individualized Learning vs. Social Development advocates weigh "socialization" evidence differently
- (PREDICTIVE) All perspectives disagree on long-term social outcomes of homeschooling
- (FRAMING) The Systemic Thinker challenges whether this is purely a family decision at all

---

## Appendix B: Glossary

| Term | Definition |
|---|---|
| Claim Graph | The directed graph of claims, evidence, and relationships that represents the decomposition of a question. |
| Decomposition | The AI-driven process of breaking a question into its component claims, evidence, and perspectives. |
| Expansion | Drilling deeper into a single claim to generate sub-claims and additional evidence. |
| Perspective | A named set of value weightings representing a coherent viewpoint on the question. |
| Reweighting | The client-side process of adjusting node visual properties based on the active perspective and slider values. |
| Steel-manning | Presenting the strongest possible version of an argument, even one you disagree with. |
| Tension Point | An automatically identified location in the graph where two or more perspectives diverge. |
| Value Dimension | An axis along which perspectives can differ (e.g., cost sensitivity, equity priority). |
| Bias Audit | A secondary AI pass that evaluates a claim graph for missing perspectives, unbalanced evidence, and miscalibrated confidence. |