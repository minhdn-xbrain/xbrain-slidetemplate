import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

// Load the same TypeScript modules and asset plugins as the application.
const server = await createServer({ logLevel: 'error', server: { middlewareMode: true }, appType: 'custom' });
try {
  const { XBrainCompiler } = await server.ssrLoadModule('/src/store/xbrainStore.ts');
  const output = new URL('../contracts/xbrain-deck-v1.schema.json', import.meta.url);
  await writeFile(output, JSON.stringify(XBrainCompiler.schema(), null, 2) + '\n');
  console.log(`Schema written to ${fileURLToPath(output)}`);
} finally {
  await server.close();
}
