import assert from 'node:assert/strict'
import { test, after } from 'node:test'
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, lstatSync, existsSync, cpSync, rmSync, symlinkSync } from 'node:fs'
import { dirname, join, resolve, relative, extname, sep } from 'node:path'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import { generateRoutes } from '../../packages/cli/src/commands/routes.ts'
import { scratchRun } from './scratch.mjs'
import { assertCurrentNativeBuild, envProbeInputs } from './native-inputs.mjs'
const root = resolve(import.meta.dirname, '../..')
const work = join(root, 'research/nim-cli')
const scratch = scratchRun(root, 'route-generation')
const require = createRequire(new URL('../../packages/cli/package.json', import.meta.url))
const { routeSourceMetadata } = await import('../../packages/cli/src/route-source.ts')
const { log } = require('@clack/prompts')
const binary = join(work, `native/env-probe${process.platform === 'win32' ? '.exe' : ''}`)
const macOnly = { skip: process.platform !== 'darwin' }
assertCurrentNativeBuild(root, JSON.parse(readFileSync(join(work, 'native/env-build.json'))), readFileSync(binary), envProbeInputs)
after(() => rmSync(scratch, { recursive: true, force: true }))
let sequence = 0
function write(dir, file, content) {
 mkdirSync(dirname(join(dir, file)), { recursive: true })
 writeFileSync(join(dir, file), content)
}
function project(files = {}, config) {
 const dir = join(scratch, String(++sequence), 'input')
 mkdirSync(dir, { recursive: true })
 for (const [file, content] of Object.entries(files)) write(dir, file, content)
 if (config !== undefined) write(dir, 'xplat.routes.json', JSON.stringify(config))
 return dir
}
function filesUnder(dir) {
 const result = []
 function walk(current) {
  for (const entry of readdirSync(current).sort()) {
   if (entry === 'node_modules') continue
   const path = join(current, entry)
   const info = statSync(path)
   if (info.isDirectory()) walk(path)
   else result.push(path)
  }
 }
 walk(dir)
 return result
}
function snapshot(dir) {
 return Object.fromEntries(filesUnder(dir).map(file => [relative(dir, file), readFileSync(file).toString('base64')]))
}
function modes(dir) {
 return Object.fromEntries(filesUnder(dir).map(file => [relative(dir, file), statSync(file).mode & 0o777]))
}
function metadataCache(dir) {
 const result = {}
 for (const file of filesUnder(dir)) {
  if (!['.tsx', '.tsrx'].includes(extname(file)) || file.includes('routes.gen.')) continue
  const source = readFileSync(file, 'utf8')
  // A parser error is reported only if native collection requests that file.
  // Layouts and ignored files need not parse during route discovery.
  try {
   result[relative(dir, file).split(sep).join('/')] = { sha256: createHash('sha256').update(source).digest('hex'),
    metadata: routeSourceMetadata(source, relative(dir,file).split(sep).join('/')) }
  } catch (error) { result[relative(dir, file).split(sep).join('/')] = { sha256: createHash('sha256').update(source).digest('hex'), parserError: error.message } }
 }
 return result
}
async function reference(dir, options) {
 const warnings = []
 const original = log.warn
 log.warn = message => warnings.push(message)
 try { return { ok: true, value: { count: await generateRoutes(dir, options.directory, options.output, { bake: false }), warnings } } }
 catch (error) { return { ok: false, message: error.message, warnings } }
 finally { log.warn = original }
}
function installWorker(dir) {
 const target = join(dir, 'node_modules/@octane-xplat/build')
 if (!existsSync(target)) {
  mkdirSync(dirname(target), { recursive: true })
  symlinkSync(join(root, 'packages/build'), target, 'dir')
 }
}
function native(dir, options, cache) {
 installWorker(dir)
 const request = { operation: 'route-generate', dir, ...options, publish: true, ...(cache ? { metadata: cache } : {}) }
 const run = spawnSync(binary, [], { input: JSON.stringify(request) + '\n', encoding: 'utf8', env: { ...process.env, PATH: dirname(process.execPath) }, timeout: 30_000, maxBuffer: 64 * 1024 * 1024 })
 assert.equal(run.status, 0, run.stderr)
 const result = JSON.parse(run.stdout)
 if (result.ok) delete result.value.outputs // Published filesystem bytes are compared below.
 return result
}
async function compare(input, options = {}, check, fixtureRoot = input) {
 const parent = dirname(fixtureRoot)
 const nodeRoot = join(parent, 'node')
 const nimRoot = join(parent, 'nim')
 const nodeDir = join(nodeRoot, relative(fixtureRoot, input))
 const nimDir = join(nimRoot, relative(fixtureRoot, input))
 cpSync(fixtureRoot, nodeRoot, { recursive: true })
 cpSync(fixtureRoot, nimRoot, { recursive: true })
 const wanted = await reference(nodeDir, options)
 const actual = native(nimDir, options)
 try {
  assert.deepEqual(actual, wanted)
  assert.deepEqual(snapshot(nimRoot), snapshot(nodeRoot))
  if (process.platform !== 'win32') assert.deepEqual(modes(nimRoot), modes(nodeRoot))
 } catch (error) {
  writeFileSync(join(work, 'route-generation-mismatch.json'), JSON.stringify({ options, wanted, actual, nodeDir, nimDir }, null, 2))
  // Keep small output diffs as evidence; scratch remains disposable.
  writeFileSync(join(work, 'route-generation-node.json'), JSON.stringify(snapshot(nodeRoot), null, 2))
  writeFileSync(join(work, 'route-generation-nim.json'), JSON.stringify(snapshot(nimRoot), null, 2))
  throw error
 }
 if (check) await check({ nodeDir, nimDir, wanted, actual })
 return wanted
}
const screen = 'export default function Page() { return null }\n'

test('native typecheck generation emits exact contracts, catalogs and manifest bytes', macOnly, async () => {
 const dir = project({
  'app/index.tsx': screen,
  'app/account+modal.tsx': 'export const loader = () => ({ name: "Ada" }); export const beforeLoad = () => {}; export const head = {}; ' + screen,
  'app/users/[id].tsx': 'export const validateSearch = (raw: unknown) => raw; export function ErrorBoundary() { return null }; ' + screen,
  'app/files/[[...path]].tsrx': 'export default function Page() @{ return <label>Files</label> }',
  'app/_layout.tsx': screen,
  'app/users/_layout+fade.web.tsx': screen,
  'app/users/_layout.ios.tsx': screen,
  'app/helper.ts': 'throw new Error("not a route")',
  'app/data.loader.ts': 'throw new Error("not a route")',
 })
 const result = await compare(dir, {}, ({ nimDir }) => {
  assert.ok(existsSync(join(nimDir, 'routes.gen.catalog.macos.ts')))
  assert.equal(JSON.parse(readFileSync(join(nimDir, 'routes.gen.manifest.json'))).routes.length, 4)
 })
 assert.equal(result.value.count, 4)
})

test('platform variants preserve canonical flags, local checks, precedence and parameter failures', macOnly, async () => {
 const dir = project({
  'app/profile.web.tsx': 'export const loader = () => 1; ' + screen,
  'app/profile.ios.tsx': 'export const group = {}; export const beforeLoad = () => {}; ' + screen,
  'app/profile.android.tsx': 'export const head = {}; ' + screen,
  'app/profile.mobile.tsx': screen,
  'app/profile.macos.tsx': screen,
  'app/_layout.tsx': screen, 'app/_layout.mobile.tsx': screen,
  'app/Éclair.tsx': screen, 'app/zebra.tsx': screen, 'app/😀.tsx': screen, 'app/\ue000.tsx': screen,
 })
 assert.equal((await compare(dir)).ok, true)
 const incompatible = project({ 'app/users/[id].web.tsx': screen, 'app/users/[slug].ios.tsx': screen })
 const failed = await compare(incompatible)
 assert.equal(failed.ok, false)
 assert.match(failed.message, /incompatible-platform-params/)
})

test('configured and empty projects retain registration, output placement and no-route behavior', macOnly, async () => {
 for (const [files, config, options] of [
  [{}, undefined, {}], [{}, {}, {}],
  [{ 'sources/index.tsx': screen, 'defs.ts': 'throw new Error("configuration must not execute source")' },
   { directory: 'sources', out: 'generated/navigation.ts', manifests: [{ module: './defs', export: 'manifest' }], context: { module: './defs', export: 'context' },
    transitions: { module: './defs', export: 'transitions' }, stacks: ['settings', 'account-flow'], base: '/app', allowedOrigins: ['https://example.com'], allowedSchemes: ['octane:'] }, {}],
  [{ 'app/index.tsx': screen }, undefined, { output: 'nested/generated/custom' }],
  [{ 'src/app/index.tsx': screen }, undefined, {}],
  [{ 'app/index.tsx': screen }, undefined, { directory: '' }],
  [{ 'explicit/index.tsx': screen }, { directory: 'absent' }, { directory: 'explicit', output: 'gen/override.ts' }],
 ]) await compare(project(files, config), options)
})

test('bake-skipped generation preserves data, validates loaders and emits exact Markdown stubs', macOnly, async () => {
 const cases = [
  { 'app/static.tsx': 'export const dataMode = "baked"; ' + screen, 'app/static.loader.ts': 'throw new Error("must not execute while typechecking")' },
  { 'app/static.tsx': 'export const dataMode = "baked"; ' + screen, 'app/static.loader.ts': 'throw new Error("must not execute while typechecking")', 'routes.gen.data.ts': 'preserve existing baked data\n' },
  { 'app/guide.md': '# Guide\nContent', 'app/[[param]].md': '# Skipped parameter doc' },
  { 'app/guide.md': '# Guide', 'app/guide.tsx': screen },
  { 'app/index.tsx': screen, 'routes.gen.data.ts': 'stale data must become an empty stub' },
  { 'app/static.tsx': 'export const dataMode = "baked"; ' + screen },
 ]
 for (const files of cases) await compare(project(files))
 const invalid = project({ 'app/invalid.tsx': 'export const loader = (' })
 const before = snapshot(invalid)
 const expected = await reference(invalid, {})
 const actual = native(invalid, {})
 assert.equal(expected.ok, false)
 assert.equal(actual.ok, false)
 // The worker adds the affected source path to compiler syntax diagnostics.
 assert.equal(actual.message, `app/invalid.tsx: ${expected.message}`)
 assert.deepEqual(actual.warnings, expected.warnings)
 assert.deepEqual(snapshot(invalid), before)
})

test('unchanged publication preserves mtime and follows an existing output symlink', macOnly, async () => {
 await compare(project({ 'app/index.tsx': screen }), {}, ({ nimDir, nodeDir }) => {
  const file = join(nimDir, 'routes.gen.contracts.ts')
  const time = statSync(file).mtimeMs
  const result = native(nimDir, {})
  assert.equal(result.ok, true)
  assert.equal(statSync(file).mtimeMs, time)
  for (const dir of [nimDir, nodeDir]) {
   const output = join(dir, 'routes.gen.contracts.ts')
   const content = readFileSync(output)
   rmSync(output)
   write(dir, 'stored/contracts.ts', content)
   symlinkSync('stored/contracts.ts', output)
   write(dir, 'app/added.tsx', screen)
  }
  const actual = native(nimDir, {})
  assert.equal(actual.ok, true)
  assert.equal(lstatSync(file).isSymbolicLink(), true)
  // A fresh reference run provides the post-edit bytes for both link and target.
  return reference(nodeDir, {}).then(wanted => {
   assert.deepEqual(actual, wanted)
   assert.deepEqual(snapshot(nimDir), snapshot(nodeDir))
  })
 })
})

test('generation failures retain the previous outputs and already emitted warnings', macOnly, async () => {
 await compare(project({ 'app/index.tsx': screen }), {}, async ({ nodeDir, nimDir }) => {
  for (const dir of [nodeDir, nimDir]) {
   write(dir, 'app/a-[param].md', '# This is a static name, not a parameter')
   write(dir, 'app/[param].md', '# Skipped parameter')
   write(dir, 'app/z-invalid.tsx', 'export const dataMode = "baked"; ' + screen)
  }
  const beforeNode = snapshot(nodeDir)
  const beforeNim = snapshot(nimDir)
  const wanted = await reference(nodeDir, {})
  const actual = native(nimDir, {})
  assert.equal(wanted.ok, false)
  assert.ok(wanted.warnings.length > 0)
  assert.deepEqual(actual, wanted)
  assert.deepEqual(snapshot(nodeDir), beforeNode)
  assert.deepEqual(snapshot(nimDir), beforeNim)
 })
})

test('stale parser snapshots fail before publication instead of silently using old exports', macOnly, async () => {
 const dir = project({ 'app/index.tsx': screen })
 const cache = metadataCache(dir)
 write(dir, 'app/index.tsx', 'export const loader = () => 1; ' + screen)
 const before = snapshot(dir)
 const result = native(dir, {}, cache)
 assert.equal(result.ok, false)
 assert.match(result.message, /parser snapshot changed/)
 assert.deepEqual(snapshot(dir), before)
})

test('atomic publication applies the caller umask without changing the coordinator process', macOnly, () => {
 for (const umask of [0o022, 0o027, 0o077]) {
  const input = project({ 'app/index.tsx': screen })
  const nodeDir = join(dirname(input), 'node')
  const nimDir = join(dirname(input), 'nim')
  cpSync(input, nodeDir, { recursive: true })
  cpSync(input, nimDir, { recursive: true })
  const run = request => {
   const child = spawnSync(process.execPath, [join(import.meta.dirname, 'route-mode-worker.mjs')], {
    input: JSON.stringify({ umask, ...request }), encoding: 'utf8', timeout: 15_000, maxBuffer: 16 * 1024 * 1024,
   })
   assert.equal(child.status, 0, child.stderr)
   return JSON.parse(child.stdout)
  }
  installWorker(nimDir)
  const wanted = run({ dir: nodeDir })
  const actual = run({ native: true, binary, request: { operation: 'route-generate', dir: nimDir, publish: true } })
  assert.deepEqual(actual, wanted)
  assert.equal(actual.ok, true)
  assert.deepEqual(snapshot(nimDir), snapshot(nodeDir))
  assert.deepEqual(modes(nimDir), modes(nodeDir))
  assert.equal(statSync(join(nimDir, 'routes.gen.contracts.ts')).mode & 0o777, 0o666 & ~umask)
 }
})

test('copied repository route trees emit the same files without changing source workspaces', macOnly, async () => {
 const tracked = spawnSync('git', ['ls-files', '-z', '**/xplat.routes.json'], { cwd: root, encoding: 'utf8' })
 assert.equal(tracked.status, 0, tracked.stderr)
 let checked = 0
 for (const file of tracked.stdout.split('\0').filter(Boolean)) {
  const sourceDir = dirname(join(root, file))
  const config = JSON.parse(readFileSync(join(root, file), 'utf8'))
  const routeDir = config.directory ?? ['app', 'src/app'].find(dir => existsSync(join(sourceDir, dir)))
  const fixtureRoot = project()
  const dir = join(fixtureRoot, dirname(file))
  write(fixtureRoot, file, JSON.stringify(config))
  if (routeDir && existsSync(join(sourceDir, routeDir))) cpSync(join(sourceDir, routeDir), join(dir, routeDir), { recursive: true })
  for (const ref of [...(config.manifests ?? []), config.context, config.transitions].filter(Boolean)) {
   const source = ['', '.ts', '.tsx', '.tsrx', '.mts', '.js', '.mjs'].map(ext => ({ original: resolve(sourceDir, ref.module + ext), copy: resolve(dir, ref.module + ext) }))
    .find(candidate => existsSync(candidate.original))
   assert.ok(source)
   assert.ok(source.original.startsWith(root + sep), 'real source fixtures must be repository-owned')
   assert.ok(source.copy.startsWith(fixtureRoot + sep), 'copied sources must stay in owned scratch')
   mkdirSync(dirname(source.copy), { recursive: true })
   cpSync(source.original, source.copy, { recursive: true })
  }
  const result = await compare(dir, {}, undefined, fixtureRoot)
  assert.equal(result.ok, true, file)
  checked++
 }
 assert.equal(checked, 7)
 console.log(`${checked} copied real route configurations and source trees emitted byte-identical outputs`)
})
