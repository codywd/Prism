#!/usr/bin/env node
import 'dotenv/config';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { orchestrate } from './services/ai/orchestrator.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, '../../../scripts/eval/output');

async function main(): Promise<void> {
  const question = process.argv.slice(2).join(' ').trim();
  if (!question) {
    console.error('Usage: pnpm run:question "Your question here"');
    process.exit(1);
  }

  const provider = process.env['AI_PROVIDER'] ?? 'openai-compatible';
  console.log(`\n[cli] Question: ${question}`);
  console.log(`[cli] Provider: ${provider}\n`);

  const result = await orchestrate(question);

  // Build output object
  const output = {
    question,
    provider: result.provider,
    timings: result.timings,
    auditSkipped: result.auditSkipped,
    graph: {
      claimsCount: result.graph.claims.length,
      edgesCount: result.graph.edges.length,
      evidenceCount: result.graph.evidence.length,
      perspectivesCount: result.graph.perspectives.length,
      tensionsCount: result.graph.tensions.length,
      valueDimensionsCount: result.graph.value_dimensions.length,
    },
    auditSummary: {
      overallBalanceScore: result.auditResult.overall_balance_score,
      missingPerspectivesCount: result.auditResult.missing_perspectives.length,
      underrepresentedEvidenceCount: result.auditResult.underrepresented_evidence.length,
      framingIssuesCount: result.auditResult.framing_issues.length,
    },
    fullResult: result,
  };

  // Pretty-print to console
  console.log('\n=== RESULT SUMMARY ===');
  console.log(`Claims: ${output.graph.claimsCount}`);
  console.log(`Perspectives: ${output.graph.perspectivesCount}`);
  console.log(`Tensions: ${output.graph.tensionsCount}`);
  console.log(`Audit balance score: ${output.auditSummary.overallBalanceScore.toFixed(2)}`);
  console.log(`Missing perspectives: ${output.auditSummary.missingPerspectivesCount}`);
  console.log(`Total time: ${result.timings.totalMs}ms`);

  // Save to file
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const slug = question.slice(0, 40).replace(/[^a-z0-9]+/gi, '_').toLowerCase();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `${slug}_${timestamp}.json`;
  const outputPath = join(OUTPUT_DIR, filename);
  writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\n[cli] Output saved to: ${outputPath}`);
}

main().catch((err) => {
  console.error('[cli] Fatal error:', err);
  process.exit(1);
});
