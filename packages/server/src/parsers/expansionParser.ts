import { ExpansionResponseSchema, type ExpansionResponse } from '@prism/shared';
import { extractJson, replacePlaceholderIds } from './common.js';

export function parseExpansionResponse(raw: string): ExpansionResponse {
  let parsed: unknown;
  try {
    parsed = extractJson(raw);
  } catch (cause) {
    console.error('[expansionParser] failed to extract JSON from response');
    console.error('[expansionParser] raw response:', raw);
    throw new Error('Failed to parse expansion response: no valid JSON found', { cause });
  }

  const result = ExpansionResponseSchema.safeParse(parsed);
  if (!result.success) {
    console.error('[expansionParser] Zod validation failed');
    console.error('[expansionParser] raw response:', raw);
    console.error('[expansionParser] validation errors:', JSON.stringify(result.error.issues, null, 2));
    throw new Error(
      `Failed to parse expansion response: schema validation failed — ${result.error.issues.map((i) => i.message).join(', ')}`,
    );
  }

  const { data } = replacePlaceholderIds(result.data);
  return data;
}
