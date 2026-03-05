# ADR-002: React + D3 Over Server-Rendered UI

**Status:** Accepted  
**Date:** 2026-03-05

## Context

The default preference for this project's creators leans toward lightweight, server-rendered stacks (HTMX + Alpine.js). However, Prism's core interaction is a force-directed graph with animated perspective reweighting, real-time node expansion, semantic zoom, drag/pan, and smooth transitions. The question is whether this level of interactivity can be delivered server-side.

## Decision

Use React + TypeScript for the frontend, with D3.js handling graph rendering on a Canvas element. This is a client-heavy SPA.

## Rationale

The graph visualization requires:
- Force simulation running continuously (or until stable) with 60fps updates.
- Smooth animated transitions when perspectives change (300-500ms interpolation of opacity, size, position for all nodes simultaneously).
- Real-time response to slider dragging with no perceptible latency.
- Hit detection on a Canvas element for click/hover on individual nodes.
- Semantic zoom (different detail levels at different zoom levels).

None of this is achievable with server-rendered HTML and partial page updates. HTMX excels at form submissions, list updates, and progressive enhancement. It is not designed for continuous animation loops or real-time Canvas manipulation.

React is chosen over vanilla JS because the non-graph UI (sidebar, detail panel, controls, pages) benefits from component composition and state management. Zustand provides lightweight global state that both React components and D3 callbacks can read from.

## Alternatives Considered

**HTMX + Alpine.js with a Canvas component.** Alpine could theoretically manage the Canvas, but integrating a D3 force simulation with Alpine's reactivity model would be fighting both tools. The graph IS the app, not a widget in a server-rendered page.

**Svelte.** Viable and arguably better for animation performance. Rejected because React's ecosystem is larger (more D3 integration examples, more component libraries, easier to find contributors). Not a strong rejection; revisit if React causes friction.

**Vue 3.** Also viable. Same reasoning as Svelte -- ecosystem breadth favors React for a project that will lean heavily on D3 integration patterns.

## Consequences

**Positive:**
- Full control over animation, layout, and interaction timing.
- Large ecosystem of D3 + React integration patterns to draw from.
- TypeScript support is first-class in both React and D3.

**Negative:**
- Heavier bundle size than a server-rendered approach.
- More client-side complexity to manage.
- Mobile experience will be degraded (accepted tradeoff per spec).
- Development is slower than HTMX for the non-graph parts of the UI.
