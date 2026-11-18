import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const [core, work, mason, driver] = process.argv.slice(2)
if (!core || !work || !mason || !driver)
  throw new Error('Expected Core, work, Mason and candidate driver roots')
const artifactAdopt = process.env.XPLAT_PRERENDER_ANDROID_ARTIFACT_ADOPT === '1'
const customAdopt = process.env.XPLAT_PRERENDER_ANDROID_CUSTOM_ADOPT === '1'
const componentAdopt = artifactAdopt || customAdopt
const configuration = componentAdopt
  ? JSON.parse(readFileSync(join(work, 'producer/build.json'))).configuration
  : undefined
if (componentAdopt && (!configuration || !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(configuration.exportName)))
  throw new Error('Variable adoption requires a configured producer entry/export')
const source = import.meta.dirname
const repo = resolve(source, '../../..')
const toolchain = createRequire(import.meta.url)
const coreRequire = createRequire(join(core, 'package.json'))
const compiler = toolchain.resolve('octane/compiler')
const { compile } = await import(pathToFileURL(compiler).href)
const inputs = {}
const inputDir = join(work, 'home-js-inputs')
mkdirSync(inputDir)
function read(path) {
  const contents = readFileSync(path)
  const sha256 = createHash('sha256').update(contents).digest('hex')
  if (inputs[path] && inputs[path].sha256 !== sha256)
    throw new Error('Home bundle source changed: ' + path)
  const copy = join(inputDir, sha256)
  writeFileSync(copy, contents)
  inputs[path] = { copy, sha256 }
  return contents.toString()
}
read(import.meta.filename)
read(compiler)
const result = await Bun.build({
  entrypoints: [
    join(
      source,
      artifactAdopt
        ? 'android-native/artifact-adoption.js'
        : customAdopt
          ? 'android-native/custom-adoption.js'
          : 'android-native/home-adoption.js',
    ),
  ],
  outdir: join(work, 'home-bundle'),
  target: 'browser',
  format: 'cjs',
  define: {
    XPLAT_PRERENDER_HOME_RECREATE_COUNT: String(
      Number(process.env.XPLAT_PRERENDER_ANDROID_HOME_RECREATE_COUNT ?? 1),
    ),
    XPLAT_PRERENDER_HOME_LIFETIME: String(
      process.env.XPLAT_PRERENDER_ANDROID_HOME_LIFETIME === '1',
    ),
    XPLAT_PRERENDER_HOME_ATTACH_FAILURE: String(
      process.env.XPLAT_PRERENDER_ANDROID_HOME_FALLBACK === 'attach',
    ),
    XPLAT_PRERENDER_HOME_SEED_MISMATCH: String(
      process.env.XPLAT_PRERENDER_ANDROID_HOME_FALLBACK === 'seed',
    ),
    XPLAT_PRERENDER_HOME_APPLICATION: String(
      process.env.XPLAT_PRERENDER_ANDROID_HOME_APPLICATION === '1',
    ),
    XPLAT_PRERENDER_HOME_ENTRY: String(process.env.XPLAT_PRERENDER_ANDROID_HOME_ENTRY === '1'),
    XPLAT_PRERENDER_HOME_RESTORE: String(process.env.XPLAT_PRERENDER_ANDROID_HOME_RESTORE === '1'),
    XPLAT_PRERENDER_HOME_STARTUP: String(process.env.XPLAT_PRERENDER_ANDROID_HOME_STARTUP === '1'),
    XPLAT_PRERENDER_HOME_PARITY: String(process.env.XPLAT_PRERENDER_ANDROID_HOME_PARITY === '1'),
    __ANDROID__: 'true',
    __IOS__: 'false',
    __APPLE__: 'false',
    __WINDOWS__: 'false',
    __VISIONOS__: 'false',
    __DEV__: 'false',
    __COMMONJS__: 'true',
    __CSS_PARSER__: '"css-tree"',
  },
  plugins: [
    {
      name: 'actual-android-home',
      setup(build) {
        build.onResolve({ filter: /.*/ }, (args) => {
          if (args.path === 'xplat-prerender:component')
            return { path: 'configured-component', namespace: 'startup-component' }
          if (args.path === 'xplat-prerender:artifact')
            return { path: join(work, 'producer/resolved.json') }
          if (args.path === 'xplat-prerender:startup')
            return { path: join(work, 'producer/startup.json') }
          if (args.path === 'xplat-prerender:styles')
            return { path: join(work, 'producer/sheets.json') }
          if (args.path === '~/package.json')
            return { path: join(work, 'app/src/main/assets/app/package.json') }
          if (args.path === 'octane' || args.path.startsWith('octane/'))
            return {
              path: toolchain.resolve(
                args.path === 'octane' ? 'octane/universal/native' : args.path,
              ),
            }
          if (args.path === 'css-tree')
            return { path: coreRequire.resolve('css-tree/dist/csstree.esm') }
          let base
          if (args.path.startsWith('@nativescript/core'))
            base = core + args.path.slice('@nativescript/core'.length)
          else if (args.path === '@octane-xplat/nativescript-octane')
            base = join(driver, 'dist/index.js')
          else if (
            [
              '@octane-xplat/nativescript-mason-core',
              '@octane-xplat/nativescript-masonkit',
            ].includes(args.path)
          )
            base = join(mason, 'index')
          else if (args.path.startsWith('@octane-xplat/nativescript-masonkit/'))
            base = join(mason, args.path.slice('@octane-xplat/nativescript-masonkit/'.length))
          else if (args.path.startsWith('@octane-xplat/nativescript-mason-core/'))
            base = join(mason, args.path.slice('@octane-xplat/nativescript-mason-core/'.length))
          else if (args.path === '@octane-xplat/ui') base = join(source, 'home-primitives.ts')
          else if (args.path === '@octane-xplat/motion')
            base = join(source, 'motion-primitives.ts')
          else if (args.path === '@octane-xplat/lib') base = join(repo, 'packages/lib/src/index.ts')
          // The platform barrel pulls unrelated device/browser surfaces; the
          // launch-input seam only needs the real ApplicationSettings-backed leaf.
          else if (args.path === '@octane-xplat/platform')
            base = join(repo, 'packages/platform/src/storage.ts')
          else if (args.path === '@octane-xplat/icons')
            base = join(repo, 'packages/icons/src/index.ts')
          else if (args.path === '@octane-xplat/css-engine')
            base = join(repo, 'packages/css-engine/src/index.ts')
          else if (args.path.startsWith('/')) base = args.path
          else if (args.path.startsWith('.')) base = resolve(dirname(args.importer), args.path)
          else return
          if (base.endsWith('.css')) return { path: base, namespace: 'home-css' }
          if (/\.(?:ts|tsx|tsrx|js)$/.test(base)) {
            const stem = base.replace(/\.(?:ts|tsx|tsrx|js)$/, '')
            const ext = base.slice(stem.length)
            for (const candidate of [stem + '.android' + ext, stem + '.mobile' + ext, base])
              if (existsSync(candidate)) return { path: candidate }
          }
          for (const ext of [
            '.android.js',
            '.js',
            '.android.tsrx',
            '.mobile.tsrx',
            '.tsrx',
            '.android.ts',
            '.mobile.ts',
            '.ts',
          ])
            for (const candidate of [base + ext, join(base, 'index' + ext)])
              if (existsSync(candidate)) return { path: candidate }
          if (existsSync(base) && /\.(?:m?js|json|ts|tsx|tsrx)$/.test(base)) return { path: base }
        })
        build.onLoad({ filter: /.*/, namespace: 'startup-component' }, () => ({
          contents: `export { ${configuration.exportName} as StartupComponent } from ${JSON.stringify(configuration.entry)}`,
          loader: 'js',
        }))
        build.onLoad({ filter: /.*/, namespace: 'home-css' }, ({ path }) => {
          read(path)
          return { contents: 'export {}', loader: 'js' }
        })
        build.onLoad({ filter: /\.(?:ts|tsx|tsrx|mjs|js|json)$/ }, ({ path }) => {
          const contents = read(path)
          if (
            /\.(?:ts|tsx|tsrx)$/.test(path) &&
            (path.startsWith(join(repo, 'packages/ui/')) || path.endsWith('.tsrx'))
          ) {
            const result = compile(contents, path, {
              renderer: {
                id: 'nativescript',
                module: 'octane/universal/native',
                target: 'universal',
                server: 'unsupported',
                text: 'host',
              },
            })
            const errors = result.diagnostics.filter((entry) => entry.severity === 'error')
            if (errors.length) throw new Error(JSON.stringify(errors))
            return { contents: result.code, loader: 'js' }
          }
          return {
            contents,
            loader: path.endsWith('.json') ? 'json' : path.endsWith('.ts') ? 'ts' : 'js',
          }
        })
      },
    },
  ],
})
if (!result.success) throw new Error(result.logs.join('\n'))
const output = result.outputs.find((entry) => entry.kind === 'entry-point')
writeFileSync(join(work, 'app/src/main/assets/app/main.js'), readFileSync(output.path))
writeFileSync(join(work, 'home-js-inputs.json'), JSON.stringify(inputs, null, 2))
