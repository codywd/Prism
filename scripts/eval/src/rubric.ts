import type { EvalQuestion } from './questions.js';

export interface RubricDimension {
  name: string;
  description: string;
}

export const RUBRIC_DIMENSIONS: RubricDimension[] = [
  { name: 'Perspective Diversity', description: '3+ genuinely distinct perspectives spanning different value systems' },
  { name: 'Claim Type Accuracy', description: 'Empirical, value, and definitional claims correctly labeled' },
  { name: 'Confidence Calibration', description: 'Confidence scores defensible and differentiated' },
  { name: 'Evidence Balance', description: 'Supporting AND opposing evidence present where it exists' },
  { name: 'Tension Identification', description: 'Real crux points identified, correctly typed' },
  { name: 'Steel-Manning', description: 'Each perspective presented in its strongest form' },
];

export function generateScoringTemplate(
  questions: EvalQuestion[],
  outputPaths: Map<string, string>,
  provider: string,
  promptVersion: string,
  date: string,
): string {
  const lines: string[] = [
    `# Evaluation Run — Prompt Version ${promptVersion}`,
    ``,
    `**Date:** ${date}`,
    `**Provider:** ${provider}`,
    `**Phase 1 Pass Criteria:** 8 of 10 questions average >= 4.0 across all rubric dimensions`,
    ``,
    `---`,
    ``,
  ];

  for (const q of questions) {
    const outputPath = outputPaths.get(q.id) ?? '(not generated)';
    lines.push(`## ${q.id} — ${q.category}`);
    lines.push(``);
    lines.push(`**Question:** ${q.text}`);
    lines.push(`**Output:** \`${outputPath}\``);
    lines.push(``);
    lines.push(`| Dimension | Score | Notes |`);
    lines.push(`|---|---|---|`);
    for (const dim of RUBRIC_DIMENSIONS) {
      lines.push(`| ${dim.name} | /5 | |`);
    }
    lines.push(`| **Average** | **/5** | |`);
    lines.push(``);
    lines.push(`**Qualitative Notes:**`);
    lines.push(`[2-3 sentences on specific strengths and weaknesses]`);
    lines.push(``);
    lines.push(`---`);
    lines.push(``);
  }

  return lines.join('\n');
}
