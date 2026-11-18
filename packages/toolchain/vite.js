export * from '@octane-xplat/cli/vite'
export { mergeConfig } from 'vite'
export { octane } from '@octanejs/vite-plugin'
export { tweaks } from '@octane-xplat/tweaks/vite'

import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { mergeConfig } from 'vite'
import { octane } from '@octanejs/vite-plugin'
import { tweaks } from '@octane-xplat/tweaks/vite'
import {
  buildTarget,
  css,
  boundary,
  devBridge,
  native,
  nodeEnvDefine,
} from '@octane-xplat/cli/vite'

/**
 * Vite 8's oxc transform resolves each file's governing tsconfig.json and
 * follows its project references. References-style apps point at the env
 * programs `xplat typecheck` generates under node_modules/.cache — absent
 * on a fresh install, so every plain-source transform fails. While a root
 * reference dangles, pin the transform to the committed env manifest; it
 * carries the app's shared compiler options through `extends`.
 */
function transformTsconfig(root) {
  const manifest = join(root, 'tsconfig.envs.json')

  if (!existsSync(manifest) || !existsSync(join(root, 'tsconfig.json'))) {
    return undefined
  }

  const references = readFileSync(join(root, 'tsconfig.json'), 'utf8').matchAll(
    /"path"\s*:\s*"([^"]+)"/g,
  )

  return [...references].some(([, path]) => !existsSync(resolve(root, path))) ? manifest : undefined
}

/** Compose the framework's build setup with app-specific Vite options. */
export function defineConfig(config = {}) {
  return async (env) => {
    const platform = buildTarget()
    const app = await (typeof config === 'function' ? config(env) : config)
    let defaults

    if (platform === 'web') {
      const tsconfig = transformTsconfig(resolve(app.root ?? '.'))

      defaults = {
        ...(tsconfig ? { tsconfig } : {}),
        plugins: [tweaks(), css(platform), ...octane(), boundary(platform), devBridge()],
        define: nodeEnvDefine(env.mode),
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
      }
    } else if (['ios', 'android', 'visionos', 'windows', 'native'].includes(platform)) {
      defaults = await native(env, { extra: { plugins: [tweaks()] } })
    } else {
      throw new Error(
        `Target ${platform} needs its host-specific Vite preset; import defineConfig from vite for that config`,
      )
    }

    return mergeConfig(defaults, app)
  }
}
