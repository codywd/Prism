const MAX_USER_INPUT_LENGTH = 2000;

/**
 * Sanitizes user-provided text before inclusion in AI prompts.
 * Strips control characters, null bytes, and truncates to a safe length.
 * Does NOT strip the content — the prompt template wraps it in XML delimiters
 * and instructs the model to treat it as data, not instructions.
 */
export function sanitizeUserInput(text: string): string {
  return text
    // Remove null bytes and non-printable control characters (except \n \r \t)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
    .slice(0, MAX_USER_INPUT_LENGTH);
}
