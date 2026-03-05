import 'dotenv/config';
import type { AIClient, AIRole, AIProvider } from './types.js';
import { AnthropicClient } from './anthropicClient.js';
import { OpenAICompatibleClient } from './openaiClient.js';

export type { AIClient, AIRole, AIProvider } from './types.js';

export function createAIClient(role: AIRole = 'decompose'): AIClient {
  const provider = (
    process.env['AI_PROVIDER'] ?? 'openai-compatible'
  ) as AIProvider;

  if (provider === 'anthropic') {
    return new AnthropicClient(role);
  }

  return new OpenAICompatibleClient(role);
}
