import { existsSync, realpathSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const runtime = fileURLToPath(new URL('./', import.meta.url))
const coreSpecifier = '@nativescript/core'

/** @satisfies {import('@nativescript/vite/platforms').NativeScriptPlatform} */
const platform = {
  name: 'gtk',
  suffixes: ['.gtk'],
  provider: { root: join(runtime, 'core') },
  capabilities: {},
}

/**
 * Create a Core provider from this package's patched NativeScript toolchain.
 * @param {string} project The consuming app's absolute path.
 */
export async function createNativeScriptProvider(project) {
  let directory = project
  while (!existsSync(join(directory, 'package.json')) && dirname(directory) !== directory) {
    directory = dirname(directory)
  }
  const manifest = join(directory, 'package.json')
  const require = createRequire(import.meta.url)
  const coreRoot = dirname(realpathSync(require.resolve(`${coreSpecifier}/package.json`)))
  const { getPlatformBundleDefines, platformProviderPlugin } = await import(
    pathToFileURL(require.resolve('@nativescript/vite/platforms')).href
  )

  // The upstream plugin leaves shared modules to normal resolution. Pin
  // their package root too so provider and application imports share classes.
  /** @type {import('vite').Plugin} */
  const sharedCore = {
    name: 'xplat:gtk-shared-core',
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
          // Core 9.1.3 expects NativeScript's WeakRef.get() during view setup.
          // GJS provides the standard WeakRef with equivalent deref() behavior.
          banner: [
            'globalThis.global ??= globalThis;',
            'if (globalThis.Zone === 1) delete globalThis.Zone;',
            'if (!WeakRef.prototype.get) Object.defineProperty(WeakRef.prototype, "get", { value: WeakRef.prototype.deref, configurable: true });',
          ].join('\n'),
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
          replacement: join(runtime, 'mason.gtk.mjs'),
        },
        {
          find: /^@octane-xplat\/nativescript-masonkit\/style$/,
          replacement: join(runtime, 'mason.gtk.mjs'),
        },
      ],
    },
  }

  return { config }
}
