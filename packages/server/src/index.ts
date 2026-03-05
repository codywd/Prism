// Server entry point - expand in Phase 2
export { createAIClient } from './services/ai/client.js';
export type { AIClient, AIRole, AIProvider } from './services/ai/types.js';
export { orchestrate } from './services/ai/orchestrator.js';
export type { OrchestrateResult } from './services/ai/orchestrator.js';
export { decompose } from './services/ai/decomposer.js';
export { audit } from './services/ai/auditor.js';
export { expand } from './services/ai/expander.js';
