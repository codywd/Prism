import { z } from 'zod';
import { TensionType } from '../types/TensionNode.js';

export const TensionTypeSchema = z.nativeEnum(TensionType);

export const TensionNodeSchema = z.object({
  id: z.string(),
  question_id: z.string(),
  text: z.string().min(1),
  tension_type: TensionTypeSchema,
  involved_perspectives: z.array(z.string()),
  involved_claims: z.array(z.string()),
  created_at: z.string(),
});

export type TensionNodeSchemaType = z.infer<typeof TensionNodeSchema>;
