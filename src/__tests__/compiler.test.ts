// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { XBrainCompiler } from '../store/xbrainStore';
import deck from './fixtures/qbr-deck.json';
import badVersion from './fixtures/bad-version.json';

describe('compiler on authored decks', () => {
  it('compiles the QBR deck without errors or warnings', () => {
    const result = XBrainCompiler.compile(deck, { strict: true, trust: 'trusted' });
    expect(result.summary.errors).toBe(0);
    expect(result.summary.warnings).toBe(0);
    expect(result.slides).toHaveLength(deck.slides.length);
  });

  it('rejects an unsupported version without modifying the document', () => {
    const original = structuredClone(badVersion);
    const result = XBrainCompiler.compile(badVersion, { strict: true, trust: 'trusted' });
    expect(result.ok).toBe(false);
    expect(result.diagnostics.some((item: { code: string }) => item.code === 'version.unsupported')).toBe(true);
    expect(result.slides).toHaveLength(0);
    expect(badVersion).toEqual(original);
  });
});
