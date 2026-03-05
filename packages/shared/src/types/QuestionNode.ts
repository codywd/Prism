export interface QuestionNode {
  id: string; // UUID
  text: string;
  normalized_text: string;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  decomposition_version: number;
}
