import { defineConfig } from 'vite'
import { octane } from '@octanejs/vite-plugin'
import { boundary, nodeEnvDefine } from '@octane-xplat/cli/vite'

export default defineConfig(({ mode }) => ({
  plugins: [...octane(), boundary('web')],
  define: nodeEnvDefine(mode),
  server: { port: 5300 },
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
}))
