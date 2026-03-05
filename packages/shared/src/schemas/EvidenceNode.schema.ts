import { z } from 'zod';
import { EvidenceStrength, EvidenceDirection } from '../types/EvidenceNode.js';

export const EvidenceStrengthSchema = z.nativeEnum(EvidenceStrength);
export const EvidenceDirectionSchema = z.nativeEnum(EvidenceDirection);

export const EvidenceNodeSchema = z.object({
  id: z.string(),
  claim_id: z.string(),
  text: z.string().min(1),
  source_description: z.string(),
  source_url: z.string().nullable(),
  strength: EvidenceStrengthSchema,
  direction: EvidenceDirectionSchema,
  created_at: z.string(),
});

export type EvidenceNodeSchemaType = z.infer<typeof EvidenceNodeSchema>;
