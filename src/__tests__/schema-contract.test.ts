// @vitest-environment node
import { describe, expect, it } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import schema from '../../contracts/xbrain-deck-v1.schema.json';
import partnership from './fixtures/deck-partnership-proposal.json';
import quarterly from './fixtures/deck-quarterly-ops-report.json';
import template from './fixtures/deck-template-as-code.json';
import { CHART_VARIANTS, COMPONENT_RENDERERS, DIAGRAM_VARIANTS, LAYOUT_CATALOG, XBrainCompiler, XB } from '../store/xbrainStore';
import { createDraftRepository } from '../store/studioControllers';

const validate = new Ajv2020({ strict: false, allErrors: true }).compile(schema);
const cover = () => ({ version: '1.0', slides: [{ type: 'cover', content: {} }] });
const composer = (component: unknown) => ({ version: '1.0', slides: [{ type: 'composer', components: [component] }] });

describe('deck schema and live registries', () => {
  it('keeps the generated schema identical to the compiler contract', () => {
    expect(XBrainCompiler.schema()).toEqual(schema);
    expect(schema.properties.version.const).toBe('1.0');
    expect(schema.$defs.chartVariant.enum).toEqual(Object.keys(CHART_VARIANTS));
    expect(schema.$defs.componentType.enum).toEqual(Object.keys(COMPONENT_RENDERERS));
    expect(schema.$defs.slide.properties.type.enum).toEqual(LAYOUT_CATALOG.filter(item => !item.custom).map(item => item.type));
    expect(schema.$defs.diagramVariant.enum).toEqual(expect.arrayContaining([
      ...Object.keys(CHART_VARIANTS), ...Object.keys(DIAGRAM_VARIANTS.flow), ...Object.keys(DIAGRAM_VARIANTS.structure),
    ]));
  });

  it.each([['built-in', XB.getDeck()], ['partnership', partnership], ['quarterly', quarterly], ['template', template]])(
    'validates and renders the %s deck', (_name, deck) => {
      expect(validate(deck), JSON.stringify(validate.errors)).toBe(true);
      const result = XBrainCompiler.compile(deck, { strict: true, trust: 'trusted' });
      expect(result.slides).toHaveLength(deck.slides.length);
      expect(result.diagnostics.filter((item: { code: string }) => item.code === 'code.compile' || item.code === 'render.exception')).toEqual([]);
    },
  );

  it.each(['0.9', '2.0', 1, null, undefined])('rejects document version %s', version => {
    expect(validate({ ...cover(), version })).toBe(false);
  });

  it.each([
    { type: 'chart', variant: 'bar', data: [{ label: 'A', value: 1 }] },
    { type: 'diagram', variant: 'flowchart', nodes: [{ id: 'a', label: 'A' }] },
    { type: 'html', html: '<b>Author</b><script>void 0</script>' },
    { type: 'link', text: 'Action', href: 'javascript:void(0)' },
  ])('accepts a valid authored component: $type', component => {
    expect(validate(composer(component)), JSON.stringify(validate.errors)).toBe(true);
  });

  it.each([
    { type: 'chart', variant: 'flowchart' },
    { type: 'chart', span: 0 },
    { type: 'table', transform: { select: ['value', 'value'] } },
    { type: 'table', transform: { limit: 2001 } },
    { type: 'card', children: {} },
  ])('rejects an invalid component: $type', component => {
    expect(validate(composer(component))).toBe(false);
  });

  it('supports custom layout groups and rejects malformed layouts', () => {
    const document = { ...cover(), layouts: { custom: { group: 'Deep-Dive', template: '<b>${c.title}</b>' } } };
    expect(validate(document), JSON.stringify(validate.errors)).toBe(true);
    expect(validate({ ...document, layouts: { custom: { group: 42, template: '' } } })).toBe(false);
    expect(validate({ ...document, layouts: { custom: { group: 'Deep-Dive' } } })).toBe(false);
  });

  it('stores and restores drafts with the v1 storage key', () => {
    const values = new Map<string, string>();
    const draft = createDraftRepository(() => ({ getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }));
    expect(draft.load()).toBeNull();
    draft.save(cover());
    expect([...values.keys()]).toEqual(['xbrain-v1-draft']);
    expect(draft.load().slides).toEqual(cover().slides);
  });

  it('synchronizes CSS scope, customCss, theme background token, and component gap in schema and contract', () => {
    const contract = XBrainCompiler.contract();
    expect(contract.cssScope).toBeDefined();
    expect(contract.cssScope.slideScopes).toEqual(['global', 'slide']);
    expect(contract.brandRules).toBeDefined();
    const docWithScopedCss = {
      version: '1.0',
      customCss: '.deck-shared { color: #425453; }',
      slideCssScope: 'slide',
      theme: { tokens: { primary: '#F97C00', teal: '#25AC9D', ink: '#425453', background: '#FFFFFF' } },
      slides: [
        {
          id: 'scoped-slide',
          type: 'composer',
          cssScope: 'slide',
          customCss: '.v1-text { font-weight: 700; }',
          components: [{ type: 'stack', gap: 16, children: [{ type: 'text', text: 'Scoped' }] }],
        },
      ],
    };
    expect(validate(docWithScopedCss), JSON.stringify(validate.errors)).toBe(true);
    expect(validate({ ...docWithScopedCss, slideCssScope: 'invalid-scope' })).toBe(false);
  });
});
