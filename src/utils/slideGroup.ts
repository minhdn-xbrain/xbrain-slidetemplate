export const UNGROUPED_FILTER_KEY = '__NONE__';
export const BUILTIN_GROUP_ORDER = ['A', 'B', 'C', 'D', 'E'];
export const BUILTIN_GROUP_META: Record<string, { sideLabel: string; sideTitle: string; galLabel: string }> = {
  A: { sideLabel: 'Group A', sideTitle: 'Group A: Structure Slides', galLabel: 'Group A — Structure' },
  B: { sideLabel: 'Group B', sideTitle: 'Group B: Content Slides', galLabel: 'Group B — Content' },
  C: { sideLabel: 'Group C', sideTitle: 'Group C: Business & Data Slides', galLabel: 'Group C — Business & Data' },
  D: { sideLabel: 'Group D', sideTitle: 'Group D: Editable Diagrams', galLabel: 'Group D — Diagrams' },
  E: { sideLabel: 'E', sideTitle: 'Composer v1', galLabel: 'E · Composer' },
};

export const CUSTOM_GROUP_PALETTE = [
  'bg-[#10B981]/20 text-[#6EE7B7]',
  'bg-[#F59E0B]/20 text-[#FCD34D]',
  'bg-[#EC4899]/20 text-[#F9A8D4]',
  'bg-[#6366F1]/25 text-[#A5B4FC]',
  'bg-[#14B8A6]/20 text-[#5EEAD4]',
  'bg-[#EF4444]/20 text-[#FCA5A5]',
];

export function normalizeSlideGroup(rawGroup: any, fallbackGroup?: any): string | undefined {
  if (rawGroup === null || rawGroup === '') return undefined;
  if (typeof rawGroup === 'string' && rawGroup.trim()) return rawGroup.trim();
  if (typeof fallbackGroup === 'string' && fallbackGroup.trim()) return fallbackGroup.trim();
  return undefined;
}

export function formatGroupBadge(group: any, style: 'short' | 'long' = 'long'): string {
  const g = typeof group === 'string' ? group.trim() : '';
  if (!g) return '';
  if (style === 'short') {
    return g.length === 1 ? `Grp ${g}` : g;
  }
  return g.length === 1 ? `Group ${g}` : g;
}

export function getGroupBadgeClass(group: any): string {
  const g = typeof group === 'string' ? group.trim() : '';
  if (!g) return 'bg-slate-700/40 text-slate-300';
  if (g === 'A') return 'bg-[#F97C00]/20 text-[#FF991D]';
  if (g === 'B') return 'bg-[#25AC9D]/20 text-[#7FD7BB]';
  if (g === 'C') return 'bg-[#007BC1]/25 text-[#00B3D8]';
  if (g === 'D') return 'bg-[#85439A]/25 text-[#E3B4F0]';
  if (g === 'E') return 'bg-[#10B981]/20 text-[#6EE7B7]';
  let hash = 0;
  for (let i = 0; i < g.length; i++) hash = (hash * 31 + g.charCodeAt(i)) >>> 0;
  return CUSTOM_GROUP_PALETTE[hash % CUSTOM_GROUP_PALETTE.length];
}

export function getDeckGroupsForSlides(slideList: any[]): string[] {
  const present = new Set<string>();
  let hasUngrouped = false;
  for (const s of slideList || []) {
    const g = typeof s?.group === 'string' ? s.group.trim() : '';
    if (g) present.add(g);
    else hasUngrouped = true;
  }
  const ordered: string[] = [];
  for (const b of BUILTIN_GROUP_ORDER) {
    if (present.has(b)) {
      ordered.push(b);
      present.delete(b);
    }
  }
  for (const g of present) ordered.push(g);
  if (hasUngrouped) ordered.push(UNGROUPED_FILTER_KEY);
  return ordered;
}

export function matchesGroupFilter(slide: any, filter: string): boolean {
  if (!filter || filter === 'ALL') return true;
  const g = typeof slide?.group === 'string' ? slide.group.trim() : '';
  if (filter === UNGROUPED_FILTER_KEY) return !g;
  return g === filter;
}
