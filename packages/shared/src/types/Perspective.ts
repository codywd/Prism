export interface Perspective {
  id: string; // UUID
  question_id: string;
  name: string;
  short_description: string;
  long_description: string;
  value_weights: Record<string, number>; // dimension name -> weight 0.0-1.0
  claim_weights: Record<string, number>; // claim id/placeholder -> weight 0.0-1.0
  is_system_generated: boolean;
  created_at: string; // ISO timestamp
}
