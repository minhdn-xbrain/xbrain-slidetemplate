import readline from 'node:readline';
import { createServer } from 'vite';

// Keep Vite's actual module loader alive for the Python contract regressions.
const server = await createServer({ logLevel: 'silent', server: { middlewareMode: true }, appType: 'custom' });
const modules = await server.ssrLoadModule('/src/store/xbrainStore.ts');
const rt = { call: (method, ...args) => modules.XBrainCompiler[method](...args) };
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const lines = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
for await (const line of lines) {
  try {
    const { script, input } = JSON.parse(line);
    let output = '';
    const testProcess = { stdout: { write: text => { output += text; } } };
    await new AsyncFunction('rt', 'input', 'modules', 'server', 'process', script)(rt, input, modules, server, testProcess);
    process.stdout.write(JSON.stringify({ output }) + '\n');
  } catch (error) {
    process.stdout.write(JSON.stringify({ error: error?.stack || String(error) }) + '\n');
  }
}
await server.close();
