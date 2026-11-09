import { defineConfig } from 'vite'
import { octane } from '@octanejs/vite-plugin'
import { css, boundary, devBridge, nodeEnvDefine } from '@octane-xplat/cli/vite'
import { bamboo } from '@octane-xplat/bamboo/vite'
import { fileURLToPath } from 'node:url'

const bambooRoot = fileURLToPath(new URL('../../packages/app/', import.meta.url))

export default defineConfig(({ mode }) => ({
  plugins: [
    css('web'),
    ...octane(),
    bamboo({ cwd: bambooRoot, configPath: `${bambooRoot}bamboo.config.ts` }),
    boundary('web'),
    devBridge(),
  ],
  define: nodeEnvDefine(mode),
  // The native dev server prefers 5173 and auto-bumps on collision; the
  // device discovers the actual port from synced app metadata, so only the
  // web port needs pinning to keep the topology deterministic.
  server: { port: 5200 },
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
