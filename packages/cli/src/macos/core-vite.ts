import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { UserConfig } from 'vite'
import { inlineStylesheets } from '../inline-stylesheets.ts'
import { boundary, css, nodeEnvDefine } from '../vite.ts'

interface CoreMacOSOptions {
  root: string
  entry: string
  outDir: string
  hmr?: boolean
  fileName?: string
  external?: readonly string[]
}

export interface CoreMacOSConfig {
  config: UserConfig
  coreRoot: string
}

/** Assemble the Core runtime with the macOS host's normal build contracts. */
export async function createCoreMacOSConfig(
  mode: string,
  options: CoreMacOSOptions,
): Promise<CoreMacOSConfig> {
  const root = resolve(options.root)
  const require = createRequire(join(root, 'package.json'))
  const fromApp = (name: string) => import(pathToFileURL(require.resolve(name)).href)
  const [
    { createNativeScriptProvider },
    { nativeScriptRenderer },
    { octane },
  ] = await Promise.all([
    fromApp('@octane-xplat/macos-appkit/core-provider'),
    fromApp('@octane-xplat/nativescript-octane/config'),
    fromApp('octane/compiler/vite'),
  ])
  const { config: provider, coreRoot, reusedCoreFiles } = await createNativeScriptProvider(root)
  const appKitSource = dirname(require.resolve('@octane-xplat/macos-appkit/host'))

  const config: UserConfig = {
    root,
    define: {
      ...provider.define,
      ...nodeEnvDefine(mode),
      __DEV__: JSON.stringify(mode === 'development'),
      __WINDOWS__: 'false',
    },
    plugins: [
      ...provider.plugins,
      css('macos'),
      inlineStylesheets('nativescript'),
      boundary('macos', new Set<string>(reusedCoreFiles)),
      octane({
        hmr: options.hmr ?? false,
        exclude: ['types/macos'],
        renderers: {
          registry: { nativescript: { ...nativeScriptRenderer, intrinsics: '@octane-xplat/jsx' } },
          rules: [{ include: '**/*.{tsx,tsrx}', renderer: 'nativescript' }],
        },
      }),
    ],
    resolve: {
      conditions: ['macos', 'native'],
      dedupe: ['octane'],
      alias: [
        ...provider.resolve.alias,
        {
          find: /^@octane-xplat\/macos-appkit$/,
          replacement: join(appKitSource, 'nativescript-renderer.macos.ts'),
        },
        {
          find: /^@octane-xplat\/macos-appkit\/host$/,
          replacement: join(appKitSource, 'nativescript-host.macos.ts'),
        },
        { find: /^octane$/, replacement: 'octane/universal/native' },
      ],
    },
    build: {
      cssCodeSplit: true,
      outDir: options.outDir,
      lib: {
        entry: options.entry,
        fileName: () => options.fileName ?? 'main.cjs',
        formats: ['cjs'],
      },
      rollupOptions: {
        external: ['@nativescript/macos-node-api', /^node:/, ...(options.external ?? [])],
        output: { ...provider.build.rollupOptions.output, codeSplitting: false },
      },
    },
  }
  return { config, coreRoot }
}
