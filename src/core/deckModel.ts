// DeckModel owns the persisted document format; it has no browser side effects.
export const DeckModel = (() => {
  const version = '1.0';
  function serialize(config: any, items: any[]) {
    return { ...config, version, releaseVersion: '1.0.0', slides: items };
  }
  function normalize(input: any, catalog: any[], defaults: any) {
    const doc = Array.isArray(input) ? { version, slides: input } : input;
    if (!doc || doc.version !== version) throw Error('Expected JSON schema version ' + version);
    if (!doc || !Array.isArray(doc.slides) || doc.slides.length === 0 || doc.slides.length > 400)
      throw Error('Expected slides array, 1 to 400 entries');
    const byType = new Map(catalog.map((item: any) => [item.type, item]));
    const ids = new Set<string>();
    const items = doc.slides.map((slide: any, index: number) => {
      if (!slide || typeof slide !== 'object' || Array.isArray(slide)) throw Error('Invalid slide at ' + index);
      const type = slide.type || (slide.components ? 'composer' : '');
      const meta: any = byType.get(type);
      if (!meta) throw Error('Unknown slide type ' + type + ' at ' + index);
      let id = String(slide.id || `slide-${index + 1}`).replace(/[^a-zA-Z0-9_-]/g, '-');
      if (ids.has(id)) {
        const base = id;
        let suffix = index;
        while (ids.has(id)) id = base + '-' + suffix++;
      }
      ids.add(id);
      const resolvedGroup =
        slide.group === null || slide.group === ''
          ? undefined
          : typeof slide.group === 'string' && slide.group.trim()
          ? slide.group.trim()
          : meta.group;
      const normalized: Record<string, any> = {
        ...slide,
        id,
        type,
        layoutName: slide.layoutName || slide.title || String(meta.name || type).replace(/^\d+\.\s*/, ''),
        content: slide.content || {},
      };
      if (resolvedGroup) normalized.group = resolvedGroup;
      else delete normalized.group;
      return normalized;
    });
    const config = { ...defaults, ...(Array.isArray(input) ? {} : doc), version };
    delete config.slides;
    return { config, slides: items };
  }
  return { serialize, normalize };
})();
