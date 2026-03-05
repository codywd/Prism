export interface ValueDimension {
  id: string; // UUID
  question_id: string;
  name: string;
  description: string;
  low_label: string;
  high_label: string;
  default_value: number; // 0.0 - 1.0
}
