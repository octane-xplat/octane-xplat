/** Vite configuration, Octane compilation, and Xplat platform presets. */
export * from '@octane-xplat/cli/vite'
export { mergeConfig } from 'vite'
export { octane } from '@octanejs/vite-plugin'
export { tweaks } from '@octane-xplat/tweaks/vite'

import type { ConfigEnv, UserConfig, UserConfigExport } from 'vite'

/** A configuration callback that resolves the framework setup for each invocation. */
export type XplatViteConfig = (env: ConfigEnv) => Promise<UserConfig>

/** Compose Octane compilation, platform CSS, module boundaries, tweaks and the
 * development bridge with app-specific options. The xplat command selects the
 * target; direct NativeScript commands use their invocation target and direct
 * Vite defaults to web. Desktop hosts use their separate presets.
 * Do not add the framework plugins a second time to this configuration.
 * @example
 * import { defineConfig } from 'octane-xplat/vite'
 * export default defineConfig({ server: { port: 5200 } })
 */
export function defineConfig(config?: UserConfigExport): XplatViteConfig
