import 'dotenv/config';
import { type ExpansionResponse } from '@prism/shared';
import { createAIClient } from './client.js';
import { loadPrompt } from '../../prompts/promptLoader.js';
import { parseExpansionResponse } from '../../parsers/expansionParser.js';
import { sanitizeUserInput } from '../../utils/sanitize.js';
import type { RawClaim, ClaimContext } from '../../types/index.js';

export async function expand(claim: RawClaim, context: ClaimContext): Promise<ExpansionResponse> {
  const client = createAIClient('expand');
  const temperature = parseFloat(process.env['AI_TEMPERATURE_EXPAND'] ?? '0.3');

  const parentClaimsText = context.parentClaims.length > 0
    ? context.parentClaims.map((c) => `- ${c.text}`).join('\n')
    : 'None (this is a root claim)';

  const existingEvidence = context.existingGraph.evidence
    .filter((e) => e.claim_id === claim.id)
    .map((e) => `- [${e.direction}/${e.strength}] ${e.text}`)
    .join('\n') || 'None';

  const systemPrompt = await loadPrompt('expand', {
    question_text: sanitizeUserInput(context.questionText),
    claim_text: sanitizeUserInput(claim.text),
    claim_type: claim.claim_type,
    parent_claims: parentClaimsText,
    existing_evidence: existingEvidence,
    parent_claim_id: claim.id,
  });
  const userPrompt = 'Respond with JSON only as specified above.';

  const raw = await client.complete({ systemPrompt, userPrompt, temperature, maxTokens: 4096 });
  return parseExpansionResponse(raw);
}
