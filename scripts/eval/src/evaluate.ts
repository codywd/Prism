import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { TEST_QUESTIONS } from './questions.js';
import { generateScoringTemplate } from './rubric.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, '../output');

function parseArgs(): { provider?: string; questionId?: string } {
  const args = process.argv.slice(2);
  const result: { provider?: string; questionId?: string } = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--provider' && args[i + 1]) {
      result.provider = args[i + 1];
      i++;
    }
    if (args[i] === '--question' && args[i + 1]) {
      result.questionId = args[i + 1];
      i++;
    }
  }
  return result;
}

async function main(): Promise<void> {
  const { provider: providerArg, questionId } = parseArgs();

  if (providerArg) {
    process.env['AI_PROVIDER'] = providerArg;
  }

  const provider = process.env['AI_PROVIDER'] ?? 'openai-compatible';
  const decomposeProvider = process.env['AI_DECOMPOSE_PROVIDER'] ?? provider;
  const auditProvider = process.env['AI_AUDIT_PROVIDER'] ?? provider;
  const providerLabel = decomposeProvider === auditProvider
    ? decomposeProvider
    : `${decomposeProvider}/${auditProvider}`;
  // Scores count toward Phase 1 pass/fail when decompose uses Anthropic —
  // that's the quality-critical pass. Audit/expand provider doesn't affect scoring validity.
  const scoresCount = decomposeProvider === 'anthropic';

  // Dynamic import after setting env
  const { orchestrate } = await import('@prism/server');

  const questionsToRun = questionId
    ? TEST_QUESTIONS.filter((q) => q.id === questionId)
    : TEST_QUESTIONS;

  if (questionsToRun.length === 0) {
    console.error(`Question ID "${questionId}" not found. Valid IDs: ${TEST_QUESTIONS.map((q) => q.id).join(', ')}`);
    process.exit(1);
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  console.log(`\n=== PRISM EVALUATION HARNESS ===`);
  console.log(`Provider: ${providerLabel}`);
  if (!scoresCount) {
    console.log(`WARNING: Scores from non-Anthropic decomposition do not count toward Phase 1 pass/fail.`);
  }
  console.log(`Questions: ${questionsToRun.length}`);
  console.log(`Output dir: ${OUTPUT_DIR}\n`);

  const outputPaths = new Map<string, string>();
  const results: Array<{ id: string; text: string; success: boolean; error?: string; durationMs: number }> = [];

  for (const q of questionsToRun) {
    console.log(`\n[${q.id}] ${q.text}`);
    const start = Date.now();

    try {
      const result = await orchestrate(q.text);
      const durationMs = Date.now() - start;

      const output = {
        questionId: q.id,
        questionText: q.text,
        category: q.category,
        provider: result.provider,
        timestamp,
        timings: result.timings,
        auditSkipped: result.auditSkipped,
        graphStats: {
          claims: result.graph.claims.length,
          edges: result.graph.edges.length,
          evidence: result.graph.evidence.length,
          perspectives: result.graph.perspectives.length,
          tensions: result.graph.tensions.length,
          valueDimensions: result.graph.value_dimensions.length,
        },
        auditSummary: {
          overallBalanceScore: result.auditResult.overall_balance_score,
          missingPerspectives: result.auditResult.missing_perspectives.length,
          underrepresentedEvidence: result.auditResult.underrepresented_evidence.length,
          framingIssues: result.auditResult.framing_issues.length,
        },
        fullResult: result,
      };

      const filename = `${q.id}_${timestamp}.json`;
      const outputPath = join(OUTPUT_DIR, filename);
      writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
      outputPaths.set(q.id, filename);

      console.log(`  ✓ ${q.id} — ${result.graph.claims.length} claims, ${result.graph.perspectives.length} perspectives, ${durationMs}ms`);
      results.push({ id: q.id, text: q.text, success: true, durationMs });
    } catch (err) {
      const durationMs = Date.now() - start;
      const error = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ ${q.id} FAILED: ${error}`);
      results.push({ id: q.id, text: q.text, success: false, error, durationMs });
    }
  }

  // Generate scoring template
  const date = new Date().toISOString().slice(0, 10);
  const promptVersion = '0.1';
  const scoringTemplate = generateScoringTemplate(questionsToRun, outputPaths, providerLabel, promptVersion, date);
  const scoringPath = join(OUTPUT_DIR, `scores_${timestamp}.md`);
  writeFileSync(scoringPath, scoringTemplate, 'utf-8');

  // Summary
  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const totalMs = results.reduce((sum, r) => sum + r.durationMs, 0);

  console.log(`\n=== SUMMARY ===`);
  console.log(`Completed: ${succeeded}/${questionsToRun.length}`);
  if (failed > 0) {
    console.log(`Failed: ${failed}`);
    for (const r of results.filter((r) => !r.success)) {
      console.log(`  - ${r.id}: ${r.error}`);
    }
  }
  console.log(`Total time: ${(totalMs / 1000).toFixed(1)}s`);
  console.log(`Scoring template: ${scoringPath}`);
  if (!scoresCount) {
    console.log(`\nNOTE: Set AI_DECOMPOSE_PROVIDER=anthropic for scores that count toward Phase 1 pass/fail.`);
  }
}

main().catch((err) => {
  console.error('[eval] Fatal error:', err);
  process.exit(1);
});
