import { describe, it, expect } from 'vitest';
import { stripMarkdownFencing, extractJsonSubstring, replacePlaceholderIds } from '../../src/parsers/common.js';

describe('stripMarkdownFencing', () => {
  it('passes through clean JSON unchanged', () => {
    const input = '{"key": "value"}';
    expect(stripMarkdownFencing(input)).toBe(input);
  });

  it('strips ```json ... ``` fencing', () => {
    const input = '```json\n{"key": "value"}\n```';
    expect(stripMarkdownFencing(input)).toBe('{"key": "value"}');
  });

  it('strips ``` ... ``` fencing without language tag', () => {
    const input = '```\n{"key": "value"}\n```';
    expect(stripMarkdownFencing(input)).toBe('{"key": "value"}');
  });

  it('handles fencing with no trailing newline', () => {
    const input = '```json\n{"key": "value"}```';
    expect(stripMarkdownFencing(input)).toBe('{"key": "value"}');
  });

  it('trims whitespace from result', () => {
    const input = '```json\n  {"key": "value"}  \n```';
    expect(stripMarkdownFencing(input)).toBe('{"key": "value"}');
  });
});

describe('extractJsonSubstring', () => {
  it('returns null for text with no JSON object', () => {
    expect(extractJsonSubstring('no json here')).toBeNull();
  });

  it('extracts JSON from text with preamble and postamble', () => {
    const input = 'Here is your answer:\n{"key": "value"}\nThanks!';
    const extracted = extractJsonSubstring(input);
    expect(extracted).toBe('{"key": "value"}');
  });

  it('extracts nested JSON correctly', () => {
    const input = 'Result: {"outer": {"inner": 1}, "arr": [1, 2]}';
    const extracted = extractJsonSubstring(input);
    expect(extracted).not.toBeNull();
    expect(JSON.parse(extracted!)).toEqual({ outer: { inner: 1 }, arr: [1, 2] });
  });

  it('returns null when there is no closing brace', () => {
    const input = 'broken: {"key": "value"';
    const extracted = extractJsonSubstring(input);
    expect(extracted).toBeNull();
  });

  it('returns the full JSON when input is already pure JSON', () => {
    const input = '{"claims": [], "edges": []}';
    const extracted = extractJsonSubstring(input);
    expect(extracted).toBe(input);
  });
});

describe('replacePlaceholderIds', () => {
  it('replaces claim_NNN placeholders with UUIDs', () => {
    const input = { id: 'claim_001', text: 'Test' };
    const { data } = replacePlaceholderIds(input);
    expect(data.id).not.toBe('claim_001');
    expect(data.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('replaces nested placeholder IDs', () => {
    const input = {
      claims: [{ id: 'claim_001' }],
      edges: [{ source: 'claim_001', target: 'claim_002' }],
    };
    const { data } = replacePlaceholderIds(input);
    const uuid = data.claims[0]?.id as string;
    expect(uuid).toMatch(/^[0-9a-f-]{36}$/);
    expect(data.edges[0]?.source).toBe(uuid);
  });

  it('produces consistent mapping across the object', () => {
    const input = { a: 'claim_001', b: 'claim_001', c: 'claim_002' };
    const { data } = replacePlaceholderIds(input);
    expect(data.a).toBe(data.b);
    expect(data.a).not.toBe(data.c);
  });

  it('leaves non-placeholder strings unchanged', () => {
    const input = { text: 'This is a claim about something', id: 'claim_001' };
    const { data } = replacePlaceholderIds(input);
    expect(data.text).toBe('This is a claim about something');
  });
});

describe('replacePlaceholderIds (with idMap return)', () => {
  it('returns the idMap alongside the transformed data', () => {
    const input = { id: 'claim_001', text: 'Test' };
    const { data, idMap } = replacePlaceholderIds(input);
    expect(idMap.has('claim_001')).toBe(true);
    expect(data.id).toBe(idMap.get('claim_001'));
  });

  it('replaces placeholder IDs used as object keys (e.g., claim_weights)', () => {
    const input = { claim_weights: { 'claim_001': 0.8, 'claim_002': 0.5 } };
    const { data, idMap } = replacePlaceholderIds(input);
    const keys = Object.keys(data.claim_weights);
    expect(keys[0]).toMatch(/^[0-9a-f-]{36}$/);
    expect(keys[1]).toMatch(/^[0-9a-f-]{36}$/);
    expect(keys[0]).toBe(idMap.get('claim_001'));
    expect(keys[1]).toBe(idMap.get('claim_002'));
  });

  it('uses a shared idMap to produce consistent IDs across two objects', () => {
    const first = { id: 'claim_001' };
    const { idMap } = replacePlaceholderIds(first);
    const second = { claim_id: 'claim_001' };
    const { data: secondData } = replacePlaceholderIds(second, idMap);
    expect(secondData.claim_id).toBe(idMap.get('claim_001'));
  });
});
