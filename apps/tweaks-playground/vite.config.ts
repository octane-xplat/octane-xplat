import { defineConfig } from 'vite'
import { existsSync } from 'node:fs'
import { octane } from '@octanejs/vite-plugin'
import { tweaks } from '@octane-xplat/tweaks/vite'
import { xplatBamboo } from '@octane-xplat/bamboo/vite'
import { xplatCss, xplatBoundary, xplatDevBridge, xplatNodeEnvDefine } from '@octane-xplat/cli/vite'

// Vite 8's oxc transform resolves each file's governing tsconfig.json and
// follows its project references. Workspace packages whose root tsconfig is
// a references-only solution point at generated env programs under
// node_modules/.cache/xplat-typecheck — which exist only after a typecheck
// run — so transforming cross-package imports fails on an ungenerated
// checkout. Pin the transform to a committed config (env manifest when one
// exists, then the declaration config, else this app's own tsconfig) so dev
// and test runs never depend on generated typecheck state.
const appFile = (name) => new URL(`./${name}`, import.meta.url).pathname
const testTsconfig = existsSync(appFile('tsconfig.envs.json'))
  ? appFile('tsconfig.envs.json')
  : existsSync(appFile('tsconfig.types.json'))
    ? appFile('tsconfig.types.json')
    : appFile('tsconfig.json')

// The web build. tweaks() must come before the Octane plugins.
export default defineConfig(({ mode }) => ({
  tsconfig: testTsconfig,
  plugins: [
    tweaks(),
    xplatCss('web'),
    ...octane(),
    xplatBoundary('web'),
    ...xplatBamboo(),
    xplatDevBridge(),
  ],
  define: xplatNodeEnvDefine(mode),
  server: { port: Number(process.env.TWEAKS_TEST_PORT ?? 5200), strictPort: true },
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
