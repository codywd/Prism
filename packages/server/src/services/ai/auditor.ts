import 'dotenv/config';
import { type AuditResponse, type DecompositionResponse } from '@prism/shared';
import { createAIClient } from './client.js';
import { loadPrompt } from '../../prompts/promptLoader.js';
import { parseAuditResponse } from '../../parsers/auditParser.js';

export async function audit(
  graph: DecompositionResponse,
  idMap?: Map<string, string>,
): Promise<AuditResponse> {
  const client = createAIClient('audit');
  const temperature = parseFloat(process.env['AI_TEMPERATURE_AUDIT'] ?? '0.2');

  // Serialize the processed graph (with real UUIDs) so the auditor's response
  // will reference real UUIDs, not placeholder IDs.
  const graphJson = JSON.stringify(graph, null, 2);
  const systemPrompt = await loadPrompt('audit', { graph_json: graphJson });
  const userPrompt = 'Respond with JSON only as specified above.';

  const raw = await client.complete({ systemPrompt, userPrompt, temperature });
  return parseAuditResponse(raw, idMap);
}
