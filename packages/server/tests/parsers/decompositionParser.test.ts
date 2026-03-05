import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseDecompositionResponse } from '../../src/parsers/decompositionParser.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, 'fixtures');

function fixture(name: string): string {
  return readFileSync(join(fixturesDir, name), 'utf-8');
}

describe('parseDecompositionResponse', () => {
  it('parses clean JSON successfully', () => {
    const { data } = parseDecompositionResponse(fixture('decomposition.clean.json'));
    expect(data.claims).toHaveLength(3);
    expect(data.claims[0]?.claim_type).toBe('EMPIRICAL');
    expect(data.perspectives).toHaveLength(2);
    expect(data.tensions).toHaveLength(1);
    expect(data.value_dimensions).toHaveLength(1);
    expect(data.claims[0]?.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('parses JSON wrapped in markdown fencing', () => {
    const { data } = parseDecompositionResponse(fixture('decomposition.fenced.txt'));
    expect(data.claims).toHaveLength(1);
    expect(data.perspectives).toHaveLength(1);
  });

  it('parses JSON with preamble text before it', () => {
    const { data } = parseDecompositionResponse(fixture('decomposition.preamble.txt'));
    expect(data.claims).toHaveLength(1);
    expect(data.claims[0]?.text).toContain('Remote work');
  });

  it('parses response with missing optional fields', () => {
    const { data } = parseDecompositionResponse(fixture('decomposition.missing-optional.json'));
    expect(data.claims).toHaveLength(1);
    expect(data.value_dimensions).toEqual([]);
    expect(data.tensions).toEqual([]);
  });

  it('replaces all placeholder IDs with UUIDs consistently', () => {
    const { data } = parseDecompositionResponse(fixture('decomposition.clean.json'));
    const claimId = data.claims[0]?.id;
    expect(claimId).toMatch(/^[0-9a-f-]{36}$/);
    const evidenceForClaim1 = data.evidence.find((e) => e.claim_id === claimId);
    expect(evidenceForClaim1).toBeDefined();
    const weightKeys = Object.keys(data.perspectives[0]?.claim_weights ?? {});
    expect(weightKeys[0]).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('returns the idMap for use in downstream parsers', () => {
    const { idMap } = parseDecompositionResponse(fixture('decomposition.clean.json'));
    expect(idMap.size).toBeGreaterThan(0);
    expect(idMap.has('claim_001')).toBe(true);
    expect(idMap.get('claim_001')).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('throws a structured error on completely invalid input', () => {
    expect(() => parseDecompositionResponse(fixture('decomposition.invalid.txt'))).toThrow();
  });

  it('error message includes context about the failure', () => {
    try {
      parseDecompositionResponse(fixture('decomposition.invalid.txt'));
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect((err as Error).message).toContain('decomposition');
    }
  });
});
