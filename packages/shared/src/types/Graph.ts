import type { ClaimNode } from './ClaimNode.js';
import type { EvidenceNode } from './EvidenceNode.js';
import type { TensionNode } from './TensionNode.js';
import type { Perspective } from './Perspective.js';
import type { ValueDimension } from './ValueDimension.js';
import type { DependencyEdge } from './Edge.js';

export interface ClaimGraph {
  claims: ClaimNode[];
  edges: DependencyEdge[];
  evidence: EvidenceNode[];
  perspectives: Perspective[];
  value_dimensions: ValueDimension[];
  tensions: TensionNode[];
}
