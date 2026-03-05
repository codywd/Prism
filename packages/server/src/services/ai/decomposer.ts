import 'dotenv/config';
import { type DecompositionResponse } from '@prism/shared';
import { createAIClient } from './client.js';
import { loadPrompt } from '../../prompts/promptLoader.js';
import { parseDecompositionResponse } from '../../parsers/decompositionParser.js';
import { sanitizeUserInput } from '../../utils/sanitize.js';

export interface DecomposeResult {
  graph: DecompositionResponse;
  idMap: Map<string, string>;
}

export async function decompose(question: string): Promise<DecomposeResult> {
  const client = createAIClient('decompose');
  const temperature = parseFloat(process.env['AI_TEMPERATURE_DECOMPOSE'] ?? '0.3');

  const safeQuestion = sanitizeUserInput(question);
  const systemPrompt = await loadPrompt('decompose', { question_text: safeQuestion });
  const userPrompt = 'Respond with JSON only as specified above.';

  const raw = await client.complete({ systemPrompt, userPrompt, temperature });
  const { data, idMap } = parseDecompositionResponse(raw);
  return { graph: data, idMap };
}
