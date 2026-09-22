import { defineConfig } from 'vite';
import { octane } from '@octanejs/vite-plugin';

export default defineConfig({
  plugins: [...octane()],
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
