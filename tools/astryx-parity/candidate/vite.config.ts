import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { octane } from '@octanejs/vite-plugin'
import { boundary } from '@octane-xplat/cli/vite'

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  // boundary supplies .tsrx leaf resolution plus the foreign-suffix
  // boundary guard — the same plugins apps/web uses, so native leaves stay
  // out of this graph instead of being stubbed over.
  plugins: [...octane(), boundary('web')],
  resolve: {
    conditions: ['web'],
    dedupe: ['octane'],
    extensions: [
      '.web.tsrx',
      '.tsrx',
      '.web.tsx',
      '.tsx',
      '.web.ts',
      '.ts',
      '.mjs',
      '.js',
      '.json',
    ],
  },
})
