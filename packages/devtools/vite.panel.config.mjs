// Builds the web devtools panel to dist/panel/ — a single-page bundle the Go
// dev server hosts under /devtools/app/. base './' keeps asset URLs relative
// so the page works under its mounted prefix. Same web preset pieces as
// apps/web: platform css, the octane renderer, the suffix boundary.
import { defineConfig } from 'vite'
import { octane } from '@octanejs/vite-plugin'
import { css, boundary, nodeEnvDefine } from '@octane-xplat/cli/vite'

// Vite 8's oxc transform resolves each file's governing tsconfig.json and
// follows its project references. This package's root tsconfig is a
// references-only solution pointing at generated env programs under
// node_modules/.cache/xplat-typecheck — which exist only after a typecheck
// run — so every transform fails on an ungenerated checkout. Pin the build
// transform to the package's committed env manifest.
export default defineConfig(({ mode }) => ({
  tsconfig: new URL('./tsconfig.envs.json', import.meta.url).pathname,
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
