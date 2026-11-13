import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { homedir } from 'node:os'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { validateArtifact } from '@octane-xplat/native-prerender'
import { encodeStartupArtifact, writeStartupJson } from '@octane-xplat/native-prerender/codec'
import { parseProducerConfig } from './producer/config.mjs'

const source = import.meta.dirname
const platform = process.env.XPLAT_PRERENDER_HOME_PLATFORM ?? 'ios'
if (!['ios', 'android'].includes(platform))
  throw new Error('Home producer platform must be ios or android')
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
const vitePath = toolchain.resolve('vite')
const { build } = await import(pathToFileURL(vitePath).href)
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
const configurationFile = resolve(
  process.env.XPLAT_PRERENDER_PRODUCER_CONFIG ?? join(source, 'producer/home.config.json'),
)
const configuration = parseProducerConfig(read(configurationFile), configurationFile)
const entryRoot = dirname(configuration.entry)
const { seed, environment } = configuration
const cssFiles = new Set()
const nativeImports = []
async function bundle(entry, name) {
  const cssPrefix = '\0xplat-home-css:'
  await build({
    configFile: false,
    root: repo,
    logLevel: 'warn',
    define: {
      XPLAT_HOME_PLATFORM: JSON.stringify(platform),
      __IOS__: String(platform === 'ios'),
      __APPLE__: String(platform === 'ios'),
      __ANDROID__: String(platform === 'android'),
      __WINDOWS__: 'false',
      __VISIONOS__: 'false',
      __DEV__: 'false',
    },
    ssr: { noExternal: true },
    build: {
      ssr: entry,
      outDir: join(work, name),
      target: 'node22',
      minify: false,
      emptyOutDir: true,
      rolldownOptions: {
        output: { format: 'es', entryFileNames: 'entry.mjs', codeSplitting: false },
      },
    },
    plugins: [
      {
        name: 'fixed-home-build-host',
        enforce: 'pre',
        load(id) {
          if (id === '\0xplat-home-component')
            return (
              'export { ' +
              configuration.exportName +
              ' as StartupComponent } from ' +
              JSON.stringify(configuration.entry)
            )
          if (id.startsWith(cssPrefix)) {
            const path = Buffer.from(id.slice(cssPrefix.length), 'base64url').toString('utf8')
            cssFiles.add(path)
            read(path)
            return 'export {}'
          }
          if (
            (!id.startsWith(repo + '/') && !id.startsWith(entryRoot + '/')) ||
            !/\.(?:ts|tsx|tsrx|mjs|js)$/.test(id)
          )
            return
          const contents = read(id)
          if (
            /\.(?:ts|tsx|tsrx)$/.test(id) &&
            (id.startsWith(join(repo, 'packages/ui/')) || id.startsWith(entryRoot + '/'))
          ) {
            const compiled = compile(contents, id, {
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
            return compiled.code
          }
          return contents
        },
        resolveId(request, importer) {
          if (request === 'xplat-prerender:component') return '\0xplat-home-component'
          if (request === '@nativescript/core') {
            nativeImports.push({ importer, request })
            return join(source, 'producer/native-api.mjs')
          }
          if (request.startsWith('@nativescript/core/'))
            throw new Error('Unsupported native module: ' + request)
          if (
            request === '@nativescript-community/octane' ||
            request === '../../vendor/ui-svg/src'
          ) {
            if (importer !== join(repo, 'packages/ui/src/components/media/svg.mobile.ts'))
              throw new Error('Unsupported native registry or SVG import: ' + importer)
            nativeImports.push({ importer, request })
            return join(source, 'producer/native-api.mjs')
          }
          if (request === 'octane' || request.startsWith('octane/'))
            return toolchain.resolve(request === 'octane' ? 'octane/universal/native' : request)
          const workspace = {
            '@octane-xplat/ui': join(source, 'home-primitives.ts'),
            '@octane-xplat/lib': join(repo, 'packages/lib/src/index.ts'),
            '@octane-xplat/icons': join(repo, 'packages/icons/src/index.ts'),
            '@octane-xplat/css-engine': join(repo, 'packages/css-engine/src/index.ts'),
          }
          if (Object.hasOwn(workspace, request)) return workspace[request]
          if (['@csstools/css-calc', 'css-tree', 'css-what'].includes(request))
            return cssToolchain.resolve(request)
          if ((!request.startsWith('.') && !isAbsolute(request)) || !importer) return
          const path = isAbsolute(request) ? request : resolve(dirname(importer), request)
          if (path.endsWith('.css')) return cssPrefix + Buffer.from(path).toString('base64url')
          if (/\.(?:ts|tsx|tsrx)$/.test(path)) {
            const stem = path.replace(/\.(?:ts|tsx|tsrx)$/, '')
            const ext = path.slice(stem.length)
            for (const candidate of [stem + '.' + platform + ext, stem + '.mobile' + ext, path])
              if (existsSync(candidate)) return candidate
          }
          for (const ext of [
            '.' + platform + '.tsrx',
            '.mobile.tsrx',
            '.tsrx',
            '.' + platform + '.ts',
            '.mobile.ts',
            '.ts',
            '.' + platform + '.js',
            '.js',
          ])
            for (const candidate of [path + ext, join(path, 'index' + ext)])
              if (existsSync(candidate)) return candidate
        },
      },
    ],
  })
  const output = join(work, name, 'entry.mjs')
  if (!existsSync(output)) throw new Error('Render-only Vite build did not emit ' + output)
  return output
}
read(vitePath)
read(compilerPath)
read(normalizerPath)
read(import.meta.filename)
read(createRequire(import.meta.url).resolve('@octane-xplat/native-prerender/codec'))
read(join(source, 'producer/config.mjs'))
const homeBundle = await bundle(join(source, 'producer/prepare-home.mjs'), 'home-bundle')
const trees = {}
for (const theme of ['light', 'dark']) {
  const output = join(work, theme + '-tree.json')
  const input = join(work, theme + '-input.json')
  json(input, { theme, seed, output })
  run(homeBundle, input)
  trees[theme] = JSON.parse(readFileSync(output, 'utf8'))
  assert.equal(trees[theme].platform, platform, 'Build host platform differs from selected leaves')
}
assert.deepEqual(
  trees.light.nodes,
  trees.dark.nodes,
  'Theme-dependent initial host props/topology unsupported',
)
assert.deepEqual(
  trees.light.logicalNodes,
  trees.dark.logicalNodes,
  'Theme-dependent logical ownership unsupported',
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
  const id = path.startsWith(repo + '/') ? path.slice(repo.length + 1) : pathToFileURL(path).href
  return { id, css: processNativeCss(read(path), id, (message) => warnings.push(message)) }
})
json(join(work, 'sheets.json'), sheets)
const cascadeBundle = await bundle(join(source, 'producer/resolve-home.mjs'), 'cascade-bundle')
const output = join(work, 'resolved.json')
const cascadeInput = join(work, 'cascade-input.json')
json(cascadeInput, { tree: join(work, 'light-tree.json'), seed, sheets, environment, output })
run(cascadeBundle, cascadeInput)
const { launch, ...artifact } = JSON.parse(readFileSync(output, 'utf8'))
json(output, artifact)
const bundleHashes = Object.fromEntries(
  [homeBundle, cascadeBundle].map((path) => [
    path.slice(work.length + 1),
    createHash('sha256').update(readFileSync(path)).digest('hex'),
  ]),
)
const binding = {
  inputs: Object.fromEntries([...inputs].sort()),
  bundleHashes,
  seed,
  environment,
  platform,
  configuration,
}
const buildHash = createHash('sha256').update(JSON.stringify(binding)).digest('hex')
const logicalNodes = trees.light.logicalNodes
const visualNodes = logicalNodes.filter((node) => node.kind !== '#text')
const startup = validateArtifact({
  version: 1,
  platform,
  hostContract: 'mason-label-v1',
  build: buildHash,
  seed,
  // Exact viewport guards remain for any dimension-sensitive media query.
  // With no such queries this CSS engine never reads width/height; Mason still
  // lays out flow and supported percentages against the actual native viewport.
  constraints: launch.constraints,
  nodes: logicalNodes,
  variants: Object.fromEntries(
    ['light', 'dark'].map((theme) => [
      theme,
      artifact.variants[theme].map(({ index, ...record }) => ({
        node: visualNodes[index].index,
        ...record,
      })),
    ]),
  ),
})
writeFileSync(join(work, 'startup.bin'), encodeStartupArtifact(startup))
writeFileSync(join(work, 'startup.json'), writeStartupJson(startup))
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
  startupFormat: 'XPI1',
  dimensionQueries: launch.dimensionQueries,
  startupArtifactHash: createHash('sha256')
    .update(readFileSync(join(work, 'startup.bin')))
    .digest('hex'),
  logicalNodeCount: logicalNodes.length,
  scope:
    'Private configured Node/Vite ' +
    platform +
    ' render-only producer with four shared primitive exports, explicit environment, AOT theme variants and XPI1 encoding; not normal app integration, general eligibility, SSR or native runtime qualification',
})
console.log('Home producer output: ' + work)
console.log(
  JSON.stringify({
    visualNodes: artifact.nodes.length,
    logicalNodes: logicalNodes.length,
    themes: Object.keys(artifact.variants),
    bytes: readFileSync(join(work, 'startup.bin')).length,
    buildHash,
  }),
)
