// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { XBrainCompiler } from '../store/xbrainStore';
import deck from './fixtures/qbr-deck.json';
import badVersion from './fixtures/bad-version.json';
import edgeCases from './fixtures/edge-cases.json';
import { XBRAIN_EMBEDDED_CSS, XBRAIN_SVG_SPRITE } from '../lib/xbrainAssets';

const composer = (...components: unknown[]) => ({ version: '1.0', slides: [{ type: 'composer', title: 'Test', components }] });
const codes = (result: { diagnostics: ({ code: string } | null)[] }) => result.diagnostics.map(item => item?.code);

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

  it('reports the real edge-case deck problems and repairs idempotently', () => {
    const before = XBrainCompiler.qa(edgeCases, { strict: true });
    expect(before.ok).toBe(false);
    expect(codes(before)).toEqual(expect.arrayContaining([
      'schema.invalid', 'data.unknown-ref', 'data.missing', 'data.non-numeric',
      'graph.cycle', 'graph.dangling-edge', 'layout.overflow', 'layout.out-of-bounds',
    ]));
    const repaired = XBrainCompiler.repair(edgeCases, { strict: true });
    expect(repaired.changes.length).toBeGreaterThan(0);
    expect(codes(repaired)).not.toContain('schema.invalid');
    expect(XBrainCompiler.repair(repaired.document, { strict: true }).document).toEqual(repaired.document);
  });

  it('does not silently create sample values or graph edges in strict mode', () => {
    const result = XBrainCompiler.compile(composer(
      { type: 'chart', variant: 'bar' },
      { type: 'diagram', variant: 'network', nodes: ['A', 'B', 'C'] },
    ), { strict: true });
    expect(codes(result)).toEqual(expect.arrayContaining(['data.missing', 'graph.edges-missing']));
    expect(result.slides[0].html).toContain('No data');
    expect(result.slides[0].html).not.toContain('data-edge');
  });

  it('renders negative bars below zero with proportional geometry', () => {
    const data = [{ label: 'a', value: 10 }, { label: 'b', value: 25 }, { label: 'c', value: 40 }, { label: 'd', value: -15 }];
    const html = XBrainCompiler.compile(composer({ type: 'chart', variant: 'bar', data })).slides[0].html;
    const bars = [...html.matchAll(/<rect[^>]*data-mark="bar"[^>]*>/g)].map(([tag]) => {
      const attribute = (name: string) => Number(tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1]);
      return { value: attribute('data-v'), height: attribute('height'), y: attribute('y') };
    });
    expect(bars.map(item => item.value)).toEqual([10, 25, 40, -15]);
    const ratios = bars.map(item => item.height / Math.abs(item.value));
    expect(Math.max(...ratios) / Math.min(...ratios) - 1).toBeLessThan(0.005);
    expect(bars[3].y).toBeCloseTo(bars[0].y + bars[0].height, 0);
  });

  it('preserves every list item through pagination and repeated repair', () => {
    const items = Array.from({ length: 31 }, (_, index) => `Item ${index}: nội dung cần giữ nguyên`);
    const original = composer({ type: 'card', span: 12, children: [{ type: 'list', items }] });
    const repaired = XBrainCompiler.repair(original);
    expect(repaired.document.slides.length).toBeGreaterThan(1);
    const actual = repaired.document.slides.flatMap((slide: any) => slide.components.flatMap((component: any) => component.children.flatMap((child: any) => child.items)));
    expect(actual).toEqual(items);
    expect(XBrainCompiler.repair(repaired.document).document).toEqual(repaired.document);
  });

  it('keeps transformed table errors visible during repair', () => {
    const original = composer({ type: 'table', span: 12,
      data: Array.from({ length: 30 }, (_, index) => ({ label: String(index), value: index })),
      transform: { derive: { bad: { op: 'divide', args: [1, 0] } } },
    });
    const repaired = XBrainCompiler.repair(original);
    expect(repaired.ok).toBe(false);
    expect(codes(repaired)).toContain('data.derive');
    expect(repaired.document.slides[0].components[0].transform).toBeDefined();
  });

  it.each(['constructor', 'toString', '__proto__'])('does not resolve %s as a dataset', name => {
    const result = XBrainCompiler.compile(composer({ type: 'chart', dataRef: name }));
    expect(codes(result)).toContain('data.unknown-ref');
  });

  it('requires external datasets to include a snapshot for deterministic compilation', () => {
    const document = { ...composer({ type: 'table', dataRef: 'remote' }), datasets: { remote: { type: 'json', url: 'https://example.test/data.json' } } };
    expect(codes(XBrainCompiler.compile(document))).toContain('determinism.external-missing');
    const snapshot = { ...document, datasets: { remote: { ...document.datasets.remote, value: '[{"label":"Real","value":42}]' } } };
    const compiled = XBrainCompiler.compile(snapshot);
    expect(codes(compiled)).not.toContain('determinism.external-missing');
    expect(compiled.slides[0].html).toContain('>Real</td>');
  });

  it('creates byte-identical standalone pages with embedded shared assets', () => {
    const page = () => XBrainCompiler.staticPage(XBrainCompiler.compile(deck), { css: XBRAIN_EMBEDDED_CSS, sprite: XBRAIN_SVG_SPRITE });
    const first = page();
    expect(page()).toBe(first);
    expect(first.match(/class="xb-page"/g)).toHaveLength(deck.slides.length);
    expect(first).toContain('id="xbrain-logo-primary"');
    expect(first).not.toContain('<script');
  });
});
