import { randomUUID } from 'crypto';

/**
 * Strips markdown fencing (```json ... ``` or ``` ... ```) from AI responses.
 * Many models add fencing despite instructions not to.
 */
export function stripMarkdownFencing(text: string): string {
  const fenced = text.match(/^```(?:json)?\r?\n?([\s\S]*?)\r?\n?```\s*$/);
  if (fenced && fenced[1] !== undefined) {
    return fenced[1].trim();
  }
  return text.trim();
}

/**
 * Finds the first `{` and last `}` in a string and returns the substring.
 * Used as a fallback when the full text fails JSON.parse (e.g., preamble text).
 * Returns null if no opening or closing brace is found.
 */
export function extractJsonSubstring(text: string): string | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    return null;
  }
  return text.slice(start, end + 1);
}

/**
 * Recursively walks an object and replaces all placeholder ID strings
 * (matching /^(claim|subclaim|evidence|perspective|tension|edge)_\d+$/i)
 * with consistent UUIDs, including when they appear as object keys
 * (e.g., in claim_weights: { "claim_001": 0.8 }).
 *
 * The same placeholder always maps to the same UUID within a single call.
 * Pass an existing idMap to maintain consistency across multiple objects
 * (e.g., decomposition result + audit result from the same pipeline run).
 *
 * Returns the transformed object AND the idMap so the caller can thread it
 * through subsequent parser calls.
 */
export function replacePlaceholderIds<T>(
  obj: T,
  idMap: Map<string, string> = new Map(),
): { data: T; idMap: Map<string, string> } {
  return { data: replaceInValue(obj, idMap), idMap };
}

function replaceInValue<T>(obj: T, idMap: Map<string, string>): T {
  if (typeof obj === 'string') {
    if (isPlaceholderId(obj)) {
      if (!idMap.has(obj)) {
        idMap.set(obj, randomUUID());
      }
      return idMap.get(obj) as unknown as T;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => replaceInValue(item, idMap)) as unknown as T;
  }

  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      let newKey = key;
      if (isPlaceholderId(key)) {
        if (!idMap.has(key)) {
          idMap.set(key, randomUUID());
        }
        newKey = idMap.get(key) as string;
      }
      result[newKey] = replaceInValue(value, idMap);
    }
    return result as T;
  }

  return obj;
}

function isPlaceholderId(value: string): boolean {
  return /^(claim|subclaim|evidence|perspective|tension|edge)_\d+$/i.test(value);
}

/**
 * Attempts to parse JSON from an AI response string, handling:
 * 1. Markdown fencing (```json ... ```)
 * 2. Preamble/postamble text around the JSON object
 *
 * Throws with full error chain if no valid JSON can be extracted.
 */
export function extractJson(raw: string): unknown {
  const stripped = stripMarkdownFencing(raw);

  let firstParseError: unknown;
  try {
    return JSON.parse(stripped);
  } catch (err) {
    firstParseError = err;
  }

  const substring = extractJsonSubstring(stripped);
  if (substring !== null) {
    try {
      return JSON.parse(substring);
    } catch (substringErr) {
      throw new Error(
        `No valid JSON found in response. Substring attempt failed on: ${substring.slice(0, 200)}`,
        { cause: substringErr },
      );
    }
  }

  throw new Error('No valid JSON found in response', { cause: firstParseError });
}
