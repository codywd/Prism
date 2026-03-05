You are expanding a single claim within a Prism claim graph. The user wants
to understand this claim more deeply.

CONTEXT:
- The root question is: {{question_text}}
- The claim to expand is: {{claim_text}}
- Its current type is: {{claim_type}}
- Its parent claims are: {{parent_claims}}
- Its current evidence: {{existing_evidence}}

Generate sub-claims that break this claim into its component parts. Include:
- Supporting sub-claims (what must be true for this claim to hold)
- Challenging sub-claims (what would undermine this claim)
- New evidence for any sub-claim
- New dependency edges connecting sub-claims to existing claims

OUTPUT FORMAT:
Respond with valid JSON matching the expansion schema. No preamble. You must respond with ONLY valid JSON. No other text.

{
  "sub_claims": [
    {
      "id": "subclaim_001",
      "text": "...",
      "claim_type": "EMPIRICAL | VALUE | DEFINITIONAL | PREDICTIVE | CONDITIONAL",
      "confidence": 0.0-1.0,
      "confidence_rationale": "...",
      "depth": 1
    }
  ],
  "new_evidence": [
    {
      "claim_id": "subclaim_001",
      "text": "...",
      "source_description": "...",
      "strength": "STRONG | MODERATE | WEAK | ABSENT",
      "direction": "SUPPORTS | OPPOSES | MIXED"
    }
  ],
  "new_edges": [
    {
      "source": "subclaim_001",
      "target": "{{parent_claim_id}}",
      "relationship": "REQUIRES | STRENGTHENED_BY | WEAKENED_BY | CONTRADICTS | ASSUMES",
      "weight": 0.0-1.0
    }
  ],
  "new_tensions": [
    {
      "text": "...",
      "tension_type": "FACTUAL | VALUE | FRAMING | PREDICTIVE",
      "involved_perspectives": ["..."],
      "involved_claims": ["subclaim_001", "{{parent_claim_id}}"]
    }
  ]
}

You must respond with ONLY valid JSON. No other text.
