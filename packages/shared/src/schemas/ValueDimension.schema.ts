import { z } from 'zod';

export const ValueDimensionSchema = z.object({
  id: z.string(),
  question_id: z.string(),
  name: z.string().min(1),
  description: z.string(),
  low_label: z.string(),
  high_label: z.string(),
  default_value: z.number().min(0).max(1),
});

export type ValueDimensionSchemaType = z.infer<typeof ValueDimensionSchema>;
