#!/usr/bin/env node
/*
 XBrain agent compiler CLI (Node ≥ 18, no dependencies).

 Runs the runtime embedded in xbrain-presentation-system-v1.0.0.html inside an isolated
 node:vm context: no host objects are passed in (only primitive strings cross the boundary),
 every call has a timeout, and for untrusted documents string code generation (eval /
 new Function) is disabled in that context, so template-as-code cannot run at all.

   node tools/xbrain.mjs contract                     agent contract: schema, layouts, variants, codes
   node tools/xbrain.mjs schema [--write]             derived JSON Schema (--write updates contracts/)
   node tools/xbrain.mjs validate deck.json           schema + reference checks
   node tools/xbrain.mjs qa deck.json [--browser]     validate → render → layout/semantic checks (+ Chrome pixel check)
   node tools/xbrain.mjs repair deck.json -o fixed.json
   node tools/xbrain.mjs compile deck.json -o result.json
   node tools/xbrain.mjs build deck.json -o deck.html [--app] [--offline]
   node tools/xbrain.mjs render deck.json --slide 3 -o slide.html
   node tools/xbrain.mjs pipeline deck.json -o deck.html   repair → qa → static build (+ .repaired.json, .qa.json)

 Options: --trusted (execute layouts/helpers; default untrusted) --lenient (allow legacy sample data)
          --prefetch (fetch and embed dataset snapshots before entering the VM; explicit opt-in)
          --json (machine-readable output) --html <runtime.html> --timeout <ms>
 Exit code: 0 = no errors, 1 = errors remain, 2 = usage / IO / version problem.
*/
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DEFAULT_HTML = path.join(ROOT, 'xbrain-presentation-system-v1.0.0.html');
export const SCHEMA_FILE = path.join(ROOT, 'contracts', 'xbrain-deck-v1.schema.json');

// Everything the runtime touches at load time, created inside the context (no host references).
const PRELUDE = `
var window = globalThis, self = globalThis, __logs = [];
var console = { log(){}, info(){}, debug(){},
  warn(...a){ __logs.push('warn: ' + a.map(String).join(' ')); }, error(...a){ __logs.push('error: ' + a.map(String).join(' ')); } };
var __noop = function(){};
var document = { addEventListener: __noop, removeEventListener: __noop, getElementById(){ return null; },
  querySelector(){ return null; }, querySelectorAll(){ return []; }, readyState: 'complete' };
window.addEventListener = __noop; window.removeEventListener = __noop;
var localStorage = { getItem(){ return null; }, setItem: __noop, removeItem: __noop };
var navigator = { userAgent: 'xbrain-compiler' };
`;

export function readRuntimeParts(htmlFile = DEFAULT_HTML) {
  const html = fs.readFileSync(htmlFile, 'utf8');
  const match = html.match(/<script>\s*\/\/ Application modules[\s\S]*?<\/script>/);
  if (!match) throw new Error('Cannot locate the application script in ' + htmlFile);
  const script = match[0].replace(/^<script>/, '').replace(/<\/script>$/, '');
  const head = html.slice(0, html.indexOf('</head>'));
  const css = [...head.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n');
  const sprite = (html.match(/<svg width="0" height="0" class="(?:v1-svg-defs|hidden)" aria-hidden="true"(?: style="[^"]*")?>[\s\S]*?<\/svg>/) || [''])[0]
    .replace('class="hidden"', 'style="position:absolute;width:0;height:0;overflow:hidden"');
  const fonts = [...head.matchAll(/<link[^>]+fonts\.(?:googleapis|gstatic)\.com[^>]*>/g)].map(m => m[0]).join('\n') + '\n';
  return { html, script, css, sprite, fonts };
}

export function loadRuntime({ htmlFile = DEFAULT_HTML, trusted = false, timeout = 30000 } = {}) {
  const parts = readRuntimeParts(htmlFile);
  // The global must belong to the new realm: a host-created sandbox object would expose the host
  // Function constructor through globalThis.constructor.constructor (classic vm escape → process).
  const isolated = vm.constants?.DONT_CONTEXTIFY ?? Object.create(null);
  const context = vm.createContext(isolated, { name: 'xbrain-runtime', codeGeneration: { strings: trusted, wasm: false } });
  vm.runInContext(PRELUDE, context, { timeout });
  vm.runInContext(parts.script, context, { filename: 'xbrain-runtime.js', timeout });
  if (vm.runInContext('typeof XBrainCompiler', context) !== 'object') throw new Error('XBrainCompiler is not defined by the runtime');
  // Calls exchange JSON strings only, so no object from either realm leaks into the other.
  const call = (method, ...args) => {
    context.__args = JSON.stringify(args);
    const out = vm.runInContext(`JSON.stringify(XBrainCompiler.${method}(...JSON.parse(__args)))`, context, { timeout });
    return out === undefined ? undefined : JSON.parse(out);
  };
  const logs = () => JSON.parse(vm.runInContext('JSON.stringify(__logs.splice(0))', context));
  return { call, logs, parts };
}

// Chrome/Edge headless pixel QA on the static build (optional).
export function findBrowser() {
  const candidates = [process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  return candidates.find(p => p && fs.existsSync(p)) || null;
}
export function browserMeasure(staticHtml, measureSource, { browser = findBrowser(), budget = 8000 } = {}) {
  if (!browser) return { available: false, diagnostics: [] };
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xbrain-qa-'));
  const file = path.join(dir, 'qa.html');
  const probe = `<script>(function(){var measure=${measureSource};function run(){var r=measure(document.body);var s=document.createElement('script');s.type='application/json';s.id='xb-qa-result';s.textContent=JSON.stringify(r);document.body.appendChild(s);}
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(run,run);else run();})();</script>`;
  fs.writeFileSync(file, staticHtml.replace('</body>', probe + '\n</body>'));
  const res = spawnSync(browser, ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', '--window-size=1960,1200',
    `--user-data-dir=${path.join(dir, 'profile')}`, `--virtual-time-budget=${budget}`, '--dump-dom', pathToFileURL(file).href],
  { encoding: 'utf8', timeout: 120000, maxBuffer: 512 * 1024 * 1024 });
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* temp cleanup is best effort */ }
  const m = /<script type="application\/json" id="xb-qa-result">([\s\S]*?)<\/script>/.exec(res.stdout || '');
  if (!m) return { available: true, error: (res.stderr || res.error?.message || 'no result').slice(0, 400), diagnostics: [] };
  return { available: true, diagnostics: JSON.parse(m[1]) };
}

function parseArgs(argv) {
  const out = { _: [], flags: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-o') out.flags.out = argv[++i];
    else if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      if (v !== undefined) out.flags[k] = v;
      else if (['out', 'html', 'slide', 'timeout'].includes(k)) out.flags[k] = argv[++i];
      else out.flags[k] = true;
    } else out._.push(a);
  }
  return out;
}
const readDeck = file => {
  if (!file) throw Object.assign(new Error('missing deck path (use - for stdin)'), { exit: 2 });
  const text = file === '-' ? fs.readFileSync(0, 'utf8') : fs.readFileSync(file, 'utf8');
  try { return JSON.parse(text.replace(/^\uFEFF/, '')); } catch (e) { throw Object.assign(new Error(`${file}: invalid JSON (${e.message})`), { exit: 2 }); }
};
const write = (file, text) => { if (!file) { process.stdout.write(text); return; } fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true }); fs.writeFileSync(file, text); };
function formatDiagnostics(list) {
  const icon = { error: 'E', warning: 'W', info: 'i' };
  return list.map(d => `${icon[d.severity] || '?'} ${d.code.padEnd(24)} ${d.path || '/'}  ${d.message}${d.suggestion ? `  → did you mean "${d.suggestion}"?` : ''}`).join('\n');
}
function report(result, flags, extra = '') {
  if (flags.json) return JSON.stringify(result, null, 2) + '\n';
  const s = result.summary || {};
  return `${formatDiagnostics(result.diagnostics || [])}\n${extra}${s.slides != null ? `slides ${s.slides} · ` : ''}errors ${s.errors ?? (result.diagnostics || []).filter(d => d.severity === 'error').length} · warnings ${s.warnings ?? (result.diagnostics || []).filter(d => d.severity === 'warning').length}${s.score != null ? ` · score ${Math.round(s.score)}` : ''}${result.hash ? ` · build ${result.hash}` : ''}\n`;
}

// Network I/O stays outside node:vm. Only serializable snapshot text enters the runtime.
export async function prefetchDeck(input, { fetchData = fetch } = {}) {
  const deck = structuredClone(input);
  if (Array.isArray(deck) || deck?.version !== '1.0') return deck; // version gate precedes all I/O
  const cache = new Map();
  for (const def of Object.values(deck.datasets || {})) {
    if (!def || typeof def !== 'object' || !def.url || def.value !== undefined || def.data !== undefined) continue;
    const url = new URL(def.url);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('prefetch requires an HTTP(S) dataset URL');
    if (!cache.has(def.url)) {
      const response = await fetchData(def.url, { signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error(`prefetch ${def.url}: HTTP ${response.status}`);
      const value = await response.text();
      cache.set(def.url, { value, sha256: createHash('sha256').update(value).digest('hex') });
    }
    const { value, sha256 } = cache.get(def.url);
    def.value = value;
    // Persist the inferred format, so replaying the snapshot never depends on network headers.
    def.type ??= def.format ?? (/\.csv(?:\?|$)/i.test(def.url) ? 'csv' : /\.tsv(?:\?|$)/i.test(def.url) ? 'tsv' : /\.ya?ml(?:\?|$)/i.test(def.url) ? 'yaml' : 'json');
    def.snapshot = { sha256 };
  }
  return deck;
}

function addBrowserQA(result, measurement) {
  const {available, error, diagnostics=[]} = measurement;
  result.browser = {measured: !!available && !error, findings: diagnostics.length, ...(error ? {error} : {})};
  if (!available) result.diagnostics.push({code:'qa.browser-unavailable',severity:'warning',path:'',message:'Browser QA skipped: set CHROME_PATH to a Chrome/Edge executable'});
  else if (error) result.diagnostics.push({code:'qa.browser-failed',severity:'error',path:'',message:'Browser QA failed: '+error});
  else result.diagnostics.push(...diagnostics);
  const counts=severity=>result.diagnostics.filter(d=>d.severity===severity).length;
  result.summary = {...result.summary,errors:counts('error'),warnings:counts('warning'),info:counts('info'),
    score:Math.max(0,100-(counts('error')*25+counts('warning')*4)/Math.max(1,result.summary.slides))};
  if(Array.isArray(result.slides))for(const slide of result.slides){
    const base='/slides/'+slide.index,list=result.diagnostics.filter(d=>d.path===base||d.path.startsWith(base+'/'));
    const n=severity=>list.filter(d=>d.severity===severity).length;
    Object.assign(slide,{errors:n('error'),warnings:n('warning'),info:n('info'),score:Math.max(0,100-n('error')*25-n('warning')*4)});
  }
  result.ok=result.summary.errors===0;
  return result;
}

export async function main(argv = process.argv.slice(2)) {
  const { _: [cmd, file], flags } = parseArgs(argv);
  const opts = { strict: !flags.lenient, trust: flags.trusted ? 'trusted' : 'untrusted' };
  if (flags.prefetch && flags.offline) throw new Error('--prefetch and --offline cannot be combined');
  const readInput = async () => {
    const deck = readDeck(file);
    return flags.prefetch ? prefetchDeck(deck) : deck;
  };
  if (!cmd || cmd === 'help' || flags.help) { process.stdout.write(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0].replace(/^#!.*\n\/\*\n?/, '') + '\n'); return 0; }
  const rt = loadRuntime({ htmlFile: flags.html || DEFAULT_HTML, trusted: !!flags.trusted, timeout: Number(flags.timeout) || 30000 });
  const staticHtml = (compiled, title) => rt.call('staticPage', compiled, { css: rt.parts.css, sprite: rt.parts.sprite, fonts: flags.offline ? '' : rt.parts.fonts, title });
  const appHtml = deck => {
    const json = JSON.stringify(deck).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
    return rt.parts.html.replace(/<script id="v1-embedded-deck" type="application\/json">[\s\S]*?<\/script>/, () => `<script id="v1-embedded-deck" type="application/json">${json}</script>`);
  };
  const errorsIn = r => (r.diagnostics || []).some(d => d.severity === 'error');
  switch (cmd) {
    case 'contract': write(flags.out, JSON.stringify(rt.call('contract'), null, 2) + '\n'); return 0;
    case 'schema': {
      const text = JSON.stringify(rt.call('schema'), null, 2) + '\n';
      if (flags.write) { fs.writeFileSync(SCHEMA_FILE, text); process.stdout.write(`wrote ${path.relative(ROOT, SCHEMA_FILE)}\n`); } else write(flags.out, text);
      return 0;
    }
    case 'validate': { const r = rt.call('validate', await readInput(), opts); write(flags.out, report(r, flags)); return r.diagnostics.some(d => d.code === 'version.unsupported') ? 2 : errorsIn(r) ? 1 : 0; }
    case 'qa': {
      const deck = await readInput(); const r = rt.call('qa', deck, opts);
      if (flags.browser) {
        const compiled = rt.call('compile', deck, opts);
        addBrowserQA(r,browserMeasure(staticHtml(compiled), rt.call('measureSource')));
      }
      write(flags.out, report(r, flags)); return r.diagnostics.some(d => d.code === 'version.unsupported') ? 2 : errorsIn(r) ? 1 : 0;
    }
    case 'repair': {
      const r = rt.call('repair', await readInput(), opts);
      if (flags.out) fs.writeFileSync(flags.out, JSON.stringify(r.document, null, 2) + '\n');
      const changes = r.changes.map(c => `+ ${c.action.padEnd(11)} ${c.path || '/'}  ${c.from !== undefined ? JSON.stringify(c.from) + ' → ' : ''}${c.to !== undefined ? JSON.stringify(c.to) + '  ' : ''}(${c.reason})`).join('\n');
      process.stdout.write(flags.json ? JSON.stringify(flags.out ? { ...r, document: undefined, written: flags.out } : r, null, 2) + '\n' : `${changes}${changes ? '\n' : ''}${report(r, {})}`);
      return r.diagnostics.some(d => d.code === 'version.unsupported') ? 2 : errorsIn(r) ? 1 : 0;
    }
    case 'compile': { const r = rt.call('compile', await readInput(), opts); write(flags.out, JSON.stringify(r, null, 2) + '\n'); if (flags.out) process.stdout.write(report(r, {})); return errorsIn(r) ? 1 : 0; }
    case 'render': {
      const deck = await readInput(); const r = rt.call('compile', deck, opts); const n = Number(flags.slide ?? 1) - 1;
      if (!r.slides[n]) throw Object.assign(new Error(`slide ${n + 1} does not exist (deck has ${r.slides.length})`), { exit: 2 });
      write(flags.out, staticHtml({ ...r, slides: [r.slides[n]] })); if (flags.out) process.stdout.write(report({ ...r, diagnostics: r.slides[n].diagnostics, summary: undefined }, {}));
      return errorsIn({ diagnostics: r.slides[n].diagnostics }) ? 1 : 0;
    }
    case 'build': {
      const deck = await readInput(); const r = rt.call('compile', deck, opts);
      if (!flags.out) throw Object.assign(new Error('build needs -o <file.html>'), { exit: 2 });
      write(flags.out, flags.app ? appHtml(deck) : staticHtml(r));
      process.stdout.write(report(r, {}, `wrote ${flags.out} (${flags.app ? 'editable app with embedded deck' : 'static, script-free slides'})\n`));
      return errorsIn(r) ? 1 : 0;
    }
    case 'pipeline': {
      const deck = await readInput(); const fixed = rt.call('repair', deck, opts);
      if (fixed.diagnostics.some(d => d.code === 'version.unsupported')) { process.stdout.write(report(fixed, flags)); return 2; }
      const compiled = rt.call('compile', fixed.document, opts);
      const out = flags.out || file.replace(/\.json$/i, '') + '.html';
      const base = out.replace(/\.html?$/i, '');
      write(out, staticHtml(compiled));
      fs.writeFileSync(base + '.repaired.json', JSON.stringify(fixed.document, null, 2) + '\n');
      const qa = {ok:compiled.ok,hash:compiled.hash,changes:fixed.changes,summary:compiled.summary,diagnostics:compiled.diagnostics.slice()};
      if(flags.browser)addBrowserQA(qa,browserMeasure(staticHtml(compiled),rt.call('measureSource')));
      fs.writeFileSync(base + '.qa.json', JSON.stringify(qa, null, 2) + '\n');
      process.stdout.write(flags.json ? JSON.stringify(qa, null, 2) + '\n' : `${fixed.changes.length} repair(s) applied\n${report(qa, {}, `wrote ${out}, ${base}.repaired.json, ${base}.qa.json\n`)}`);
      return errorsIn(qa) ? 1 : 0;
    }
    default: throw Object.assign(new Error(`unknown command "${cmd}" (run: node tools/xbrain.mjs help)`), { exit: 2 });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.exitCode = await main(); }
  catch (e) { process.stderr.write(`xbrain: ${e.message}\n`); process.exitCode = e.exit || 2; }
}
