import { defineConfig } from 'vite';
import { octane } from '@octanejs/vite-plugin';

export default defineConfig({
  plugins: [...octane()],
  // The native dev server prefers 5173 and auto-bumps on collision; the
  // device discovers the actual port from synced app metadata, so only the
  // web port needs pinning to keep the topology deterministic.
  server: { port: 5200 },
  resolve: {
    conditions: ['web'],
    // Suffix chain (first match wins): .web → shared → fallback.
    extensions: [
      '.web.tsrx', '.tsrx',
      '.web.tsx', '.tsx',
      '.web.ts', '.mjs', '.mts', '.ts',
      '.jsx', '.js', '.json',
    ],
  },
});
