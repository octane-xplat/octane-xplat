import { defineConfig } from 'vite'
import { octane } from '@octanejs/vite-plugin'
import { css, boundary, devBridge, nodeEnvDefine } from '@octane-xplat/cli/vite'

// Web build of the Astryx sandbox replica. Platform leaves follow the shared
// suffix chain: .web wins over the unsuffixed default — there is no native
// host for this app yet.
export default defineConfig(({ mode }) => ({
  plugins: [css('web'), ...octane(), boundary('web'), devBridge()],
  define: nodeEnvDefine(mode),
  server: { port: 5240 },
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
  },
}))
