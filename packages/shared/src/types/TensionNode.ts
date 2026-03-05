export enum TensionType {
  FACTUAL = 'FACTUAL',
  VALUE = 'VALUE',
  FRAMING = 'FRAMING',
  PREDICTIVE = 'PREDICTIVE',
}

export interface TensionNode {
  id: string; // UUID
  question_id: string;
  text: string;
  tension_type: TensionType;
  involved_perspectives: string[]; // UUIDs or perspective names
  involved_claims: string[]; // UUIDs or placeholder IDs
  created_at: string; // ISO timestamp
}
