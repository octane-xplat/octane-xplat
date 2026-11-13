import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { encodeHome } from './home-codec.mjs'

if (typeof Bun === 'undefined') throw new Error('Home producer requires Bun 1.4.4')
const source = import.meta.dirname
const repo = resolve(source, '../../..')
const toolchain = createRequire(
  process.env.XPLAT_PRERENDER_TOOLCHAIN_ROOT
    ? join(resolve(process.env.XPLAT_PRERENDER_TOOLCHAIN_ROOT), 'package.json')
    : import.meta.url,
)
const cssToolchain = createRequire(
  process.env.XPLAT_PRERENDER_CSS_TOOLCHAIN_ROOT
    ? join(resolve(process.env.XPLAT_PRERENDER_CSS_TOOLCHAIN_ROOT), 'package.json')
    : join(repo, 'packages/css-engine/package.json'),
)
const compilerPath = toolchain.resolve('octane/compiler')
const normalizerPath = toolchain.resolve('@octane-xplat/cli/vite')
const { compile } = await import(pathToFileURL(compilerPath).href)
const { processNativeCss } = await import(pathToFileURL(normalizerPath).href)
const scratch = join(homedir(), 'agent-scratch/octane-xplat/native-prerender-home-producer')
mkdirSync(scratch, { recursive: true })
const work = mkdtempSync(join(scratch, 'run-'))
const inputs = new Map()
function read(path) {
  const data = readFileSync(path)
  const digest = createHash('sha256').update(data).digest('hex')
  if (inputs.has(path) && inputs.get(path) !== digest)
    throw new Error('Producer input changed: ' + path)
  inputs.set(path, digest)
  return data.toString('utf8')
}
function json(path, value) {
  writeFileSync(path, JSON.stringify(value, null, 2))
}
function run(file, input) {
  const args = [file, input]
  const result = spawnSync(process.execPath, args, {
    encoding: 'utf8',
    timeout: 30000,
    maxBuffer: 1024 * 1024,
  })
  if (result.status !== 0)
    throw new Error('Home producer worker: ' + (result.error?.message ?? result.stderr))
}
const cssFiles = new Set()
const nativeImports = []
async function bundle(entry, name) {
  const result = await Bun.build({
    entrypoints: [entry],
    outdir: join(work, name),
    target: 'node',
    format: 'esm',
    define: {
      __IOS__: 'true',
      __APPLE__: 'true',
      __ANDROID__: 'false',
      __WINDOWS__: 'false',
      __VISIONOS__: 'false',
      __DEV__: 'false',
    },
    plugins: [
      {
        name: 'fixed-home-build-host',
        setup(build) {
          build.onLoad({ filter: /.*/, namespace: 'home-css' }, ({ path }) => {
            cssFiles.add(path)
            read(path)
            return { contents: 'export {}', loader: 'js' }
          })
          build.onLoad({ filter: /\.(?:ts|tsx|tsrx|mjs|js)$/ }, ({ path }) => {
            if (!path.startsWith(repo + '/')) return
            const contents = read(path)
            if (
              /\.(?:ts|tsx|tsrx)$/.test(path) &&
              (path.startsWith(join(repo, 'packages/ui/')) || path.endsWith('Home.tsrx'))
            ) {
              const compiled = compile(contents, path, {
                renderer: {
                  id: 'nativescript',
                  module: 'octane/universal/native',
                  target: 'universal',
                  server: 'unsupported',
                  text: 'host',
                },
              })
              const errors = compiled.diagnostics.filter((item) => item.severity === 'error')
              if (errors.length) throw new Error(JSON.stringify(errors))
              return { contents: compiled.code, loader: 'js' }
            }
            return { contents, loader: path.endsWith('.ts') ? 'ts' : 'js' }
          })
          build.onResolve({ filter: /.*/ }, (args) => {
            if (args.path === '@nativescript/core') {
              nativeImports.push({ importer: args.importer, request: args.path })
              return { path: join(source, 'producer/native-api.mjs') }
            }
            if (args.path.startsWith('@nativescript/core/'))
              throw new Error('Unsupported native module: ' + args.path)
            if (
              args.path === '@nativescript-community/octane' ||
              args.path === '../../vendor/ui-svg/src'
            ) {
              if (args.importer !== join(repo, 'packages/ui/src/components/media/svg.mobile.ts'))
                throw new Error('Unsupported native registry or SVG import: ' + args.importer)
              nativeImports.push({ importer: args.importer, request: args.path })
              return { path: join(source, 'producer/native-api.mjs') }
            }
            if (args.path === 'octane' || args.path.startsWith('octane/'))
              return {
                path: toolchain.resolve(
                  args.path === 'octane' ? 'octane/universal/native' : args.path,
                ),
              }
            const workspace = {
              '@octane-xplat/ui': join(source, 'home-primitives.ts'),
              '@octane-xplat/lib': join(repo, 'packages/lib/src/index.ts'),
              '@octane-xplat/icons': join(repo, 'packages/icons/src/index.ts'),
              '@octane-xplat/css-engine': join(repo, 'packages/css-engine/src/index.ts'),
            }
            if (Object.hasOwn(workspace, args.path)) return { path: workspace[args.path] }
            if (['@csstools/css-calc', 'css-tree', 'css-what'].includes(args.path))
              return { path: cssToolchain.resolve(args.path) }
            if (!args.path.startsWith('.')) return
            const path = resolve(dirname(args.importer), args.path)
            if (path.endsWith('.css')) return { path, namespace: 'home-css' }
            if (/\.(?:ts|tsx|tsrx)$/.test(path)) {
              const stem = path.replace(/\.(?:ts|tsx|tsrx)$/, '')
              const ext = path.slice(stem.length)
              for (const candidate of [stem + '.ios' + ext, stem + '.mobile' + ext, path])
                if (existsSync(candidate)) return { path: candidate }
            }
            for (const ext of [
              '.ios.tsrx',
              '.mobile.tsrx',
              '.tsrx',
              '.ios.ts',
              '.mobile.ts',
              '.ts',
              '.ios.js',
              '.js',
            ])
              for (const candidate of [path + ext, join(path, 'index' + ext)])
                if (existsSync(candidate)) return { path: candidate }
          })
        },
      },
    ],
  })
  if (!result.success) throw new Error(result.logs.join('\n'))
  return result.outputs.find((output) => output.kind === 'entry-point').path
}
read(compilerPath)
read(normalizerPath)
read(import.meta.filename)
read(join(source, 'home-codec.mjs'))
const seed = { name: 'Alex', initialCompleted: 3 }
const environment = { width: 402, height: 874, reducedMotion: false }
const homeBundle = await bundle(join(source, 'producer/prepare-home.mjs'), 'home-bundle')
const trees = {}
for (const theme of ['light', 'dark']) {
  const output = join(work, theme + '-tree.json')
  const input = join(work, theme + '-input.json')
  json(input, { theme, seed, output })
  run(homeBundle, input)
  trees[theme] = JSON.parse(readFileSync(output, 'utf8'))
}
assert.deepEqual(
  trees.light.nodes,
  trees.dark.nodes,
  'Theme-dependent initial host props/topology unsupported',
)
const warnings = []
const sheets = [
  ...new Set([
    ...['tokens.css', 'chrome.css', 'utilities.css'].map((name) =>
      join(repo, 'packages/ui/src/theme', name),
    ),
    ...cssFiles,
  ]),
].map((path) => {
  const id = path.slice(repo.length + 1)
  return { id, css: processNativeCss(read(path), id, (message) => warnings.push(message)) }
})
json(join(work, 'sheets.json'), sheets)
const cascadeBundle = await bundle(join(source, 'producer/resolve-home.mjs'), 'cascade-bundle')
const output = join(work, 'resolved.json')
const cascadeInput = join(work, 'cascade-input.json')
json(cascadeInput, { tree: join(work, 'light-tree.json'), seed, sheets, environment, output })
run(cascadeBundle, cascadeInput)
const artifact = JSON.parse(readFileSync(output, 'utf8'))
const bundleHashes = Object.fromEntries(
  [homeBundle, cascadeBundle].map((path) => [
    path.slice(work.length + 1),
    createHash('sha256').update(readFileSync(path)).digest('hex'),
  ]),
)
const binding = { inputs: Object.fromEntries([...inputs].sort()), bundleHashes, seed, environment }
const buildHash = createHash('sha256').update(JSON.stringify(binding)).digest('hex')
writeFileSync(join(work, 'home.bin'), encodeHome(artifact, buildHash))
for (const [path, digest] of inputs) {
  if (createHash('sha256').update(readFileSync(path)).digest('hex') !== digest)
    throw new Error('Producer input changed during generation: ' + path)
}
json(join(work, 'build.json'), {
  ...binding,
  buildHash,
  warnings,
  nativeImports,
  nativeReads: Object.fromEntries(
    Object.entries(trees).map(([theme, tree]) => [theme, tree.reads]),
  ),
  registrations: trees.light.registrations,
  artifactHash: createHash('sha256')
    .update(readFileSync(join(work, 'home.bin')))
    .digest('hex'),
  scope:
    'Fixed Home iOS render-only producer, explicit environment, AOT theme variants and XPH1 encoding; not general eligibility, SSR or native runtime qualification',
})
console.log('Home producer output: ' + work)
console.log(
  JSON.stringify({
    visualNodes: artifact.nodes.length,
    logicalNodes: 27,
    themes: Object.keys(artifact.variants),
    bytes: readFileSync(join(work, 'home.bin')).length,
    buildHash,
  }),
)
