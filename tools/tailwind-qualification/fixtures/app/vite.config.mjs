import { defineConfig } from 'vite'
import { octane } from 'octane/compiler/vite'
import { css, boundary, nodeEnvDefine } from '@octane-xplat/build/vite'
import { tailwind } from '@octane-xplat/tailwind/vite'

export default defineConfig(({ mode }) => ({
  plugins: [css('web'), octane(), tailwind(), boundary('web')],
  define: nodeEnvDefine(mode),
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
