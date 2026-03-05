import { DecompositionResponseSchema, type DecompositionResponse } from '@prism/shared';
import { extractJson, replacePlaceholderIds } from './common.js';

export interface DecompositionParseResult {
  data: DecompositionResponse;
  /** ID map from placeholder -> UUID. Pass to auditParser if the audit prompt
   * receives placeholder IDs (i.e., raw AI output rather than processed graph). */
  idMap: Map<string, string>;
}

export function parseDecompositionResponse(raw: string): DecompositionParseResult {
  let parsed: unknown;
  try {
    parsed = extractJson(raw);
  } catch (cause) {
    console.error('[decompositionParser] failed to extract JSON from response');
    console.error('[decompositionParser] raw response:', raw);
    throw new Error('Failed to parse decomposition response: no valid JSON found', { cause });
  }

  const result = DecompositionResponseSchema.safeParse(parsed);
  if (!result.success) {
    console.error('[decompositionParser] Zod validation failed');
    console.error('[decompositionParser] raw response:', raw);
    console.error('[decompositionParser] validation errors:', JSON.stringify(result.error.issues, null, 2));
    throw new Error(
      `Failed to parse decomposition response: schema validation failed — ${result.error.issues.map((i) => i.message).join(', ')}`,
    );
  }

  const { data, idMap } = replacePlaceholderIds(result.data);
  return { data, idMap };
}
