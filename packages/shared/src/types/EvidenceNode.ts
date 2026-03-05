export enum EvidenceStrength {
  STRONG = 'STRONG',
  MODERATE = 'MODERATE',
  WEAK = 'WEAK',
  ABSENT = 'ABSENT',
}

export enum EvidenceDirection {
  SUPPORTS = 'SUPPORTS',
  OPPOSES = 'OPPOSES',
  MIXED = 'MIXED',
}

export interface EvidenceNode {
  id: string; // UUID
  claim_id: string; // UUID
  text: string;
  source_description: string;
  source_url: string | null;
  strength: EvidenceStrength;
  direction: EvidenceDirection;
  created_at: string; // ISO timestamp
}
