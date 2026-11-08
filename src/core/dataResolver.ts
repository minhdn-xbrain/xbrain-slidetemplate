import { deckClamp, deckToNumber, deckSeriesKeys, DECK_AUX_FIELDS } from '../utils/textAndFormat';

const DECK_LABEL_KEYS = ['label', 'name', 'title', 'category', 'Category', 'Stage', 'stage', 'Quarter', 'quarter', 'Month', 'month', 'Year', 'year', 'Period', 'period', 'Task', 'task', 'date'];
const DECK_VALUE_KEYS = ['value', 'Value', 'score', 'Score', 'amount', 'Amount', 'count', 'Count', 'Revenue', 'revenue'];

// DataResolver keeps format parsing, transforms and cache behind one interface.
export function createDataResolver({
  getConfig,
  cache,
  fetchData,
  report = () => {},
  getOptions = () => ({ strict: false }),
}: {
  getConfig: () => any;
  cache: Map<string, any>;
  fetchData: (...args: any[]) => Promise<any>;
  report?: (...args: any[]) => void;
  getOptions?: () => { strict?: boolean };
}) {
  const setField = (object: any, key: string, value: any) =>
    Object.defineProperty(object, key, { value, writable: true, enumerable: true, configurable: true });

  function deckCSV(text: any, delimiter = ',') {
    const out: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let quoted = false;
    const t = String(text ?? '').replace(/^\uFEFF/, '');
    for (let i = 0; i < t.length; i++) {
      const c = t[i];
      if (c === '"') {
        if (quoted && t[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = !quoted;
      } else if (!quoted && c === delimiter) {
        row.push(cell);
        cell = '';
      } else if (!quoted && (c === '\n' || c === '\r')) {
        if (c === '\r' && t[i + 1] === '\n') i++;
        row.push(cell);
        cell = '';
        if (row.some(x => x !== '')) out.push(row);
        row = [];
      } else cell += c;
    }
    row.push(cell);
    if (row.some(x => x !== '')) out.push(row);
    if (!out.length) return [];
    const heads = out.shift()!.map((x, i) => x.trim() || `column${i + 1}`);
    return out.map(r =>
      Object.fromEntries(
        heads.map((h, i) => [h, (r[i] ?? '').trim().match(/^[-+]?\d+(\.\d+)?$/) ? Number(r[i]) : r[i] ?? ''])
      )
    );
  }

  function deckYAML(src: any) {
    // Deterministic subset: lists of flat mappings and key-value maps in browser and CLI.
    const rows: any[] = [];
    let obj: any = null;
    const root: Record<string, any> = {};
    for (const raw of String(src).split(/\r?\n/)) {
      const line = deckYamlComment(raw);
      if (!line.trim()) continue;
      const m = line.match(/^\s*-\s*([\w-]+):\s*(.*)$/);
      const n = line.match(/^\s+([\w-]+):\s*(.*)$/);
      const p = line.match(/^\s*([\w-]+):\s*(.*)$/);
      if (m) {
        obj = {};
        rows.push(obj);
        setField(obj, m[1], deckCoerce(m[2]));
      } else if (n && obj) setField(obj, n[1], deckCoerce(n[2]));
      else if (p) setField(root, p[1], deckCoerce(p[2]));
    }
    return rows.length ? rows : root;
  }

  function deckYamlComment(line: string) {
    let quote = '';
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (quote) {
        if (ch === '\\' && quote === '"') {
          i++;
          continue;
        }
        if (ch === quote) {
          if (quote === "'" && line[i + 1] === "'") {
            i++;
            continue;
          }
          quote = '';
        }
        continue;
      }
      if (ch === '"' || ch === "'") {
        quote = ch;
        continue;
      }
      if (ch === '#' && (i === 0 || /\s/.test(line[i - 1])) && !/^#[0-9a-f]{3,8}(?=\s|$)/i.test(line.slice(i)))
        return line.slice(0, i);
    }
    return line;
  }

  function deckCoerce(v: any) {
    const t = String(v ?? '').trim();
    if (t.startsWith('"') && t.endsWith('"')) {
      try {
        return JSON.parse(t);
      } catch {
        return t.slice(1, -1);
      }
    }
    if (t.startsWith("'") && t.endsWith("'")) return t.slice(1, -1).replace(/''/g, "'");
    if (t === 'true') return true;
    if (t === 'false') return false;
    if (t === 'null' || t === '~') return null;
    if (t !== '' && Number.isFinite(Number(t))) return Number(t);
    return t;
  }

  function deckSource(key: any) {
    if (key == null) return [];
    let definition = key;
    if (typeof key === 'string') {
      const sets = getConfig().datasets || {};
      const name = key.replace(/^datasets\./, '');
      definition = Object.prototype.hasOwnProperty.call(sets, key)
        ? sets[key]
        : Object.prototype.hasOwnProperty.call(sets, name)
        ? sets[name]
        : undefined;
      if (definition === undefined) {
        report('data.unknown-ref', 'error', `Dataset "${name}" does not exist (available: ${Object.keys(sets).join(', ') || 'none'})`, { ref: name });
        return [];
      }
    }
    if (Array.isArray(definition)) return definition;
    if (typeof definition === 'string') {
      try {
        return JSON.parse(definition);
      } catch {
        return deckCSV(definition);
      }
    }
    if (!definition || typeof definition !== 'object') return [];
    if (definition.url && definition.value === undefined && definition.data === undefined) {
      if (cache.has(definition.url)) return cache.get(definition.url);
      report('determinism.external-missing', 'error', `Dataset URL "${definition.url}" has no inline snapshot; prefetch it before compiling`);
      return [];
    }
    const format = (definition.type || definition.format || 'json').toLowerCase();
    const value = definition.value ?? definition.data ?? [];
    try {
      if (['csv', 'tsv'].includes(format)) return deckCSV(value, format === 'tsv' ? '\t' : ',');
      if (['yaml', 'yml'].includes(format)) return deckYAML(value);
      if (format === 'json') return typeof value === 'string' ? JSON.parse(value) : value;
      if (format === 'markdown' || format === 'html' || format === 'svg' || format === 'text') return value;
      return value;
    } catch (e: any) {
      report('data.parse', 'error', `Dataset could not be parsed as ${format}: ${e.message}`);
      return [];
    }
  }

  // No data reference: strict compiles report it; the legacy editor still shows the "tracks" sample (reported).
  function deckData(comp: any) {
    let raw = comp.dataRef || comp.data?.$ref || comp.dataset || comp.data;
    if (raw && typeof raw === 'object' && raw.$ref) raw = raw.$ref;
    if (raw == null || raw === '') {
      if (getOptions().strict) {
        report('data.missing', 'error', `${comp.type || 'component'} "${comp.variant || ''}" has no data (dataRef, data, dataset${comp.type === 'diagram' ? ' or nodes' : ''})`);
        return [];
      }
      report('data.implicit-sample', 'warning', `${comp.type || 'component'} has no data reference and shows the built-in "tracks" sample`);
      raw = 'tracks';
    }
    const data = deckSource(raw);
    let arr: any[] = Array.isArray(data) ? data : data && typeof data === 'object' ? [data] : [];
    const tx = comp.transform || {};
    // Relational operations are pure: never mutate shared dataset rows.
    if (tx.join) {
      const j = tx.join;
      const right = deckSource(j.rightDataset);
      const index = new Map();
      if (Array.isArray(right)) {
        for (const row of right) {
          const key = row?.[j.rightKey];
          if (key == null) continue;
          if (index.has(key)) {
            report('data.inconsistent', 'error', `join: duplicate right key "${key}"`);
            return [];
          }
          index.set(key, row);
        }
      }
      arr = arr.map(row => {
        const found = index.get(row?.[j.leftKey]);
        if (!found) return row;
        const out = { ...row };
        for (const [key, value] of Object.entries(found)) {
          if (key === j.rightKey) continue;
          if (j.select && !j.select.includes(key)) continue;
          const name = (j.prefix || '') + key;
          if (Object.prototype.hasOwnProperty.call(out, name)) {
            report('data.inconsistent', 'error', `join: column "${name}" already exists; use prefix or select`);
            continue;
          }
          setField(out, name, value);
        }
        return out;
      });
    }
    if (tx.derive) {
      arr = arr.map(row => {
        const out = { ...row };
        for (const [key, expr] of Object.entries(tx.derive)) {
          const value = deckDerive(expr, out);
          if (Number.isFinite(value)) setField(out, key, value);
          else {
            delete out[key];
            report('data.derive', 'error', `derive: "${key}" has missing/non-numeric operands or divides by zero`);
          }
        }
        return out;
      });
    }
    if (tx.filter && typeof tx.filter === 'object') {
      const { field, eq, ne, gt, lt } = tx.filter;
      arr = arr.filter(row => {
        const v = row?.[field];
        return (
          (eq === undefined || v === eq) &&
          (ne === undefined || v !== ne) &&
          (gt === undefined || Number(v) > gt) &&
          (lt === undefined || Number(v) < lt)
        );
      });
    }
    if (tx.sortBy) {
      const f = tx.sortBy;
      const dir = tx.order === 'desc' ? -1 : 1;
      arr = arr
        .map((row, i) => ({ row, i }))
        .sort((a, b) => {
          let x = a.row?.[f];
          let y = b.row?.[f];
          const c =
            typeof x === 'number' && typeof y === 'number'
              ? x - y
              : ((x = String(x ?? '')), (y = String(y ?? '')), x < y ? -1 : x > y ? 1 : 0);
          return c * dir || a.i - b.i;
        })
        .map(o => o.row);
    }
    if (tx.offset != null) arr = arr.slice(Math.max(0, tx.offset));
    if (tx.limit != null) arr = arr.slice(0, deckClamp(Number(tx.limit) || 0, 0, 2000));
    if (tx.groupBy) {
      const groups = new Map<string, any[]>();
      const fields = tx.aggregateField ? [tx.aggregateField] : deckSeriesKeys(deckRows(arr)).filter(k => k !== tx.groupBy);
      for (const row of arr) {
        const key = String(row?.[tx.groupBy] ?? 'Other');
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(row);
      }
      arr = [...groups].map(([label, rows]) => {
        const out: Record<string, any> = { label };
        if (tx.agg === 'count' && !tx.aggregateField && !fields.length) {
          out.value = rows.length;
          return out;
        }
        for (const field of fields) {
          const values = rows.map(r => deckToNumber(r?.[field])).filter(Number.isFinite);
          const op = tx.agg || 'sum';
          if (!values.length && op !== 'count') {
            report('data.non-numeric', 'error', `groupBy: "${label}" has no numeric values for "${field}"`);
            continue;
          }
          const value =
            op === 'count'
              ? values.length
              : op === 'avg'
              ? values.reduce((a, b) => a + b, 0) / values.length
              : op === 'min'
              ? Math.min(...values)
              : op === 'max'
              ? Math.max(...values)
              : values.reduce((a, b) => a + b, 0);
          setField(out, tx.aggregateField ? 'value' : field, value);
        }
        return out;
      });
    }
    if (tx.select)
      arr = arr.map(row =>
        Object.fromEntries(tx.select.filter((key: string) => Object.prototype.hasOwnProperty.call(row || {}, key)).map((key: string) => [key, row[key]]))
      );
    if (tx.exclude)
      arr = arr.map(row => Object.fromEntries(Object.entries(row || {}).filter(([key]) => !tx.exclude.includes(key))));
    return arr;
  }

  // Declarative arithmetic AST; no eval, functions, property paths or implicit numeric defaults.
  function deckDerive(expr: any, row: any, depth = 0): number {
    if (depth > 16) return NaN;
    if (typeof expr === 'number') return Number.isFinite(expr) ? expr : NaN;
    if (!expr || typeof expr !== 'object') return NaN;
    if (typeof expr.field === 'string') return Object.prototype.hasOwnProperty.call(row, expr.field) ? deckToNumber(row[expr.field]) : NaN;
    const args: number[] = Array.isArray(expr.args) ? expr.args.map((x: any) => deckDerive(x, row, depth + 1)) : [];
    if (args.length !== 2 || !args.every(Number.isFinite)) return NaN;
    const [a, b] = args;
    switch (expr.op) {
      case 'add':
        return a + b;
      case 'subtract':
        return a - b;
      case 'multiply':
        return a * b;
      case 'divide':
        return b === 0 ? NaN : a / b;
      case 'percent':
        return b === 0 ? NaN : (a / b) * 100;
      default:
        return NaN;
    }
  }

  // Row = {label, value, raw}. value is NaN when the row has no numeric value: renderers skip and report it.
  function deckRows(data: any[]) {
    return (data || []).map((r, i) => {
      if (typeof r === 'number') return { label: 'Item ' + (i + 1), value: r, raw: { value: r } };
      if (typeof r === 'string') return { label: r, value: NaN, raw: { label: r } };
      if (!r || typeof r !== 'object') return { label: 'Item ' + (i + 1), value: NaN, raw: {} };
      const keys = Object.keys(r);
      const labelKey = DECK_LABEL_KEYS.find(k => r[k] != null && r[k] !== '') ?? keys.find(k => typeof r[k] === 'string');
      const valueKey =
        DECK_VALUE_KEYS.find(k => k in r && k !== labelKey) ??
        keys.find(k => k !== labelKey && !DECK_AUX_FIELDS.has(k) && Number.isFinite(deckToNumber(r[k])));
      return {
        label: String(labelKey == null ? 'Item ' + (i + 1) : r[labelKey]),
        value: valueKey == null ? NaN : deckToNumber(r[valueKey]),
        raw: r,
        labelKey,
        valueKey,
      };
    });
  }

  async function reloadRemote() {
    const sources = Object.entries(getConfig().datasets || {}).filter(([_, value]: [string, any]) => value && value.url);
    const lines: string[] = [];
    for (const [id, def] of sources as [string, any][]) {
      try {
        const response = await fetchData(def.url, { mode: 'cors' });
        if (!response.ok) throw Error('HTTP ' + response.status);
        const text = await response.text();
        const format = (def.type || def.format || (/\.csv(?:\?|$)/.test(def.url) ? 'csv' : 'json')).toLowerCase();
        const data =
          format === 'csv'
            ? deckCSV(text)
            : format === 'tsv'
            ? deckCSV(text, '\t')
            : ['yaml', 'yml'].includes(format)
            ? deckYAML(text)
            : JSON.parse(text);
        cache.set(def.url, data);
        lines.push(id + ': ' + (Array.isArray(data) ? data.length + ' rows' : 'loaded'));
      } catch (error: any) {
        lines.push(id + ': lỗi tải (' + error.message + ')');
      }
    }
    return lines;
  }

  return { data: deckData, rows: deckRows, reloadRemote };
}
