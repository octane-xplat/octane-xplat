import { boundary, nodeEnvDefine } from '@octane-xplat/cli/vite'
import { octane } from '@octanejs/vite-plugin'
import { defineConfig } from 'vite'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => ({
  root: resolve(appRoot, 'webview-packaged-proof'),
  base: './',
  plugins: [...octane(), boundary('web')],
  define: nodeEnvDefine(mode),
  resolve: {
    conditions: ['web'],
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
  },
  build: {
    outDir: resolve(appRoot, 'dist/webview-packaged-proof'),
    emptyOutDir: true,
  },
}))
