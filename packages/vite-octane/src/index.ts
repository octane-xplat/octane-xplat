import { octane, type OctanePluginOptions } from '@octanejs/vite-plugin'
import { mergeConfig, type UserConfig } from 'vite'
import {
  baseConfig,
  getTypeCheckPlugins,
  registerFrameworkFlavor,
  type TypeCheckControlOptions,
} from '@nativescript/vite/framework'
import { nativeScriptRenderers } from '@octane-xplat/nativescript-octane/config'
import { octaneServerStrategy } from './server/strategy.js'

export { octaneServerStrategy } from './server/strategy.js'

/**
 * The flavor registers when this module evaluates, which is before any config
 * helper below can call `baseConfig` — the HMR plugins the base config
 * installs look the server strategy up by name, and the device bundle is
 * seeded with the client module's path at the same time.
 */
registerFrameworkFlavor({
  flavor: 'octane',
  server: octaneServerStrategy,
  client: '@octane-xplat/vite-octane/client',
  // The compiler rewrites `from 'octane'` in the components it owns to
  // `@octane-xplat/nativescript-octane`, which imports only
  // `octane/universal/native`. Seeded as a dependency root, `octane` would
  // vendor its DOM runtime into the dev deps bundle wholesale.
  vendor: { exclude: ['octane'] },
})

export interface OctaneConfigOptions extends TypeCheckControlOptions {
  /**
   * Options for `@octanejs/vite-plugin`. A NativeScript renderer is not one
   * of Octane's built-ins, so `renderers` defaults to the registry of
   * `@octane-xplat/nativescript-octane`, which compiles `src/**\/*.{tsx,tsrx}`
   * for its NativeScript driver; pass your own to change the scope or the
   * renderer.
   */
  octane?: OctanePluginOptions
}

/**
 * Octane renders NativeScript views through a universal host driver the app
 * owns (`octane/universal/native` + a driver that applies host commands to
 * `@nativescript/core` views), with no DOM involved, so the flavor carries no
 * XML registration, no bundler context and no JSX runtime shim. The Octane
 * compiler emits self-accepting `import.meta.hot` wiring while the dev server
 * is serving; the client strategy in `./client` drives that on device.
 */
export const octaneConfig = (
  { mode }: { mode: string },
  options: OctaneConfigOptions = {},
): UserConfig => {
  const octaneOptions: OctanePluginOptions = {
    renderers: nativeScriptRenderers(),
    ...options.octane,
  }
  return mergeConfig(baseConfig({ mode, flavor: 'octane' }), {
    plugins: [...getTypeCheckPlugins('typescript', options.typeCheck), ...octane(octaneOptions)],
  })
}
