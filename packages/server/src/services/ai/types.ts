export interface AIClient {
  complete(params: {
    systemPrompt: string;
    userPrompt: string;
    temperature: number;
    maxTokens?: number;
  }): Promise<string>;
}

export type AIProvider = 'anthropic' | 'openai-compatible';

export type AIRole = 'decompose' | 'audit' | 'expand';
