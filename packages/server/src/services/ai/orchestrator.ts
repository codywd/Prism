import 'dotenv/config';
import { type DecompositionResponse, type AuditResponse } from '@prism/shared';
import { decompose } from './decomposer.js';
import { audit } from './auditor.js';
import { expand } from './expander.js';

export interface OrchestrateResult {
  graph: DecompositionResponse;
  auditResult: AuditResponse;
  /** True if the audit pass was skipped due to an error. Graph may be unbalanced. */
  auditSkipped: boolean;
  timings: {
    decomposeMs: number;
    auditMs: number;
    remediationMs: number;
    totalMs: number;
  };
  provider: string;
}

export async function orchestrate(question: string): Promise<OrchestrateResult> {
  const provider = process.env['AI_PROVIDER'] ?? 'openai-compatible';
  const startTotal = Date.now();

  console.log(`[orchestrator] starting decomposition — provider=${provider}`);

  // Step 1: Decompose
  const startDecompose = Date.now();
  const { graph, idMap } = await decompose(question);
  const decomposeMs = Date.now() - startDecompose;
  console.log(`[orchestrator] decompose complete — ${graph.claims.length} claims, ${decomposeMs}ms`);

  // Step 2: Audit
  const startAudit = Date.now();
  let auditResult: AuditResponse;
  let auditSkipped = false;

  try {
    auditResult = await audit(graph, idMap);
    const auditMs = Date.now() - startAudit;
    console.log(
      `[orchestrator] audit complete — balance=${auditResult.overall_balance_score.toFixed(2)}, ` +
      `missing_perspectives=${auditResult.missing_perspectives.length}, ${auditMs}ms`,
    );
  } catch (err) {
    console.warn('[orchestrator] audit failed, returning unaudited graph:', err);
    auditResult = {
      overall_balance_score: 0,
      missing_perspectives: [],
      underrepresented_evidence: [],
      framing_issues: [],
      confidence_adjustments: [],
      type_corrections: [],
    };
    auditSkipped = true;
  }

  // Step 3: Remediation — expand under-evidenced claims flagged by the audit
  const startRemediation = Date.now();
  let remediationMs = 0;

  if (!auditSkipped && auditResult.underrepresented_evidence.length > 0) {
    const claimsToExpand = auditResult.underrepresented_evidence
      .map((gap) => graph.claims.find((c) => c.id === gap.claim_id))
      .filter((c): c is DecompositionResponse['claims'][number] => c !== undefined)
      .slice(0, 3); // cap at 3 expansions per orchestration pass

    for (const claim of claimsToExpand) {
      try {
        const expansion = await expand(claim, {
          questionText: question,
          parentClaims: [],
          existingGraph: graph,
        });
        // Merge expansion results into graph
        graph.claims.push(...expansion.sub_claims);
        graph.evidence.push(...expansion.new_evidence);
        graph.edges.push(...expansion.new_edges);
        graph.tensions.push(...expansion.new_tensions);
        console.log(
          `[orchestrator] expanded claim "${claim.text.slice(0, 50)}..." — ` +
          `+${expansion.sub_claims.length} sub-claims`,
        );
      } catch (err) {
        console.warn(`[orchestrator] expansion failed for claim ${claim.id}:`, err);
      }
    }
    remediationMs = Date.now() - startRemediation;
  }

  const totalMs = Date.now() - startTotal;
  console.log(`[orchestrator] complete — total=${totalMs}ms`);

  return {
    graph,
    auditResult,
    auditSkipped,
    timings: { decomposeMs, auditMs: Date.now() - startAudit - remediationMs, remediationMs, totalMs },
    provider,
  };
}
