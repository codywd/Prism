import { z } from 'zod';

export const PerspectiveSchema = z.object({
  id: z.string(),
  question_id: z.string(),
  name: z.string().min(1),
  short_description: z.string(),
  long_description: z.string(),
  value_weights: z.record(z.string(), z.number().min(0).max(1)),
  claim_weights: z.record(z.string(), z.number().min(0).max(1)),
  is_system_generated: z.boolean(),
  created_at: z.string(),
});

export type PerspectiveSchemaType = z.infer<typeof PerspectiveSchema>;
