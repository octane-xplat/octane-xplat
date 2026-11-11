// Builds the web devtools panel to dist/panel/ — a single-page bundle the Go
// dev server hosts under /devtools/app/. base './' keeps asset URLs relative
// so the page works under its mounted prefix. Same web preset pieces as
// apps/web: platform css, the octane renderer, the suffix boundary.
import { defineConfig } from 'vite'
import { octane } from '@octanejs/vite-plugin'
import { css, boundary, nodeEnvDefine } from '@octane-xplat/cli/vite'

export default defineConfig(({ mode }) => ({
  root: 'src/panel',
  plugins: [css('web'), ...octane(), boundary('web')],
  define: nodeEnvDefine(mode),
  base: './',
  build: {
    outDir: '../../dist/panel',
    emptyOutDir: true,
    rollupOptions: { input: 'index.html' },
  },
  resolve: {
    conditions: ['web'],
    // Suffix chain (first match wins): .web → shared → fallback.
    extensions: [
      '.web.tsrx',
      '.tsrx',
      '.web.tsx',
      '.tsx',
      '.web.ts',
      '.mjs',
      '.mts',
      '.ts',
      '.jsx',
      '.js',
      '.json',
    ],
    dedupe: ['octane'],
  },
}))
