export type SlideGroup = string;
export type AppMode = "workspace" | "gallery" | "brand";

export interface XBrainLayoutMeta {
  type: string;
  group?: SlideGroup;
  name: string;
  desc: string;
  limits?: Record<string, number>;
  custom?: boolean;
}

export interface XBrainComponentPosition {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface XBrainDataTransform {
  filter?: {
    field: string;
    eq?: unknown;
    ne?: unknown;
    gt?: number;
    lt?: number;
  };
  sortBy?: string;
  order?: "asc" | "desc";
  limit?: number;
  offset?: number;
  groupBy?: string;
  aggregateField?: string;
  agg?: "sum" | "avg" | "min" | "max" | "count";
  select?: string[];
  exclude?: string[];
  derive?: Record<string, unknown>;
  join?: {
    leftKey: string;
    rightDataset: string;
    rightKey: string;
    prefix?: string;
    select?: string[];
  };
}

export interface XBrainComponent {
  id?: string;
  type: string;
  variant?: string;
  fallback?: string;
  span?: number;
  height?: number;
  minHeight?: number;
  position?: XBrainComponentPosition;
  style?: Record<string, string | number | null>;
  dataRef?: string;
  dataset?: unknown;
  data?: unknown;
  transform?: XBrainDataTransform;
  children?: XBrainComponent[];
  components?: XBrainComponent[];
  items?: any[];
  nodes?: any[];
  steps?: any[];
  edges?: any[];
  columns?: number | Array<string | { key: string; label: string }>;
  maxNodes?: number;
  value?: string | number;
  options?: Record<string, any>;
  option?: Record<string, any>;
  title?: string;
  label?: string;
  text?: string;
  content?: string;
  subtitle?: string;
  delta?: string;
  alt?: string;
  assetRef?: string;
  author?: string;
  center?: string;
  code?: string;
  color?: string;
  href?: string;
  html?: string;
  initials?: string;
  markdown?: string;
  name?: string;
  poster?: string;
  role?: string;
  source?: string;
  src?: string;
  svg?: string;
  symbol?: string;
  url?: string;
  radius?: string | number;
}

export interface XBrainSlide {
  id: string;
  type: string;
  group?: SlideGroup;
  layoutName: string;
  title?: string;
  subtitle?: string;
  section?: string;
  background?: string;
  variant?: string;
  layout?: "auto" | "freeform";
  customCss?: string;
  css?: string | string[];
  render?: string | string[];
  template?: string | string[];
  frame?: string;
  chrome?: Record<string, string>;
  content: Record<string, any>;
  components?: XBrainComponent[];
}

export interface XBrainDeckConfig {
  version: string;
  releaseVersion?: string;
  metadata?: {
    name?: string;
    note?: string;
    [key: string]: any;
  };
  meta?: Record<string, any>;
  theme?: {
    preset?: string;
    tokens?: {
      primary?: string;
      ink?: string;
      teal?: string;
      background?: string;
    };
  };
  datasets?: Record<string, any>;
  assets?: Record<string, string>;
  customCss?: string;
  savedAt?: string;
  layouts?: Record<string, any>;
  helpers?: Record<string, any>;
  chrome?: Record<string, string>;
}

export interface XBrainDeckDocument extends XBrainDeckConfig {
  slides: XBrainSlide[];
}

export interface XBrainDiagnostic {
  code: string;
  severity: "error" | "warning" | "info";
  path: string;
  message: string;
  selector?: string | null;
  sourcePath?: string | null;
  suggestion?: string | null;
  bounds?: {
    coordinateSpace: string;
    x: number;
    y: number;
    width: number;
    height: number;
  };
  [key: string]: any;
}

export interface XBrainQASummary {
  slides: number;
  errors: number;
  warnings: number;
  info: number;
  score: number;
}

export interface XBrainCompiledSlide {
  index: number;
  id: string;
  type: string;
  html: string;
  hash: string;
  diagnostics: XBrainDiagnostic[];
}

export interface XBrainCompileResult {
  ok: boolean;
  compiler: string;
  release?: string;
  schemaVersion?: string;
  options: Record<string, any>;
  hash?: string;
  document?: XBrainDeckDocument;
  slides: XBrainCompiledSlide[];
  diagnostics: XBrainDiagnostic[];
  summary: XBrainQASummary;
}

export interface XBrainQAResult {
  ok: boolean;
  compiler: string;
  hash?: string;
  options: Record<string, any>;
  summary: XBrainQASummary;
  slides: Array<{
    index: number;
    id: string;
    type: string;
    slides: number;
    errors: number;
    warnings: number;
    info: number;
    score: number;
  }>;
  diagnostics: XBrainDiagnostic[];
}

export interface XBrainRepairChange {
  path: string;
  action: string;
  from?: any;
  to?: any;
  reason: string;
  parts?: number;
}

export interface XBrainRepairResult {
  ok: boolean;
  document: XBrainDeckDocument;
  changes: XBrainRepairChange[];
  diagnostics: XBrainDiagnostic[];
  summary?: XBrainQASummary;
}

export interface XBrainCompilerApi {
  version: string;
  schema: () => Record<string, any>;
  contract: () => Record<string, any>;
  builtinDeck: () => XBrainDeckDocument;
  validate: (
    doc: any,
    opts?: Record<string, any>,
  ) => { ok: boolean; diagnostics: XBrainDiagnostic[] };
  compile: (doc: any, opts?: Record<string, any>) => XBrainCompileResult;
  qa: (doc: any, opts?: Record<string, any>) => XBrainQAResult;
  repair: (doc: any, opts?: Record<string, any>) => XBrainRepairResult;
  staticPage: (
    compiled: XBrainCompileResult,
    opts?: { css?: string; sprite?: string; title?: string; fonts?: string },
  ) => string;
  tableSnapshots: (
    doc: any,
    opts?: Record<string, any>,
  ) => { ok: boolean; tables: any[]; errors: any[] };
  measure: (root: ParentNode) => XBrainDiagnostic[];
  measureSource: () => string;
  hash: (str: string) => string;
  codes: Record<string, string>;
}

export interface XBrainGlobalApi {
  version: string;
  schemaVersion: string;
  getDeck: () => XBrainDeckDocument;
  setDeck: (doc: any) => number;
  import: (obj: any, index?: number) => "pack" | "slides" | "deck";
  merge: (pack: any) => { layouts: string[]; errors: string[] };
  defineLayout: (
    type: string,
    def: any,
  ) => { layouts: string[]; errors: string[] };
  removeLayout: (type: string) => { layouts: string[]; errors: string[] };
  defineHelper: (
    name: string,
    src: any,
  ) => { layouts: string[]; errors: string[] };
  layouts: () => XBrainLayoutMeta[];
  sample: (type: string) => any;
  slides: () => XBrainSlide[];
  addSlide: (
    type: string,
    content?: any,
    index?: number,
    extra?: Record<string, any>,
  ) => string;
  insertSlides: (list: any, index?: number) => string[];
  updateSlide: (index: number, patch: Record<string, any>) => void;
  replaceSlide: (index: number, slide: any) => void;
  removeSlide: (index: number) => void;
  moveSlide: (from: number, to: number) => void;
  render: (slideOrIndex: number | any, index?: number) => string;
  select: (i: number) => void;
  undo: () => void;
  redo: () => void;
  errors: () => string[];
  chromeFields: () => Array<{
    key: string;
    label: string;
    store: string;
    value: string;
    slides: number[];
  }>;
  setChrome: (
    key: string,
    value: string,
    scope?: "current" | "all" | [number, number],
  ) => number;
  exportHTML: () => string;
  exportJSON: () => string;
  ctx: Record<string, any>;
  compiler: XBrainCompilerApi;
  qa: (opts?: Record<string, any>) => XBrainQAResult;
  repair: (opts?: Record<string, any>) => XBrainRepairResult;
  agent: Record<string, any>;
}

declare global {
  interface Window {
    XB: XBrainGlobalApi;
    XBrainCompiler: XBrainCompilerApi;
    echarts?: any;
    mermaid?: any;
  }
}
