import { z } from 'zod';
import { ClaimType, SourcePass } from '../types/ClaimNode.js';

export const ClaimTypeSchema = z.nativeEnum(ClaimType);
export const SourcePassSchema = z.nativeEnum(SourcePass);

export const ClaimNodeSchema = z.object({
  id: z.string(),
  question_id: z.string(),
  text: z.string().min(1),
  claim_type: ClaimTypeSchema,
  confidence: z.number().min(0).max(1),
  confidence_rationale: z.string(),
  depth: z.number().int().min(0),
  is_expanded: z.boolean(),
  created_at: z.string(),
  source_pass: SourcePassSchema,
});

export type ClaimNodeSchemaType = z.infer<typeof ClaimNodeSchema>;
