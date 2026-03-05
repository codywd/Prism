import 'dotenv/config';
import type { AIClient, AIRole, AIProvider } from './types.js';
import { AnthropicClient } from './anthropicClient.js';
import { OpenAICompatibleClient } from './openaiClient.js';

export type { AIClient, AIRole, AIProvider } from './types.js';

/**
 * Resolves the provider for a given role.
 * AI_DECOMPOSE_PROVIDER and AI_AUDIT_PROVIDER (shared for audit + expand) can
 * override AI_PROVIDER independently, enabling mixed-provider pipelines such as
 * Anthropic Opus for decomposition + Alter Sonnet for audit/expand.
 */
export function resolveProvider(role: AIRole): AIProvider {
  const base = (process.env['AI_PROVIDER'] ?? 'openai-compatible') as AIProvider;
  if (role === 'decompose') {
    return (process.env['AI_DECOMPOSE_PROVIDER'] as AIProvider | undefined) ?? base;
  }
  // audit and expand share AI_AUDIT_PROVIDER
  return (process.env['AI_AUDIT_PROVIDER'] as AIProvider | undefined) ?? base;
}

export function createAIClient(role: AIRole = 'decompose'): AIClient {
  const provider = resolveProvider(role);

  if (provider === 'anthropic') {
    return new AnthropicClient(role);
  }

  return new OpenAICompatibleClient(role);
}
