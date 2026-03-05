import { AuditResponseSchema, type AuditResponse } from '@prism/shared';
import { extractJson, replacePlaceholderIds } from './common.js';

/**
 * Parses an audit response from the AI.
 *
 * The audit prompt receives the decomposed graph serialized as JSON. If the
 * orchestrator passes the *processed* graph (with real UUIDs), the auditor
 * response will contain real UUIDs in claim_id fields and idMap is not needed.
 * If the orchestrator passes the *raw* AI output (with placeholder IDs), pass
 * the idMap from parseDecompositionResponse to maintain ID consistency.
 */
export function parseAuditResponse(raw: string, idMap?: Map<string, string>): AuditResponse {
  let parsed: unknown;
  try {
    parsed = extractJson(raw);
  } catch (cause) {
    console.error('[auditParser] failed to extract JSON from response');
    console.error('[auditParser] raw response:', raw);
    throw new Error('Failed to parse audit response: no valid JSON found', { cause });
  }

  const result = AuditResponseSchema.safeParse(parsed);
  if (!result.success) {
    console.error('[auditParser] Zod validation failed');
    console.error('[auditParser] raw response:', raw);
    console.error('[auditParser] validation errors:', JSON.stringify(result.error.issues, null, 2));
    throw new Error(
      `Failed to parse audit response: schema validation failed — ${result.error.issues.map((i) => i.message).join(', ')}`,
    );
  }

  if (idMap !== undefined) {
    const { data } = replacePlaceholderIds(result.data, idMap);
    return data;
  }

  return result.data;
}
