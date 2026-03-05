# ADR-004: Client-Side Reweighting With No API Round-Trip

**Status:** Accepted  
**Date:** 2026-03-05

## Context

When a user adjusts a value slider or toggles a perspective, every node in the graph needs its visual properties (opacity, size, glow) recalculated. This must feel instant during slider dragging.

## Decision

Reweighting is computed entirely in the browser. No API call. The client holds the full perspective-claim weight matrix and the current slider values, and computes `relevance(claim) = SUM(perspective_weight[claim] * slider_value[dimension])` on every slider change.

## Rationale

A round-trip to the server would add 50-200ms of latency per slider movement. Sliders fire change events continuously while dragging. Even 50ms of latency would make the interaction feel sluggish. The reweighting computation is simple arithmetic over a matrix that fits entirely in browser memory (500 nodes * 5 perspectives * 6 dimensions = 15,000 multiplications, trivially fast).

## Alternatives Considered

**Server-side computation with debounced requests.** Would work for discrete toggles but fails for continuous slider dragging. The "feel the tradeoff" experience requires sub-16ms response times.

**WebSocket streaming.** Overengineered for simple arithmetic that the browser can handle in microseconds.

## Consequences

**Positive:**
- Instant feedback during slider manipulation. The graph responds as fast as the user can move the slider.
- No server load from reweighting operations.
- Works offline once the graph is loaded.

**Negative:**
- The full weight matrix must be sent to the client with the graph data. For large graphs this adds to initial payload size (acceptable; 500 nodes * 5 perspectives is ~10KB of weight data).
- Any changes to the reweighting algorithm must be deployed to the client, not just the server.
