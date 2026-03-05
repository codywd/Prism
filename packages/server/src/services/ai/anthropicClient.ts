import Anthropic from '@anthropic-ai/sdk';
import type { AIClient, AIRole } from './types.js';

const RETRY_DELAY_MS = 1000;

function getModel(role: AIRole): string {
  switch (role) {
    case 'decompose':
      return process.env['AI_DECOMPOSE_MODEL'] ?? 'claude-opus-4-6';
    case 'audit':
      return process.env['AI_AUDIT_MODEL'] ?? 'claude-sonnet-4-6';
    case 'expand':
      return process.env['AI_EXPAND_MODEL'] ?? 'claude-sonnet-4-6';
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class AnthropicClient implements AIClient {
  private readonly anthropic: Anthropic;
  private readonly role: AIRole;

  constructor(role: AIRole = 'decompose') {
    const apiKey = process.env['ANTHROPIC_API_KEY'];
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    this.anthropic = new Anthropic({ apiKey });
    this.role = role;
  }

  async complete(params: {
    systemPrompt: string;
    userPrompt: string;
    temperature: number;
    maxTokens?: number;
  }): Promise<string> {
    return this.attempt(params, 0);
  }

  private async attempt(
    params: {
      systemPrompt: string;
      userPrompt: string;
      temperature: number;
      maxTokens?: number;
    },
    attemptNumber: number,
  ): Promise<string> {
    const model = getModel(this.role);
    try {
      const response = await this.anthropic.messages.create({
        model,
        max_tokens: params.maxTokens ?? 8192,
        temperature: params.temperature,
        system: params.systemPrompt,
        messages: [{ role: 'user', content: params.userPrompt }],
      });

      const block = response.content[0];
      if (!block || block.type !== 'text') {
        throw new Error(
          `Unexpected response content type: ${block?.type ?? 'none'}`,
        );
      }

      const text = block.text;
      console.log(
        `[anthropic] model=${model} role=${this.role} responseLength=${text.length}`,
      );
      return text;
    } catch (error) {
      if (attemptNumber === 0) {
        console.warn(
          `[anthropic] model=${model} role=${this.role} attempt 1 failed, retrying in ${RETRY_DELAY_MS}ms`,
          error,
        );
        await sleep(RETRY_DELAY_MS);
        return this.attempt(params, 1);
      }
      console.error(
        `[anthropic] model=${model} role=${this.role} failed after 2 attempts`,
      );
      console.error('[anthropic] raw error:', error);
      throw error;
    }
  }
}
