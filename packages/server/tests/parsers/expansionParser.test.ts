import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseExpansionResponse } from '../../src/parsers/expansionParser.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, 'fixtures');

function fixture(name: string): string {
  return readFileSync(join(fixturesDir, name), 'utf-8');
}

describe('parseExpansionResponse', () => {
  it('parses clean JSON successfully', () => {
    const result = parseExpansionResponse(fixture('expansion.clean.json'));
    expect(result.sub_claims).toHaveLength(2);
    expect(result.sub_claims[0]?.claim_type).toBe('EMPIRICAL');
    expect(result.new_evidence).toHaveLength(1);
    expect(result.new_edges).toHaveLength(2);
    expect(result.new_tensions).toHaveLength(0);
    expect(result.sub_claims[0]?.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('parses JSON wrapped in markdown fencing', () => {
    const result = parseExpansionResponse(fixture('expansion.fenced.txt'));
    expect(result.sub_claims).toHaveLength(1);
    expect(result.sub_claims[0]?.text).toContain('capital costs');
  });

  it('parses response with missing optional arrays', () => {
    const result = parseExpansionResponse(fixture('expansion.missing-optional.json'));
    expect(result.sub_claims).toHaveLength(1);
    expect(result.new_evidence).toEqual([]);
    expect(result.new_edges).toEqual([]);
    expect(result.new_tensions).toEqual([]);
  });

  it('replaces placeholder IDs with UUIDs consistently', () => {
    const result = parseExpansionResponse(fixture('expansion.clean.json'));
    const subClaimId = result.sub_claims[0]?.id;
    expect(subClaimId).toMatch(/^[0-9a-f-]{36}$/);
    const edgeSource = result.new_edges[0]?.source;
    expect(edgeSource).toBe(subClaimId);
  });

  it('throws a structured error on completely invalid input', () => {
    expect(() => parseExpansionResponse(fixture('expansion.invalid.txt'))).toThrow();
  });

  it('error message includes context about the failure', () => {
    try {
      parseExpansionResponse(fixture('expansion.invalid.txt'));
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect((err as Error).message).toContain('expansion');
    }
  });
});
