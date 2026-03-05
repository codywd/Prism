# ADR-008: Canvas Rendering Over SVG for Graph Visualization

**Status:** Accepted  
**Date:** 2026-03-05

## Context

D3 can render to either SVG (individual DOM elements per node/edge) or Canvas (a single bitmap drawn programmatically). The graph may contain up to 500 nodes with continuous force simulation and animated transitions.

## Decision

Use Canvas as the primary rendering target. SVG may be used as a fallback for very small graphs (<50 nodes) or for export/print scenarios where vector output is needed.

## Rationale

SVG creates a DOM element for every node and edge. At 200 nodes with edges, that's 500+ DOM elements being repositioned every animation frame. Browser layout and paint costs make 60fps impossible at this scale. Canvas draws everything in a single bitmap with no DOM overhead. A 500-node graph renders at 60fps on modest hardware.

The tradeoff is that Canvas has no built-in event handling per shape. Hit detection requires a secondary technique: either a hidden Canvas with unique colors per node (color picking) or spatial indexing (quadtree). Color picking is simpler and well-documented in D3 Canvas examples.

## Alternatives Considered

**SVG only.** Works beautifully for small graphs. Falls apart above ~100 nodes. Since Prism graphs can grow to 500 nodes, SVG alone is not viable as the primary renderer.

**WebGL (via Three.js or regl).** Maximum performance, capable of rendering thousands of nodes. Overkill for the expected node count (max 500). Adds significant complexity (shader programming, GPU memory management). Revisit only if Canvas performance is insufficient.

**Hybrid SVG + Canvas.** Use SVG for labels and interactive overlays, Canvas for nodes and edges. Adds complexity. Defer unless pure Canvas proves insufficient for label rendering.

## Consequences

**Positive:** Smooth 60fps rendering at target scale. Single rendering surface simplifies animation coordination.

**Negative:** No native DOM events on Canvas shapes; hit detection requires color picking or spatial indexing. Text rendering on Canvas is less crisp than SVG at certain zoom levels. Accessibility requires a parallel "outline view" since Canvas content is invisible to screen readers (already specified in PRISM_SPEC.md Section 6.4).
