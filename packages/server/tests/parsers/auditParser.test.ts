import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseAuditResponse } from '../../src/parsers/auditParser.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, 'fixtures');

function fixture(name: string): string {
  return readFileSync(join(fixturesDir, name), 'utf-8');
}

describe('parseAuditResponse', () => {
  it('parses clean JSON successfully', () => {
    const result = parseAuditResponse(fixture('audit.clean.json'));
    expect(result.overall_balance_score).toBe(0.72);
    expect(result.missing_perspectives).toHaveLength(1);
    expect(result.underrepresented_evidence).toHaveLength(1);
    expect(result.framing_issues).toHaveLength(1);
    expect(result.confidence_adjustments).toHaveLength(1);
    expect(result.type_corrections).toHaveLength(0);
  });

  it('parses JSON wrapped in markdown fencing', () => {
    const result = parseAuditResponse(fixture('audit.fenced.txt'));
    expect(result.overall_balance_score).toBe(0.55);
    expect(result.type_corrections).toHaveLength(1);
    expect(result.type_corrections[0]?.suggested_type).toBe('VALUE');
  });

  it('parses response with only required fields (all arrays default to empty)', () => {
    const result = parseAuditResponse(fixture('audit.missing-optional.json'));
    expect(result.overall_balance_score).toBe(0.8);
    expect(result.missing_perspectives).toEqual([]);
    expect(result.underrepresented_evidence).toEqual([]);
    expect(result.framing_issues).toEqual([]);
    expect(result.confidence_adjustments).toEqual([]);
    expect(result.type_corrections).toEqual([]);
  });

  it('throws a structured error on completely invalid input', () => {
    expect(() => parseAuditResponse(fixture('audit.invalid.txt'))).toThrow();
  });

  it('error message includes context about the failure', () => {
    try {
      parseAuditResponse(fixture('audit.invalid.txt'));
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect((err as Error).message).toContain('audit');
    }
  });
});
