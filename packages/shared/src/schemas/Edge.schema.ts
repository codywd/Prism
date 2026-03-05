import { z } from 'zod';
import { RelationshipType } from '../types/Edge.js';

export const RelationshipTypeSchema = z.nativeEnum(RelationshipType);

export const DependencyEdgeSchema = z.object({
  id: z.string(),
  source_claim_id: z.string(),
  target_claim_id: z.string(),
  relationship: RelationshipTypeSchema,
  weight: z.number().min(0).max(1),
});

export const PerspectiveWeightSchema = z.object({
  perspective_id: z.string(),
  claim_id: z.string(),
  weight: z.number().min(0).max(1),
  rationale: z.string(),
});

export type DependencyEdgeSchemaType = z.infer<typeof DependencyEdgeSchema>;
export type PerspectiveWeightSchemaType = z.infer<typeof PerspectiveWeightSchema>;
