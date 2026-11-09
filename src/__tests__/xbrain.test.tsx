// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act, renderHook, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import XB_SCHEMA_BASE from '../../contracts/xbrain-deck-v1.schema.json';
import {
  XBrainCompiler,
  XB,
  DataResolver,
  LAYOUT_CATALOG,
  CHART_VARIANTS,
  DIAGRAM_VARIANTS,
  COMPONENT_RENDERERS,
  SLIDE_RENDERERS,
  DIAGRAM_RENDERERS,
  xbSolveGrid,
} from '../store/xbrainStore';
import { XBDiag, XBText, deckFmt, escapeHtml } from '../utils/textAndFormat';
import {
  normalizeSlideGroup,
  formatGroupBadge,
  getGroupBadgeClass,
  getDeckGroupsForSlides,
  matchesGroupFilter,
  groupSlidesByGroup,
  UNGROUPED_FILTER_KEY,
  GROUPED_VIEW_KEY,
} from '../utils/slideGroup';
import { DeckModel } from '../core/deckModel';
import { BRAND_PHOTOS, XBRAIN_LOGOS, XBRAIN_EMBEDDED_CSS, XBRAIN_SVG_SPRITE } from '../lib/xbrainAssets';
import { useXBrainEngine } from '../hooks/useXBrainEngine';
import App from '../App';

describe('XBrain Presentation Engine, JSON Schema Contract & React Suite', () => {
  beforeEach(() => {
    cleanup();
  });

  it('imports contracts/xbrain-deck-v1.schema.json directly as a JSON module', () => {
    expect(XB_SCHEMA_BASE).toBeDefined();
    expect(XB_SCHEMA_BASE.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
    expect(XB_SCHEMA_BASE.$id).toBe('urn:xbrain:presentation:deck:1.0');
    expect(XB_SCHEMA_BASE.properties.version.const).toBe('1.0');
    const liveSchema = XBrainCompiler.schema();
    expect(XB_SCHEMA_BASE).toEqual(liveSchema);
  });

  it('loads all 107 default slides and 48 layout templates in catalog', () => {
    const allSlides = XB.slides();
    expect(allSlides.length).toBe(107);
    expect(LAYOUT_CATALOG.length).toBe(48);
    expect(Object.keys(SLIDE_RENDERERS).length).toBe(16);
    expect(Object.keys(DIAGRAM_RENDERERS).length).toBe(30);
    expect(Object.keys(CHART_VARIANTS).length).toBeGreaterThanOrEqual(25);
    expect(Object.keys(DIAGRAM_VARIANTS.flow).length).toBeGreaterThanOrEqual(20);
    expect(Object.keys(DIAGRAM_VARIANTS.structure).length).toBeGreaterThanOrEqual(20);
    expect(Object.keys(COMPONENT_RENDERERS).length).toBeGreaterThanOrEqual(18);
  });

  it('validates the default 107-slide deck with zero errors', () => {
    const deckDoc = XB.getDeck();
    const report = XBrainCompiler.validate(deckDoc, { strict: true });
    expect(report.ok).toBe(true);
  });

  it('tests extracted diagnosticsAndText and slideGroupUtils modules', () => {
    expect(escapeHtml('<script>"test"</script>')).toBe('&lt;script&gt;&quot;test&quot;&lt;/script&gt;');
    expect(deckFmt(1234.5)).toBe('1,235');
    expect(deckFmt(1234.5, { decimals: 1 })).toBe('1,234.5');
    expect(XBText.width('XBrain CloudOps', 20, 700)).toBeGreaterThan(100);
    const diagResult = XBDiag.collect(() => {
      XBDiag.report('test.code', 'warning', 'Test warning');
      return 42;
    });
    expect(diagResult.value).toBe(42);
    expect(diagResult.diagnostics).toHaveLength(1);
    expect(diagResult.diagnostics[0].code).toBe('test.code');

    expect(normalizeSlideGroup('  Intro  ')).toBe('Intro');
    expect(normalizeSlideGroup('', 'Fallback')).toBeUndefined();
    expect(normalizeSlideGroup(undefined, 'Fallback')).toBe('Fallback');
    expect(normalizeSlideGroup(undefined)).toBeUndefined();
    expect(formatGroupBadge('A', 'short')).toBe('A');
    expect(formatGroupBadge('Intro', 'long')).toBe('Intro');
    expect(formatGroupBadge(undefined)).toBe('');
    expect(getGroupBadgeClass('Intro')).toBeTruthy();
    expect(getGroupBadgeClass('CustomGroup')).toBeTruthy();

    const sampleSlides = [
      { id: '1', group: 'Intro' },
      { id: '2', group: 'Chiến lược Q4' },
      { id: '3' },
      { id: '4', group: 'Intro' },
    ];
    const groups = getDeckGroupsForSlides(sampleSlides);
    expect(groups).toEqual(['Intro', 'Chiến lược Q4', UNGROUPED_FILTER_KEY]);
    expect(matchesGroupFilter({ group: 'Intro' }, 'Intro')).toBe(true);
    expect(matchesGroupFilter({ group: 'Intro' }, GROUPED_VIEW_KEY)).toBe(true);
    expect(matchesGroupFilter({}, UNGROUPED_FILTER_KEY)).toBe(true);

    const sections = groupSlidesByGroup(sampleSlides);
    expect(sections.map(s => ({ key: s.key, count: s.entries.length }))).toEqual([
      { key: 'Intro', count: 2 },
      { key: 'Chiến lược Q4', count: 1 },
      { key: UNGROUPED_FILTER_KEY, count: 1 },
    ]);
  });

  it('parses CSV, TSV, YAML, JSON and applies data transforms in DataResolver', () => {
    const csvRows = DataResolver.data({
      data: {
        type: 'csv',
        value: 'Name,Score\n"CloudOps, A",85\nDevOps,92',
      },
    });
    expect(csvRows.length).toBe(2);
    expect(csvRows[0]['Name']).toBe('CloudOps, A');
    expect(csvRows[0]['Score']).toBe(85);

    const yamlRows = DataResolver.data({
      data: {
        type: 'yaml',
        value: '- label: Alpha\n  value: 40\n- label: Beta\n  value: 60',
      },
    });
    expect(Array.isArray(yamlRows)).toBe(true);
    expect(yamlRows.length).toBe(2);
    expect(yamlRows[1].value).toBe(60);

    const transformed = DataResolver.data({
      data: [
        { dept: 'Cloud', score: 80 },
        { dept: 'Cloud', score: 100 },
        { dept: 'AI', score: 95 },
      ],
      transform: {
        groupBy: 'dept',
        agg: 'avg',
        aggregateField: 'score',
        sortBy: 'value',
        order: 'desc',
      },
    });
    expect(transformed.length).toBe(2);
    const aiGroup = transformed.find((r: any) => r.label === 'AI');
    const cloudGroup = transformed.find((r: any) => r.label === 'Cloud');
    expect(aiGroup.value).toBe(95);
    expect(cloudGroup.value).toBe(90);
  });

  it('solves 12-column composer grid geometry deterministically', () => {
    const layout = xbSolveGrid([
      { type: 'text', span: 6, height: 240, text: 'Left Column' },
      { type: 'chart', variant: 'bar', span: 6, height: 240 },
    ]);
    expect(layout.fits).toBe(true);
    expect(layout.widths.length).toBe(2);
    expect(layout.widths[0]).toBeGreaterThan(700);
    expect(layout.rows.length).toBe(1);
  });

  it('compiles all 107 slides and generates standalone static HTML without missing charts or diagrams', () => {
    const deckDoc = XB.getDeck();
    const compiled = XBrainCompiler.compile(deckDoc, { strict: false });
    expect(compiled.ok).toBe(true);
    expect(compiled.slides.length).toBe(107);
    expect(compiled.slides[0].html).toContain('1920px');

    const staticHtml = XBrainCompiler.staticPage(compiled, {
      css: XBRAIN_EMBEDDED_CSS,
      sprite: XBRAIN_SVG_SPRITE,
      title: 'XBrain Static Export Test',
    });
    expect(staticHtml.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(staticHtml).toContain('<title>XBrain Static Export Test</title>');
    expect(staticHtml).toContain('id="xbrain-logo-primary"');
    expect(staticHtml).toContain('class="xb-page"');
    expect(staticHtml).toContain('<svg');
  });

  it('does not export an unusable editable HTML file from the Vite development server', () => {
    const devEntry = document.createElement('script');
    devEntry.type = 'module';
    devEntry.src = '/src/main.tsx';
    document.body.appendChild(devEntry);
    try {
      expect(() => XB.exportHTML()).toThrow(/npm run build/);
    } finally {
      devEntry.remove();
    }
  });

  it('auto-repairs overloaded composer slides and schema typos via XBrainCompiler.repair', () => {
    const brokenDeck = {
      version: '1.0',
      slides: [
        {
          id: 'overloaded-composer',
          type: 'composer',
          content: {
            title: 'Overloaded Slide',
            components: [
              {
                type: 'list',
                title: 'Too many bullets',
                items: Array.from(
                  { length: 28 },
                  (_, i) =>
                    `Bullet item number ${i + 1} with detailed operational description for CloudOps & DevOps training cohort.`
                ),
              },
            ],
          },
        },
      ],
    };

    const repaired = XBrainCompiler.repair(brokenDeck);
    expect(repaired.changes.length).toBeGreaterThan(0);
    expect(repaired.document.slides.length).toBeGreaterThanOrEqual(2);
  });

  it('exposes transactional XBAgent API (setCandidate, validate, applyPatch, proposeRepair)', async () => {
    const agent = XB.agent;
    expect(agent).toBeDefined();
    const readyState = await agent.ready();
    expect(readyState.ok).toBe(true);

    const sampleDeck = {
      version: '1.0',
      slides: [
        {
          id: 'test-cover-1',
          type: 'cover',
          content: {
            badge: 'UNIT TEST',
            titleLine1: 'XBrain',
            titleLine2: 'React + TypeScript',
            titleLine3: 'together with',
            subtitle: 'Offline Single-File Architecture',
            presenter: 'Mr. Ha Ngo',
            location: 'Da Nang City',
            website: 'www.xbrain.com.vn',
          },
        },
      ],
    };

    const state0 = await agent.getState();
    const loadRes = await agent.setCandidate({
      baseRevision: state0.data.candidateRevision,
      document: sampleDeck,
    });
    expect(loadRes.ok).toBe(true);
    const rev1 = loadRes.revision;

    const patchRes = await agent.applyPatch({
      baseRevision: rev1,
      operations: [
        {
          op: 'replace',
          path: '/slides/0/content/subtitle',
          value: 'Patched Subtitle via RFC6902',
        },
      ],
    });
    expect(patchRes.ok).toBe(true);

    const valRes = await agent.validate({ revision: patchRes.revision });
    expect(valRes.ok).toBe(true);
    expect(valRes.data.validation.valid).toBe(true);

    const candRes = await agent.getDeck({ source: 'candidate' });
    expect(candRes.data.document.slides[0].content.subtitle).toBe('Patched Subtitle via RFC6902');

    await agent.resetCandidate({ baseRevision: patchRes.revision });
  });

  it('supports flexible custom SlideGroup strings and optional/omitted group on slides and layouts', () => {
    const customGroupDeck = {
      version: '1.0',
      layouts: {
        'custom-ungrouped-card': {
          name: 'Custom Ungrouped Card',
          template: '<div style="width:1920px;height:1080px;padding:80px"><h1>${c.title || ""}</h1></div>',
        },
        'custom-grouped-card': {
          name: 'Custom Grouped Card',
          group: 'Deep-Dive',
          template: '<div style="width:1920px;height:1080px;padding:80px"><h1>${c.title || ""}</h1></div>',
        },
      },
      slides: [
        {
          id: 'slide-custom-group-intro',
          type: 'cover',
          group: 'Intro',
          content: {
            titleLine1: 'Flexible Group',
            subtitle: 'Custom Intro Group',
          },
        },
        {
          id: 'slide-optional-ungrouped-layout',
          type: 'custom-ungrouped-card',
          content: {
            title: 'Slide Without Any Group',
          },
        },
        {
          id: 'slide-inherited-custom-group',
          type: 'custom-grouped-card',
          content: {
            title: 'Slide Inheriting Deep-Dive Group',
          },
        },
        {
          id: 'slide-inline-code-no-group',
          type: 'inline-code-slide',
          template: '<div style="width:1920px;height:1080px"><h2>${c.heading || "No Group"}</h2></div>',
          content: {
            heading: 'Inline Code Slide With Optional Group Omitted',
          },
        },
      ],
    };

    const validation = XBrainCompiler.validate(customGroupDeck, { strict: true });
    expect(validation.ok).toBe(true);

    const compiled = XBrainCompiler.compile(customGroupDeck, { strict: true });
    expect(compiled.ok).toBe(true);
    expect(compiled.slides.length).toBe(4);
    expect(compiled.document?.slides[0].group).toBe('Intro');
    expect(compiled.document?.slides[1].group).toBeUndefined();
    expect(compiled.document?.slides[2].group).toBe('Deep-Dive');
    expect(compiled.document?.slides[3].group).toBeUndefined();
  });

  it('renders React <App /> and updates useXBrainEngine hook reactively via @testing-library/react', () => {
    const { container } = render(<App />);

    const appShell = container.querySelector('#app-shell');
    expect(appShell).toBeInTheDocument();
    expect(appShell).toHaveAttribute('data-app-mode', 'workspace');
    expect(appShell).toHaveAttribute('data-slide-count', '107');
    expect(screen.getByText('Soạn thảo')).toBeInTheDocument();
    expect(screen.getByText('Tổng quan')).toBeInTheDocument();

    const { result } = renderHook(() => useXBrainEngine());
    expect(result.current.slides.length).toBe(107);
    expect(result.current.currentSlideIndex).toBe(0);
    expect(result.current.groups).toEqual(['Overview', 'Narrative', 'Metrics & Plan', 'Diagrams', 'Composer']);

    act(() => {
      result.current.selectSlide(4);
    });
    expect(result.current.currentSlideIndex).toBe(4);
    expect(appShell).toHaveAttribute('data-active-slide-index', '4');

    act(() => {
      result.current.switchAppMode('gallery');
    });
    expect(result.current.currentAppMode).toBe('gallery');
    expect(appShell).toHaveAttribute('data-app-mode', 'gallery');
    expect(container.querySelector('#gal-filter-GROUPED')).toBeNull();

    act(() => {
      result.current.filterGallery('Overview');
    });
    expect(result.current.currentGalleryFilter).toBe('Overview');
    expect(container.querySelectorAll('#gallery-grid-container [data-slide-index]').length).toBe(4);

    act(() => {
      result.current.filterGallery('ALL');
      result.current.switchAppMode('workspace');
      result.current.selectSlide(0);
    });
    expect(result.current.currentAppMode).toBe('workspace');
    expect(result.current.currentSlideIndex).toBe(0);

    // Verify enhanced Sidebar search, visible count badge, and collapsible toggle
    const searchInput = container.querySelector('#sidebar-search-input') as HTMLInputElement;
    expect(searchInput).toBeInTheDocument();
    expect(container.querySelector('#sidebar-visible-count')?.textContent).toBe('107');

    // Verify AI Console dual-audience elements (next-step guidance, slide search, scope helpers)
    const consoleRoot = container.querySelector('#v1-agent-console');
    expect(consoleRoot).toBeInTheDocument();
    expect(consoleRoot?.querySelector('[data-testid="xb-agent-next-step"]')).toBeInTheDocument();
    expect(consoleRoot?.querySelector('[data-testid="xb-agent-tree-search"]')).toBeInTheDocument();
    expect(consoleRoot?.querySelector('[data-v1-agent-action="scope-selected"]')).toBeInTheDocument();
    expect(consoleRoot?.querySelector('[data-v1-agent-action="scope-finding"]')).toBeInTheDocument();
    expect(consoleRoot?.querySelector('[data-v1-agent-action="fill-from-studio"]')).toBeInTheDocument();
  });

  it('loads embedded JPG, PNG, CSS, and SVG assets from public/assets/ and normalizes DeckModel with optional group', () => {
    expect(BRAND_PHOTOS.lab1).toMatch(/^data:image\/jpeg;base64,/);
    expect(BRAND_PHOTOS.presenter).toMatch(/^data:image\/jpeg;base64,/);
    expect(BRAND_PHOTOS.lab2).toMatch(/^data:image\/jpeg;base64,/);
    expect(XBRAIN_LOGOS.primary).toMatch(/^data:image\/png;base64,/);
    expect(XBRAIN_LOGOS.white).toMatch(/^data:image\/png;base64,/);
    expect(XBRAIN_EMBEDDED_CSS).toContain('--brand-primary: #F97C00;');
    expect(XBRAIN_SVG_SPRITE).toContain('id="xbrain-logo-primary"');
    expect(XBRAIN_SVG_SPRITE).toContain('data:image/png;base64,');

    const normalized = DeckModel.normalize(
      {
        version: '1.0',
        slides: [
          { id: 's1', type: 'cover', group: 'Mở đầu tùy chọn', content: { title: 'Deck' } },
          { id: 's2', type: 'cover', content: { title: 'Ungrouped Cover' } },
        ],
      },
      LAYOUT_CATALOG,
      { version: '1.0' }
    );
    expect(normalized.slides[0].group).toBe('Mở đầu tùy chọn');
    expect(normalized.slides[1].group).toBeUndefined();
  });
});

