export function escapeHtml(value: any): string {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]!));
}

export function escapedContent(value: any): any {
  if (Array.isArray(value)) return value.map(escapedContent);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, escapedContent(v)]));
  return typeof value === 'string' ? escapeHtml(value) : value;
}

export function deckSafe(s: any): string {
  return escapeHtml(String(s == null ? '' : s));
}

export function deckNum(n: any, d = 0): number {
  const x = Number(n);
  return Number.isFinite(x) ? x : d;
}

export function deckClamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n));
}

export const r1 = (n: number): number => Math.round(n * 10) / 10;

// Deterministic number format (no locale tables): 1234.5 → "1,234.5"; options {decimals,maxDecimals,group,decimal,prefix,suffix}.
export function deckFmt(v: any, o: Record<string, any> = {}): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return v == null || v === '' ? '—' : String(v);
  const a = Math.abs(n);
  const d = o.decimals ?? Math.min(o.maxDecimals ?? 2, a >= 100 || Number.isInteger(n) ? 0 : a >= 10 ? 1 : 2);
  let s = a.toFixed(d);
  if (o.decimals == null && s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  const [i, f] = s.split('.');
  return (n < 0 && Number(s) !== 0 ? '-' : '') + (o.prefix || '') + i.replace(/\B(?=(\d{3})+(?!\d))/g, o.group ?? ',') + (f ? (o.decimal ?? '.') + f : '') + (o.suffix || '');
}

export function deckShow(v: any): string {
  return typeof v === 'number' ? deckFmt(v) : v == null || v === '' ? '—' : String(v);
}

// Field accessors shared by renderers and the validator (one alias table = one contract).
export const DECK_FIELD_ALIASES: Record<string, string[]> = {
  target: ['target', 'Target', 'goal', 'Goal', 'line', 'Line'],
  start: ['start', 'Start', 'low', 'Low', 'min', 'from', 'begin'],
  end: ['end', 'End', 'high', 'High', 'max', 'to', 'finish'],
  before: ['before', 'Before', 'previous', 'prev', 'start', 'from'],
  after: ['after', 'After', 'current', 'end', 'to'],
  x: ['x', 'X'],
  y: ['y', 'Y'],
  size: ['size', 'Size', 'z', 'weight'],
};

export function deckToNumber(v: any): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : NaN;
  if (typeof v === 'string' && /^\s*[-+]?\d+(\.\d+)?\s*$/.test(v)) return Number(v);
  return NaN;
}

// undefined = field absent; NaN = present but not numeric.
export function deckField(row: any, name: string): number | undefined {
  const raw = row?.raw && typeof row.raw === 'object' ? row.raw : row || {};
  for (const k of DECK_FIELD_ALIASES[name] || [name]) {
    const v = raw[k];
    if (v !== undefined && v !== null && v !== '') return deckToNumber(v);
  }
  return undefined;
}

// Numeric series keys of a dataset (auxiliary fields such as target/start/end are excluded).
export const DECK_AUX_FIELDS = new Set([
  'label', 'name', 'title', 'id', 'color', 'desc', 'status', 'lane', 'group',
  'parent', 'date', 'when', 'kind', 'total', 'isTotal', 'row', 'col', 'column',
  ...Object.values(DECK_FIELD_ALIASES).flat(),
]);

export function deckSeriesKeys(rows: any[]): string[] {
  const keys: string[] = [];
  for (const r of rows) {
    const raw = r?.raw;
    if (!raw || typeof raw !== 'object') continue;
    for (const [k, v] of Object.entries(raw)) {
      if (k !== r.labelKey && !DECK_AUX_FIELDS.has(k) && Number.isFinite(deckToNumber(v)) && !keys.includes(k)) {
        keys.push(k);
      }
    }
  }
  return keys;
}

export const DECK_COLORS = ['#F97C00', '#25AC9D', '#007BC1', '#85439A', '#F6AF2F', '#425453', '#7FD7BB', '#FE4A0B'];
export const DECK_INK = '#425453';
export const DECK_MUTED = '#6B7C78';
export const DECK_GRID = '#E7EEEA';
export const DECK_AXIS = '#B4C2BC';
export const DECK_NEG = '#FE4A0B';
export const DECK_POS = '#25AC9D';

// Collects structured diagnostics while rendering; a no-op outside XBDiag.collect().
export const XBDiag = (() => {
  let sink: any[] | null = null;
  const path: (string | number)[] = [];
  const esc = (s: any) => String(s).replace(/~/g, '~0').replace(/\//g, '~1');
  const pointer = (segs: (string | number)[]) => (segs.length ? '/' + segs.map(esc).join('/') : '');
  return {
    collect<T>(fn: () => T): { value: T; diagnostics: any[] } {
      const prev = sink;
      const saved = path.splice(0);
      sink = [];
      try {
        return { value: fn(), diagnostics: sink };
      } finally {
        sink = prev;
        path.length = 0;
        path.push(...saved);
      }
    },
    at<T>(segs: any, fn: () => T): T {
      const list = ([] as (string | number)[]).concat(segs);
      path.push(...list);
      try {
        return fn();
      } finally {
        path.length -= list.length;
      }
    },
    mute<T>(fn: () => T): T {
      const prev = sink;
      sink = null;
      try {
        return fn();
      } finally {
        sink = prev;
      }
    },
    pointer: () => pointer(path),
    get active() {
      return !!sink;
    },
    report(code: string, severity: string, message: string, extra: Record<string, any> = {}) {
      if (!sink) return;
      const { at, ...rest } = extra;
      const p = pointer(at === undefined ? path : path.concat(at));
      if (sink.some(d => d.code === code && d.path === p && d.message === message)) return;
      sink.push({ code, severity, path: p, message, ...rest });
    },
  };
})();

// Deterministic text measurement (no DOM): average advance widths in em for Manrope/Nunito 600–800.
export const XBText = (() => {
  const W = { space: 0.27, narrow: 0.29, punct: 0.34, digit: 0.58, lower: 0.53, upper: 0.68, wide: 0.88, cjk: 1, other: 0.6 };
  const memo = new Map<string, number>();
  function em(ch: string): number {
    let v = memo.get(ch);
    if (v !== undefined) return v;
    const b = ch === 'đ' ? 'd' : ch === 'Đ' ? 'D' : ch.normalize('NFD')[0] || ch;
    if (/\p{Mn}/u.test(ch)) {
      memo.set(ch, 0);
      return 0;
    }
    v = b === ' '
      ? W.space
      : /[iljI.,:;'!|`]/.test(b)
      ? W.narrow
      : /[0-9]/.test(b)
      ? W.digit
      : /[mwMW@%]/.test(b)
      ? W.wide
      : /[A-Z]/.test(b)
      ? W.upper
      : /[a-z]/.test(b)
      ? W.lower
      : /[()[\]{}\-–—/\\"]/.test(b)
      ? W.punct
      : /[぀-ヿ一-鿿가-힯]/.test(ch)
      ? W.cjk
      : W.other;
    memo.set(ch, v);
    return v;
  }
  function width(text: any, size = 20, weight = 700): number {
    let e = 0;
    for (const ch of String(text ?? '')) e += em(ch);
    return e * size * (weight >= 760 ? 1.04 : weight <= 500 ? 0.97 : 1);
  }
  function wrap(text: any, maxWidth: number, size = 20, maxLines = Infinity, weight = 700): { lines: string[]; truncated: boolean } {
    const lines: string[] = [];
    let cur = '';
    for (let word of String(text ?? '').trim().split(/\s+/).filter(Boolean)) {
      while (width(word, size, weight) > maxWidth && [...word].length > 1) {
        const chars = [...word];
        let k = chars.length - 1;
        while (k > 1 && width(chars.slice(0, k).join(''), size, weight) > maxWidth) k--;
        if (cur) {
          lines.push(cur);
          cur = '';
        }
        lines.push(chars.slice(0, k).join(''));
        word = chars.slice(k).join('');
      }
      const next = cur ? cur + ' ' + word : word;
      if (width(next, size, weight) <= maxWidth) cur = next;
      else {
        if (cur) lines.push(cur);
        cur = word;
      }
    }
    if (cur) lines.push(cur);
    const truncated = lines.length > maxLines;
    const out = lines.slice(0, maxLines);
    if (truncated) {
      let last = out[out.length - 1] + '…';
      while (width(last, size, weight) > maxWidth && [...last].length > 1) last = [...last].slice(0, -2).join('') + '…';
      out[out.length - 1] = last;
    }
    return { lines: out, truncated };
  }
  function fit(text: any, { width: maxWidth = 200, size = 20, minSize, lines = 1, weight = 700 }: { width?: number; size?: number; minSize?: number; lines?: number; weight?: number } = {}) {
    const floor = Math.max(9, Math.min(size, minSize ?? Math.round(size * 0.72)));
    for (let s = size; s >= floor; s--) {
      const r = wrap(text, maxWidth, s, lines, weight);
      if (!r.truncated) return { ...r, size: s };
    }
    return { ...wrap(text, maxWidth, floor, lines, weight), size: floor };
  }
  const lineHeight = (text: any) => (/\p{Mn}/u.test(String(text ?? '').normalize('NFD')) ? 1.28 : 1.18);
  return { width, wrap, fit, lineHeight };
})();
