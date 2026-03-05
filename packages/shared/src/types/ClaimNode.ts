export enum ClaimType {
  EMPIRICAL = 'EMPIRICAL',
  VALUE = 'VALUE',
  DEFINITIONAL = 'DEFINITIONAL',
  PREDICTIVE = 'PREDICTIVE',
  CONDITIONAL = 'CONDITIONAL',
}

export enum SourcePass {
  INITIAL = 'INITIAL',
  EXPANSION = 'EXPANSION',
  AUDIT = 'AUDIT',
  USER = 'USER',
}

export interface ClaimNode {
  id: string; // UUID
  question_id: string; // UUID
  text: string;
  claim_type: ClaimType;
  confidence: number; // 0.0 - 1.0
  confidence_rationale: string;
  depth: number;
  is_expanded: boolean;
  created_at: string; // ISO timestamp
  source_pass: SourcePass;
}
