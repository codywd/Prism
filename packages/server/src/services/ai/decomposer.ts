import 'dotenv/config';
import { type DecompositionResponse } from '@prism/shared';
import { createAIClient } from './client.js';
import { loadPrompt } from '../../prompts/promptLoader.js';
import { parseDecompositionResponse } from '../../parsers/decompositionParser.js';

export interface DecomposeResult {
  graph: DecompositionResponse;
  idMap: Map<string, string>;
}

export async function decompose(question: string): Promise<DecomposeResult> {
  const client = createAIClient('decompose');
  const temperature = parseFloat(process.env['AI_TEMPERATURE_DECOMPOSE'] ?? '0.3');

  // The decompose prompt template includes {{question_text}} at the end.
  // Per spec: system prompt = instructions + question context; user prompt triggers response.
  const systemPrompt = await loadPrompt('decompose', { question_text: question });
  const userPrompt = 'Respond with JSON only as specified above.';

  const raw = await client.complete({ systemPrompt, userPrompt, temperature });
  const { data, idMap } = parseDecompositionResponse(raw);
  return { graph: data, idMap };
}
