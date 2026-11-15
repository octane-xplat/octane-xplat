export * from '@octane-xplat/cli/vite'
export { mergeConfig } from 'vite'
export { octane } from '@octanejs/vite-plugin'
export { tweaks } from '@octane-xplat/tweaks/vite'

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

/** Compose the framework's build setup with app-specific Vite options. */
export function defineConfig(config = {}) {
  return async (env) => {
    const platform = buildTarget()
    const app = await (typeof config === 'function' ? config(env) : config)
    let defaults

    if (platform === 'web') {
      defaults = {
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
