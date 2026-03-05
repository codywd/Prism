import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROMPTS_DIR = __dirname;

export type PromptName = 'decompose' | 'audit' | 'expand';

/**
 * Loads a prompt template from disk and interpolates {{variable}} placeholders.
 * Placeholders with no matching variable in the provided map are left unchanged.
 * This allows schema example placeholders (e.g. {{parent_claim_id}} in the
 * expand.md output schema) to survive when not provided as variables.
 */
export async function loadPrompt(
  name: PromptName,
  variables: Record<string, string>,
): Promise<string> {
  const filePath = join(PROMPTS_DIR, `${name}.md`);

  let template: string;
  try {
    template = await readFile(filePath, 'utf-8');
  } catch (cause) {
    throw new Error(`Failed to load prompt file "${name}": ${filePath}`, { cause });
  }

  return template.replace(/\{\{(\w+)\}\}/g, (_match, varName: string) => {
    return variables[varName] ?? `{{${varName}}}`;
  });
}
