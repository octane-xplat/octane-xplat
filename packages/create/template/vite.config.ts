import { defineConfig, octane, css, boundary, devBridge, nodeEnvDefine } from 'octane-xplat/vite'

// The web build. For native (iOS/Android), the same source runs through
// @nativescript-community/vite-octane with `conditions: ['native']`, the
// .ios/.android/.mobile suffix chain, and the unsuffixed native default — see
// the octane-xplat repo's apps/mobile/vite.config.mts.
export default defineConfig(({ mode }) => ({
  plugins: [css('web'), ...octane(), boundary('web'), devBridge()],
  define: nodeEnvDefine(mode),
  server: { port: 5200 },
  resolve: {
    conditions: ['web'],
    // Suffix chain (first match wins): .web → shared → fallback.
    // boundary also uses this order for dependency optimization in dev.
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
