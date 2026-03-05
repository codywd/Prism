import { z } from 'zod';
import { ClaimType } from '../types/ClaimNode.js';
import { EvidenceStrength, EvidenceDirection } from '../types/EvidenceNode.js';
import { TensionType } from '../types/TensionNode.js';
import { RelationshipType } from '../types/Edge.js';

// .catch() fallbacks handle local models that occasionally use the wrong enum value
// (e.g., mixing up claim_type and tension_type names). Anthropic models won't need this.
const claimTypeCoerced = z.nativeEnum(ClaimType).catch(ClaimType.EMPIRICAL);
const tensionTypeCoerced = z.nativeEnum(TensionType).catch(TensionType.FACTUAL);
const evidenceStrengthCoerced = z.nativeEnum(EvidenceStrength).catch(EvidenceStrength.MODERATE);
const evidenceDirectionCoerced = z.nativeEnum(EvidenceDirection).catch(EvidenceDirection.SUPPORTS);
const relationshipTypeCoerced = z.nativeEnum(RelationshipType).catch(RelationshipType.REQUIRES);

// What the AI returns (before server post-processing)
export const DecompositionResponseSchema = z.object({
  claims: z.array(z.object({
    id: z.string(),
    text: z.string().min(1),
    claim_type: claimTypeCoerced,
    confidence: z.number().min(0).max(1),
    confidence_rationale: z.string(),
    depth: z.number().int().min(0).default(0),
  })),
  edges: z.array(z.object({
    source: z.string(), // placeholder ID
    target: z.string(), // placeholder ID
    relationship: relationshipTypeCoerced,
    weight: z.number().min(0).max(1).default(0.5),
  })),
  evidence: z.array(z.object({
    claim_id: z.string(),
    text: z.string().min(1),
    source_description: z.string(),
    source_url: z.string().nullable().optional(),
    strength: evidenceStrengthCoerced,
    direction: evidenceDirectionCoerced,
  })),
  perspectives: z.array(z.object({
    name: z.string().min(1),
    short_description: z.string(),
    long_description: z.string(),
    claim_weights: z.record(z.string(), z.number().min(0).max(1)),
  })),
  value_dimensions: z.array(z.object({
    name: z.string().min(1),
    description: z.string(),
    low_label: z.string(),
    high_label: z.string(),
  })).optional().default([]),
  tensions: z.array(z.object({
    text: z.string().min(1),
    tension_type: tensionTypeCoerced,
    involved_perspectives: z.array(z.string()),
    involved_claims: z.array(z.string()),
  })).optional().default([]),
});

export type DecompositionResponse = z.infer<typeof DecompositionResponseSchema>;

export const AuditResponseSchema = z.object({
  overall_balance_score: z.number().min(0).max(1),
  missing_perspectives: z.array(z.object({
    name: z.string(),
    description: z.string(),
    why_missing_matters: z.string(),
  })).default([]),
  underrepresented_evidence: z.array(z.object({
    claim_id: z.string(),
    gap: z.string(),
    suggested_evidence: z.string(),
  })).default([]),
  framing_issues: z.array(z.object({
    description: z.string(),
    suggested_reframe: z.string(),
  })).default([]),
  confidence_adjustments: z.array(z.object({
    claim_id: z.string(),
    current: z.number().min(0).max(1),
    suggested: z.number().min(0).max(1),
    rationale: z.string(),
  })).default([]),
  type_corrections: z.array(z.object({
    claim_id: z.string(),
    current_type: z.string(),
    suggested_type: z.string(),
    rationale: z.string(),
  })).default([]),
});

export type AuditResponse = z.infer<typeof AuditResponseSchema>;

export const ExpansionResponseSchema = z.object({
  sub_claims: z.array(z.object({
    id: z.string(),
    text: z.string().min(1),
    claim_type: claimTypeCoerced,
    confidence: z.number().min(0).max(1),
    confidence_rationale: z.string(),
    depth: z.number().int().min(0),
  })),
  new_evidence: z.array(z.object({
    claim_id: z.string(),
    text: z.string().min(1),
    source_description: z.string(),
    source_url: z.string().nullable().optional(),
    strength: evidenceStrengthCoerced,
    direction: evidenceDirectionCoerced,
  })).default([]),
  new_edges: z.array(z.object({
    source: z.string(),
    target: z.string(),
    relationship: relationshipTypeCoerced,
    weight: z.number().min(0).max(1).default(0.5),
  })).default([]),
  new_tensions: z.array(z.object({
    text: z.string().min(1),
    tension_type: tensionTypeCoerced,
    involved_perspectives: z.array(z.string()),
    involved_claims: z.array(z.string()),
  })).default([]),
});

export type ExpansionResponse = z.infer<typeof ExpansionResponseSchema>;
