// @ts-nocheck — .mjs-style module; annotations pending (transitional)
import { createRequire } from 'node:module'
import { chmodSync, existsSync, readFileSync, realpathSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { boundary, nodeEnvDefine, css } from '../vite.ts'
import { inlineStylesheets } from '../inline-stylesheets.ts'
import { nativeGiProjection } from './native-gi-projection.ts'
import { installedGtkRuntimeRoot, stageGtkRuntime, writeGtkRuntimeLauncher } from '../linux/gtk-runtime.ts'

function hostRuntime(root: string) {
  const architecture = process.arch === 'x64' ? 'x86_64' : process.arch === 'arm64' ? 'aarch64' : null
  const payload = installedGtkRuntimeRoot(root)
  return architecture && payload ? { architecture, path: join(payload, architecture) } : null
}

export function hasGtkDevelopmentRuntime(root: string) {
  const runtime = hostRuntime(root)
  return Boolean(runtime && existsSync(join(runtime.path, 'ns-linux')))
}

export function stageGtkDevelopmentRuntime(root: string, outDir: string, bundle: string) {
  const runtime = hostRuntime(root)
  if (!runtime) {
    throw new Error('GTK development requires the installed NativeScript Linux runtime for this host')
  }
  const directory = join(outDir, 'runtime')
  if (stageGtkRuntime(runtime.path, directory) !== runtime.architecture) {
    throw new Error(`GTK development runtime must match ${runtime.architecture}`)
  }
  writeGtkRuntimeLauncher(outDir, 'launch', bundle, runtime.architecture)
  return { executable: join(outDir, 'launch'), schema: join(directory, 'gi.json') }
}

const renderer = '@octane-xplat/linux-gtk'

/** Slot-compiled modules can emit the same `withSlot`/`hookSlots`
 *  import binding in two import statements of a single module (octane's
 *  universal compiler dedupes `hookSlots` intra-file but not `withSlot` —
 *  e.g. `Button.tsrx`; plain `.ts` hook helpers emit duplicate `hookSlots`
 *  under generated `_$hookSlots$` locals too). Rolldown only dedupes
 *  bindings across modules, so the duplicate survives to a `_$withSlot`
 *  redeclaration error in the merged chunk. Keep the first binding per
 *  export and fold later local names into it. Different specifiers are a
 *  real conflict — bail. */
export function gtkSlotDedupe() {
  return {
    name: 'xplat-gtk-slot-dedupe',
    transform(code, id) {
      if (!/\.(tsrx|tsx|ts|mts|js|mjs)$/.test(id)) {
        return
      }

      if (!code.includes('withSlot as _') && !code.includes('hookSlots as _')) {
        return
      }

      const firstLocal = new Map()
      const firstSpec = new Map()
      const fold = new Map()
      let changed = false
      let out = code.replace(
        /import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"];?/g,
        (stmt, names, spec) => {
          const kept = []

          for (const raw of names.split(',')) {
            const part = raw.trim()
            const m = part.match(/^(withSlot|hookSlots) as (_\$[A-Za-z0-9_$]+)$/)

            if (!m) {
              if (part) {
                kept.push(part)
              }

              continue
            }

            const [, kind, local] = m
            const prev = firstSpec.get(kind)

            if (prev !== undefined && prev !== spec) {
              throw new Error(
                `xplat-gtk-slot-dedupe: ${kind} imported from '${prev}' and '${spec}' in ${id}`,
              )
            }

            if (firstLocal.has(kind)) {
              if (local !== firstLocal.get(kind)) {
                fold.set(local, firstLocal.get(kind))
              }

              changed = true
              continue
            }

            firstLocal.set(kind, local)
            firstSpec.set(kind, spec)
            kept.push(part)
          }

          if (!kept.length) {
            changed = true
            return ''
          }

          return `import { ${kept.join(', ')} } from '${spec}';`
        },
      )

      for (const [from, to] of fold) {
        // `\b` is wrong here: `$` is not a word char, so `_$hookSlots` would
        // match the prefix of `_$hookSlots$1`. Refuse any name continuation.
        const rx = new RegExp(from.replace(/\$/g, '\\$') + '(?![\\w$])', 'g')

        if (rx.test(out)) {
          changed = true
          out = out.replace(rx, to)
        }
      }

      return changed ? { code: out } : undefined
    },
  }
}

/** Shared sources import siblings with explicit extensions so Node can
 *  type-strip them — but the extension pins the native-default leaf and
 *  skips platform resolution. A GTK bundle redirects to the .gtk sibling
 *  when one exists, restoring what extension probing did when the same
 *  imports were extensionless. */
export function gtkLeafResolve() {
  return {
    name: 'xplat-gtk-leaf-resolve',
    resolveId: {
      order: 'pre',
      handler(source, importer) {
        if (!importer || !/^\.{1,2}\//.test(source)) {
          return null
        }

        const match = source.match(/\.(tsrx|tsx|ts|mts|mjs|jsx|js)$/)

        if (!match || source.includes('.gtk.') || source.includes('.d.')) {
          return null
        }

        const stem = source.slice(0, -match[0].length)

        if (stem.endsWith('.gtk')) {
          return null
        }

        const candidate = join(importer, '..', stem + '.gtk' + match[0])

        return existsSync(candidate) ? candidate : null
      },
    },
  }
}

const masonArches = ['x86_64', 'aarch64']
const masonFiles = ['libxplatmason-gtk.so', 'XplatMason-1.0.typelib']

/** Emits the installed renderer package's prebuilt Mason binding into the
 *  bundle — both architectures at xplatmason/<arch>/, where the renderer's
 *  bundled-typelib lookup expects them beside app.js. A missing package or
 *  prebuilt file fails the build rather than shipping a bundle that can
 *  only throw at startup. */
function gtkPrebuiltMason(appRequire) {
  return {
    name: 'xplat-gtk-prebuilt-mason',
    buildStart() {
      let prebuilt

      try {
        prebuilt = join(
          dirname(realpathSync(appRequire.resolve(`${renderer}/package.json`))),
          'platforms/linux/prebuilt',
        )
      } catch (error) {
        throw new Error(
          `xplat-gtk-prebuilt-mason: could not resolve ${renderer} from this app — ` +
            `it must be installed as a dependency (${error.message})`,
        )
      }

      for (const arch of masonArches) {
        for (const name of masonFiles) {
          const source = join(prebuilt, arch, name)

          if (!existsSync(source)) {
            throw new Error(
              `xplat-gtk-prebuilt-mason: ${renderer} has no prebuilt file ${source} — ` +
                `reinstall the package or build native/xplatmason via build-prebuilt.sh`,
            )
          }

          this.emitFile({
            type: 'asset',
            fileName: `xplatmason/${arch}/${name}`,
            source: readFileSync(source),
          })
        }
      }
    },
    writeBundle(options) {
      // Vite writes assets mode 0644; the shared library keeps 0755 so the
      // emitted bundle preserves the shipped permissions.
      for (const arch of masonArches) {
        chmodSync(join(options.dir ?? 'dist', 'xplatmason', arch, 'libxplatmason-gtk.so'), 0o755)
      }
    },
  }
}

export async function linuxGtk(env, options = {}) {
  const mode = typeof env === 'string' ? env : env.mode
  const root = resolve(options.root ?? process.cwd())
  const appRequire = createRequire(join(root, 'package.json'))

  const resolveApp = (name) => realpathSync(appRequire.resolve(name))
  const rendererEntry = resolveApp(renderer)
  const providerEntry = resolveApp(`${renderer}/core-provider`)
  const providerRequire = createRequire(providerEntry)
  const sharedRenderer = providerRequire.resolve('@octane-xplat/nativescript-octane')
  const [{ createNativeScriptProvider }, { nativeScriptRenderer }, { octane }] = await Promise.all([
    import(pathToFileURL(providerEntry).href),
    import(pathToFileURL(providerRequire.resolve('@octane-xplat/nativescript-octane/config')).href),
    import(pathToFileURL(resolveApp('octane/compiler/vite')).href),
  ])
  const { config: provider } = await createNativeScriptProvider(root)
  const rules = options.rules?.map((rule) =>
    rule?.renderer === 'gtk' ? { ...rule, renderer: 'nativescript' } : rule,
  )
  // The universal runtime must be the same module the bundler reaches —
  // resolve through the app's dependency tree, not ours.
  const universalNative = realpathSync(appRequire.resolve('octane/universal/native'))
  const packagedSchema = process.env.XPLAT_GTK_RUNTIME_SCHEMA
  const schema = packagedSchema || options.nativeGiSchema
  const schemaPath = schema && resolve(root, schema)

  return {
    root,
    define: {
      ...provider.define,
      ...nodeEnvDefine(mode),
      __DEV__: JSON.stringify(mode === 'development'),
      ...(schemaPath && {
        print: 'console.log',
        printerr: 'console.error',
        'imports.system.exit': 'process.exit',
      }),
    },
    plugins: [
      ...provider.plugins,
      ...(schemaPath ? [nativeGiProjection(schemaPath, Boolean(packagedSchema))] : []),
      gtkLeafResolve(),
      gtkSlotDedupe(),
      ...(schemaPath ? [] : [gtkPrebuiltMason(appRequire)]),
      css('gtk'),
      inlineStylesheets(),
      boundary('gtk'),
      octane({
        hmr: options.hmr ?? false,
        exclude: options.exclude,
        renderers: {
          // Plain .ts/.js hook modules match no rule — the whole
          // bundle is universal, so the dom default would lower their
          // useMemo/useCallback to the native memoSlot/memoTake/
          // memoPublish ABI (octane/internal/client, CURRENT_SCOPE-
          // bound) instead of the slotted universal useMemo.
          default: 'nativescript',
          registry: { nativescript: { ...nativeScriptRenderer, intrinsics: '@octane-xplat/jsx' } },
          rules: rules ?? [{ include: '**/*.{tsx,tsrx}', renderer: 'nativescript' }],
        },
      }),
    ],
    build: {
      // cssCodeSplit emits the CSS asset at renderChunk time, before the
      // 'pre' generateBundle where Bamboo's survival check and our
      // stylesheet serializer run (lib-mode's merged asset arrives too late).
      cssCodeSplit: true,
      outDir: options.outDir ?? 'dist',
      emptyOutDir: true,
      lib: {
        entry: options.entry ?? 'src/main.ts',
        formats: ['es'],
        fileName: options.fileName ?? 'app',
      },
      rollupOptions: {
        external: (id) => !schemaPath && id.startsWith('gi://'),
        output: { ...provider.build.rollupOptions.output, codeSplitting: false },
      },
    },
    resolve: {
      conditions: ['gtk', 'native'],
      dedupe: ['octane'],
      alias: [
        ...provider.resolve.alias,
        // One universal runtime instance for the app and the renderer.
        { find: /^octane$/, replacement: universalNative },
        // The universal entry resolved by Node imports its sibling signal
        // registry. Client hooks must use that same tree, not the default
        // browser export's independent hook-owner registry.
        ...['signals', 'signals/client', 'signals/server'].map((entry) => ({
          find: new RegExp(`^octane/${entry}$`),
          replacement: join(
            dirname(universalNative),
            entry === 'signals' ? 'signals/index.js' : `${entry}.js`,
          ),
        })),
        { find: /^octane\/universal\/native$/, replacement: universalNative },
        { find: /^@octane-xplat\/nativescript-octane$/, replacement: sharedRenderer },
        // Workspace UI leaves import the selected renderer from their own graph;
        // resolve it through the app without adding a UI renderer dependency.
        { find: /^@octane-xplat\/linux-gtk$/, replacement: rendererEntry },
        // Any depth of relative specifier lands here — shared importers
        // reach the leaf as ../overlays/escape-props, overlays siblings as
        // ./escape-props. The regex must span the whole specifier: alias
        // replacements go through String.replace.
        {
          find: /(^|.*\/)escape-props$/,
          replacement: resolveApp(`${renderer}/compat/escape-props`),
        },
      ],
      extensions: [
        '.gtk.tsrx',
        '.tsrx',
        '.gtk.tsx',
        '.tsx',
        '.gtk.ts',
        '.gtk.mts',
        '.gtk.mjs',
        '.mjs',
        '.mts',
        '.ts',
        '.jsx',
        '.js',
        '.json',
      ],
    },
  }
}

/** @deprecated Use {@link linuxGtk}. */
export const xplatLinuxGtk: typeof linuxGtk = linuxGtk

/** @deprecated Use {@link gtkSlotDedupe}. */
export const xplatGtkSlotDedupe: typeof gtkSlotDedupe = gtkSlotDedupe

/** @deprecated Use {@link gtkLeafResolve}. */
export const xplatGtkLeafResolve: typeof gtkLeafResolve = gtkLeafResolve
