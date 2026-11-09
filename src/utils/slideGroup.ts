export const UNGROUPED_FILTER_KEY = '__NONE__';
export const GROUPED_VIEW_KEY = '__GROUPED__';

export const CUSTOM_GROUP_PALETTE = [
  'bg-[#F97C00]/20 text-[#FF991D]',
  'bg-[#25AC9D]/20 text-[#7FD7BB]',
  'bg-[#007BC1]/25 text-[#00B3D8]',
  'bg-[#85439A]/25 text-[#E3B4F0]',
  'bg-[#10B981]/20 text-[#6EE7B7]',
  'bg-[#F59E0B]/20 text-[#FCD34D]',
  'bg-[#EC4899]/20 text-[#F9A8D4]',
  'bg-[#6366F1]/25 text-[#A5B4FC]',
  'bg-[#14B8A6]/20 text-[#5EEAD4]',
];

export function normalizeSlideGroup(rawGroup: any, fallbackGroup?: any): string | undefined {
  if (rawGroup === null || rawGroup === '') return undefined;
  if (typeof rawGroup === 'string') {
    const trimmed = rawGroup.trim();
    return trimmed ? trimmed : undefined;
  }
  if (typeof fallbackGroup === 'string' && fallbackGroup.trim()) {
    return fallbackGroup.trim();
  }
  return undefined;
}

export function formatGroupBadge(group: any, _style: 'short' | 'long' = 'long'): string {
  const g = typeof group === 'string' ? group.trim() : '';
  return g;
}

export function getGroupBadgeClass(group: any): string {
  const g = typeof group === 'string' ? group.trim() : '';
  if (!g) return 'bg-slate-700/40 text-slate-300';
  let hash = 0;
  for (let i = 0; i < g.length; i++) hash = (hash * 31 + g.charCodeAt(i)) >>> 0;
  return CUSTOM_GROUP_PALETTE[hash % CUSTOM_GROUP_PALETTE.length];
}

export function getDeckGroupsForSlides(slideList: any[]): string[] {
  const ordered: string[] = [];
  const seen = new Set<string>();
  let hasUngrouped = false;
  for (const s of slideList || []) {
    const g = typeof s?.group === 'string' ? s.group.trim() : '';
    if (g) {
      if (!seen.has(g)) {
        seen.add(g);
        ordered.push(g);
      }
    } else {
      hasUngrouped = true;
    }
  }
  if (hasUngrouped) ordered.push(UNGROUPED_FILTER_KEY);
  return ordered;
}

export function matchesGroupFilter(slide: any, filter: string): boolean {
  if (!filter || filter === 'ALL' || filter === GROUPED_VIEW_KEY) return true;
  const g = typeof slide?.group === 'string' ? slide.group.trim() : '';
  if (filter === UNGROUPED_FILTER_KEY) return !g;
  return g === filter;
}

export interface SlideGroupSection {
  key: string;
  label: string;
  isUngrouped: boolean;
  entries: Array<{ slide: any; index: number }>;
}

export function groupSlidesByGroup(slideList: any[]): SlideGroupSection[] {
  const sectionsByGroup = new Map<string, SlideGroupSection>();
  const ungroupedEntries: Array<{ slide: any; index: number }> = [];

  (slideList || []).forEach((slide, index) => {
    const g = typeof slide?.group === 'string' ? slide.group.trim() : '';
    if (!g) {
      ungroupedEntries.push({ slide, index });
      return;
    }
    let section = sectionsByGroup.get(g);
    if (!section) {
      section = {
        key: g,
        label: g,
        isUngrouped: false,
        entries: [],
      };
      sectionsByGroup.set(g, section);
    }
    section.entries.push({ slide, index });
  });

  const result = Array.from(sectionsByGroup.values());
  if (ungroupedEntries.length > 0) {
    result.push({
      key: UNGROUPED_FILTER_KEY,
      label: 'Chưa phân nhóm',
      isUngrouped: true,
      entries: ungroupedEntries,
    });
  }
  return result;
}
