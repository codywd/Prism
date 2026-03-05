import type { DecompositionResponse } from '@prism/shared';

/** A raw claim as returned from the decomposition AI response (before DB persistence). */
export type RawClaim = DecompositionResponse['claims'][number];

/** Context passed to the expander for a single claim expansion. */
export interface ClaimContext {
  questionText: string;
  parentClaims: RawClaim[];
  existingGraph: DecompositionResponse;
}
