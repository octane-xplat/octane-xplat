import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { UserConfig } from 'vite'
import { inlineStylesheets } from '../inline-stylesheets.ts'
import { boundary, css, nodeEnvDefine } from '../vite.ts'
import { nativeDevSocketPlugin } from '../mcp/dev-socket.ts'
import type { XplatMacOSOptions } from './vite-options.ts'
import { coreMacOSUI } from './core-ui.ts'

interface CoreMacOSOptions extends XplatMacOSOptions {
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
  options: CoreMacOSOptions = {},
): Promise<CoreMacOSConfig> {
  const root = resolve(options.root ?? process.cwd())
  const packaged = options.packaged ?? true
  const require = createRequire(join(root, 'package.json'))
  const fromApp = (name: string) => import(pathToFileURL(require.resolve(name)).href)
  const [
    { createNativeScriptProvider, nativeScriptDevImports },
    { nativeScriptRenderer },
    { octane },
  ] = await Promise.all([
    fromApp('@octane-xplat/macos-appkit/core-provider'),
    fromApp('@octane-xplat/nativescript-octane/config'),
    fromApp('octane/compiler/vite'),
  ])
  const { config: provider, coreRoot, reusedCoreFiles } = await createNativeScriptProvider(root)
  const appKitSource = dirname(require.resolve('@octane-xplat/macos-appkit/host'))
  const ui = coreMacOSUI(root)
  const external = new Set<string>(options.external)
  if (!packaged) {
    for (const name of [...nativeScriptDevImports, '@octane-xplat/macos-appkit']) {
      external.add(name)
    }
  }
  const devSocket = mode === 'development' ? nativeDevSocketPlugin() : null

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
      ...ui.plugins,
      ...(devSocket ? [devSocket] : []),
      css('macos'),
      inlineStylesheets('nativescript'),
      boundary('macos', new Set<string>([...reusedCoreFiles, ...ui.reusedFiles])),
      octane({
        hmr: options.hmr ?? false,
        exclude: ['types/macos', ...(options.exclude ?? [])],
        renderers: {
          registry: { nativescript: { ...nativeScriptRenderer, intrinsics: '@octane-xplat/jsx' } },
          rules: options.rules ?? [{ include: '**/*.{tsx,tsrx}', renderer: 'nativescript' }],
        },
      }),
    ],
    resolve: {
      conditions: ['macos', 'native'],
      dedupe: ['octane'],
      extensions: ['.macos.tsrx', '.tsrx', '.macos.tsx', '.tsx', '.macos.ts', '.ts', '.mts', '.jsx', '.js', '.json'],
      alias: [
        ...provider.resolve.alias,
        ...ui.aliases,
        {
          find: /^@octane-xplat\/macos-appkit$/,
          replacement: join(appKitSource, 'nativescript-renderer.macos.ts'),
        },
        {
          find: /^@octane-xplat\/macos-appkit\/host$/,
          replacement: join(appKitSource, 'nativescript-host.macos.ts'),
        },
        ...(!external.has('@octane-xplat/nativescript-octane')
          ? [{
              find: /^@octane-xplat\/nativescript-octane$/,
              replacement: require.resolve('@octane-xplat/nativescript-octane'),
            }]
          : []),
        { find: /^octane$/, replacement: 'octane/universal/native' },
      ],
    },
    build: {
      cssCodeSplit: true,
      outDir: options.outDir ?? (packaged ? 'dist/package-build' : 'dist'),
      emptyOutDir: packaged,
      lib: {
        entry: options.entry ?? (packaged ? 'src/main.ts' : 'src/App.tsx'),
        fileName: () => options.fileName ?? (packaged ? 'main.cjs' : 'app.cjs'),
        formats: ['cjs'],
      },
      rollupOptions: {
        external: ['@nativescript/macos-node-api', /^node:/, ...external],
        output: { ...provider.build.rollupOptions.output, codeSplitting: false },
      },
    },
  }
  return { config, coreRoot }
}
