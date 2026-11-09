import { defineConfig } from 'vite'
import { octane } from 'octane/compiler/vite'
import { xplatCss, xplatBoundary, xplatNodeEnvDefine } from '@octane-xplat/build/vite'
import { xplatTailwind } from '@octane-xplat/tailwind/vite'

export default defineConfig(({ mode }) => ({
  plugins: [xplatCss('web'), octane(), xplatTailwind(), xplatBoundary('web')],
  define: xplatNodeEnvDefine(mode),
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
  build: { outDir: '../app-dist', emptyOutDir: true },
}))
