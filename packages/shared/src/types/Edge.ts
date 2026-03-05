export enum RelationshipType {
  REQUIRES = 'REQUIRES',
  STRENGTHENED_BY = 'STRENGTHENED_BY',
  WEAKENED_BY = 'WEAKENED_BY',
  CONTRADICTS = 'CONTRADICTS',
  ASSUMES = 'ASSUMES',
}

export interface DependencyEdge {
  id: string; // UUID
  source_claim_id: string; // placeholder ID or UUID
  target_claim_id: string; // placeholder ID or UUID
  relationship: RelationshipType;
  weight: number; // 0.0 - 1.0
}

export interface PerspectiveWeight {
  perspective_id: string;
  claim_id: string;
  weight: number; // 0.0 - 1.0
  rationale: string;
}
