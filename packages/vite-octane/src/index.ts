import { octane, type OctanePluginOptions } from '@octanejs/vite-plugin'
import { mergeConfig, type UserConfig } from 'vite'
import * as defaultFramework from '@nativescript/vite/framework'
import type { TypeCheckControlOptions } from '@nativescript/vite/framework'
import { nativeScriptRenderers } from '@octane-xplat/nativescript-octane/config'
import { createOctaneServerStrategy, octaneServerStrategy } from './server/strategy.js'

export { octaneServerStrategy } from './server/strategy.js'

/**
 * The flavor registers when this module evaluates, which is before any config
 * helper below can call `baseConfig` — the HMR plugins the base config
 * installs look the server strategy up by name, and the device bundle is
 * seeded with the client module's path at the same time.
 */
function registerOctaneFlavor(framework: typeof defaultFramework, server = octaneServerStrategy) {
  framework.registerFrameworkFlavor({
    flavor: 'octane',
    server,
    client: '@octane-xplat/vite-octane/client',
    // The compiler redirects Octane to the universal runtime. Exclude the
    // bare dependency so the vendor bundle omits the DOM runtime.
    vendor: { exclude: ['octane'] },
  })
}

registerOctaneFlavor(defaultFramework)

export interface OctaneConfigOptions extends TypeCheckControlOptions {
  /** The app-selected NativeScript Vite framework when using a platform preview. @internal */
  framework?: typeof defaultFramework
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
  const framework = options.framework ?? defaultFramework
  if (framework !== defaultFramework) {
    registerOctaneFlavor(framework, createOctaneServerStrategy(framework))
  }
  const octaneOptions: OctanePluginOptions = {
    renderers: nativeScriptRenderers(),
    ...options.octane,
  }
  return mergeConfig(framework.baseConfig({ mode, flavor: 'octane' }), {
    // NativeScript warms the device graph through /ns/m. Vite's speculative
    // client transforms compete with those requests and bypass that cache.
    server: { preTransformRequests: false },
    plugins: [
      ...framework.getTypeCheckPlugins('typescript', options.typeCheck),
      ...octane(octaneOptions),
    ],
  })
}
