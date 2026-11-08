// The standalone app exposes these entry points to browser automation.
declare const XB: import('../types/xbrain').XBrainGlobalApi;
declare const XBrainCompiler: import('../types/xbrain').XBrainCompilerApi;

interface Window {
  [testProperty: `__${string}`]: any;
}
