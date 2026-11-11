import { defineConfig } from 'vite'
import { octane } from '@octanejs/vite-plugin'
import { tweaks } from '@octane-xplat/tweaks/vite'
import { xplatBamboo } from '@octane-xplat/bamboo/vite'
import { xplatCss, xplatBoundary, xplatDevBridge, xplatNodeEnvDefine } from '@octane-xplat/cli/vite'

// The web build. tweaks() must come before the Octane plugins.
export default defineConfig(({ mode }) => ({
  plugins: [
    tweaks(),
    xplatCss('web'),
    ...octane(),
    xplatBoundary('web'),
    ...xplatBamboo(),
    xplatDevBridge(),
  ],
  define: xplatNodeEnvDefine(mode),
  server: { port: 5200 },
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
