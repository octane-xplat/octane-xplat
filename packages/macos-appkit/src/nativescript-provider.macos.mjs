import { existsSync, realpathSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const runtime = fileURLToPath(new URL('../platforms/nativescript/', import.meta.url))
const coreSpecifier = '@nativescript/core'

/** @satisfies {import('@nativescript/vite/platforms').NativeScriptPlatform} */
const platform = {
  name: 'macos',
  family: 'apple',
  suffixes: ['.macos'],
  provider: { root: join(runtime, 'core') },
  reuse: {
    'timer/index': '.ios',
    'application-settings/index': '.ios',
    'file-system/file-system-access': '.ios',
    'text/index': '.ios',
    'animation-frame/animation-native': '.ios',
    'ui/utils': '.ios',
    'ui/core/control-state-change/index': '.ios',
    'ui/layouts/layout-base': '.ios',
    'ui/layouts/grid-layout/index': '.ios',
    'ui/layouts/stack-layout/index': '.ios',
  },
  capabilities: {
    propertyChangesRequestLayout: true,
    textChangeAffectsLayout: true,
  },
}

/**
 * Create a Core provider using the consuming app's patched NativeScript toolchain.
 * @param {string} project The consuming app's absolute path.
 */
export async function createNativeScriptProvider(project) {
  const manifest = join(project, 'package.json')
  const require = createRequire(manifest)
  const coreRoot = dirname(realpathSync(require.resolve(`${coreSpecifier}/package.json`)))
  const { getPlatformBundleDefines, platformProviderPlugin } = await import(
    pathToFileURL(require.resolve('@nativescript/vite/platforms')).href
  )

  // The upstream plugin leaves shared modules to normal resolution. Pin
  // their package root too so provider and application imports share classes.
  /** @type {import('vite').Plugin} */
  const sharedCore = {
    name: 'xplat:macos-shared-core',
    enforce: 'pre',
    resolveId(source) {
      if (source !== coreSpecifier && !source.startsWith(`${coreSpecifier}/`)) {
        return
      }

      const id = source === coreSpecifier ? 'index' : source.slice(coreSpecifier.length + 1)
      const modulePath = join(coreRoot, id)
      for (const ext of ['.js', '.mjs']) {
        for (const candidate of [`${modulePath}${ext}`, join(modulePath, `index${ext}`)]) {
          if (existsSync(candidate)) {
            return candidate
          }
        }
      }
    },
  }

  /** @satisfies {import('vite').UserConfig} */
  const config = {
    build: {
      rollupOptions: {
        output: {
          // A resolved Core dependency can evaluate before the app entry.
          banner: 'globalThis.global ??= globalThis; if (globalThis.Zone === 1) delete globalThis.Zone;',
        },
      },
    },
    define: {
      ...getPlatformBundleDefines(platform),
      __COMMONJS__: 'false',
      __NS_WEBPACK__: 'false',
      __non_webpack_require__: 'globalThis.require',
      __NS_ENV_VERBOSE__: 'false',
      __NS_TARGET_FLAVOR__: '"none"',
      __NS_CLIENT_STRATEGY_URL__: '""',
      __NS_HMR_PROGRESS_OVERLAY_ENABLED__: 'false',
      __CSS_PARSER__: '"css-tree"',
      __UI_USE_XML_PARSER__: 'true',
      __UI_USE_EXTERNAL_RENDERER__: 'false',
      __TEST__: 'false',
      __CI__: 'false',
      __NS_APP_ROOT_DIR__: '"/app"',
      __NS_APP_ROOT_VIRTUAL__: '"/src"',
      'global.isVisionOS': 'false',
    },
    plugins: [platformProviderPlugin({ platform, coreRoot }), sharedCore],
    resolve: {
      alias: [
        { find: '~/package.json', replacement: manifest },
        {
          find: /^@octane-xplat\/nativescript-masonkit$/,
          replacement: join(runtime, 'mason/index.js'),
        },
        {
          find: /^@octane-xplat\/nativescript-masonkit\/style$/,
          replacement: join(runtime, 'mason/style.js'),
        },
      ],
    },
  }

  return { config, coreRoot }
}
