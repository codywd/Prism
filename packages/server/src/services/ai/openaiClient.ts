import OpenAI from 'openai';
import type { AIClient } from './types.js';

const RETRY_DELAY_MS = 1000;
const DEFAULT_MAX_TOKENS = 4096;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class OpenAICompatibleClient implements AIClient {
  private readonly openai: OpenAI;
  private readonly model: string;

  constructor() {
    const baseURL =
      process.env['OPENAI_COMPATIBLE_BASE_URL'] ?? 'http://localhost:1234/v1';
    const apiKey = process.env['OPENAI_COMPATIBLE_API_KEY'] ?? 'lm-studio';
    const model = process.env['OPENAI_COMPATIBLE_MODEL'];
    if (!model) {
      throw new Error(
        'OPENAI_COMPATIBLE_MODEL environment variable is required',
      );
    }
    this.model = model;
    this.openai = new OpenAI({ baseURL, apiKey });
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
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        max_tokens: params.maxTokens ?? DEFAULT_MAX_TOKENS,
        temperature: params.temperature,
        messages: [
          { role: 'system', content: params.systemPrompt },
          { role: 'user', content: params.userPrompt },
        ],
      });

      const choice = response.choices[0];
      if (!choice) {
        throw new Error('No choices in response');
      }

      // Detect truncation before attempting to parse — gives a clear error
      // instead of a cryptic JSON parse failure.
      if (choice.finish_reason === 'length') {
        const tokenLimit = params.maxTokens ?? DEFAULT_MAX_TOKENS;
        throw new Error(
          `Response truncated at token limit (${tokenLimit}). ` +
          `Try increasing maxTokens or reducing prompt size. ` +
          `Partial response (${(choice.message.content ?? '').length} chars): ` +
          `${(choice.message.content ?? '').slice(0, 200)}...`,
        );
      }

      const text = choice.message.content;
      if (!text) {
        throw new Error('Empty message content in response');
      }

      console.log(
        `[openai-compatible] model=${this.model} responseLength=${text.length} finish_reason=${choice.finish_reason ?? 'unknown'}`,
      );
      return text;
    } catch (error) {
      if (attemptNumber === 0) {
        console.warn(
          `[openai-compatible] model=${this.model} attempt 1 failed, retrying in ${RETRY_DELAY_MS}ms`,
          error,
        );
        await sleep(RETRY_DELAY_MS);
        return this.attempt(params, 1);
      }
      console.error(
        `[openai-compatible] model=${this.model} failed after 2 attempts`,
      );
      console.error('[openai-compatible] raw error:', error);
      throw error;
    }
  }
}
