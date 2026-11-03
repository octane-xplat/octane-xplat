// A small immutable native source snapshot; shared remote checkouts stay untouched.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cpSync, readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { scratchRun } from './scratch.mjs'
import { assertCurrentNativeBuild } from './native-inputs.mjs'
import { prepareOrtHeaders, ortPin } from './ort-headers.mjs'

const root = resolve(import.meta.dirname, '../..')
assert.ok(process.argv.slice(2).every(value => value === '--project-worker'), 'Only --project-worker is supported')
const withProjectWorker = process.argv.includes('--project-worker')
const work = join(root, 'research/nim-cli')
const binary = join(work, `native/xplat${process.platform === 'win32' ? '.exe' : ''}`)
const build = JSON.parse(readFileSync(join(work, 'native/build.json')))
assertCurrentNativeBuild(root, build, readFileSync(binary))
const run = scratchRun(root, 'portability-source')
const source = join(run, 'source')
mkdirSync(source)
const files = []
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
function copy(path) {
 const destination = join(source, path)
 mkdirSync(dirname(destination), { recursive: true })
 cpSync(join(root, path), destination)
 files.push(path)
}
function json(path, value) {
 const destination = join(source, path)
 mkdirSync(dirname(destination), { recursive: true })
 writeFileSync(destination, JSON.stringify(value, null, 2)+'\n')
 files.push(path)
}
function packProjectPackage(path) {
 const manifest = JSON.parse(readFileSync(join(root, path, 'package.json')))
 const destination = join(source, 'project-packages')
 mkdirSync(destination, { recursive: true })
 const packed = spawnSync('bun', ['pm', 'pack', '--ignore-scripts', '--destination', destination], {
  cwd: join(root, path), encoding: 'utf8', timeout: 120000,
 })
 assert.equal(packed.status, 0, packed.stderr)
 const file = `project-packages/${manifest.name.replace('@', '').replace('/', '-')}-${manifest.version}.tgz`
 const bytes = readFileSync(join(source, file))
 files.push(file)
 return { name: manifest.name, version: manifest.version, file, bytes: bytes.length, sha256: sha256(bytes) }
}
try {
 await prepareOrtHeaders()
 for (const [name, pin] of Object.entries(ortPin.headers)) {
  const path = `research/nim-cli/ort-headers/${ortPin.version}/${name}`
  const bytes = readFileSync(join(root, path))
  assert.equal(bytes.length, pin.bytes); assert.equal(sha256(bytes), pin.sha256)
  copy(path)
 }
 for (const file of readdirSync(join(root, 'packages/cli/nim')).sort()) {
  if (/\.(nim|c|h)$/.test(file) || file === 'metadata.json') {copy('packages/cli/nim/'+file)}
 }
 for (const file of ['dependencies.mjs', 'nim-dependencies.json', 'model-assets.json', 'ort-runtime.json', 'windows-http-build.mjs', 'portability-build.mjs', 'portability-smoke.mjs', 'portability-proof.mjs',
  'http_probe.nim', 'http.test.mjs', 'http-reference.mjs', 'http-live.mjs', 'native-inputs.mjs',
  'process_probe.nim', 'process.test.mjs', 'process-windows.test.mjs', 'process-reference.mjs',
  'storage_probe.nim', 'storage-windows.test.mjs', 'rpc_probe.nim', 'rpc.test.mjs', 'host_probe.nim', 'host-bootstrap.test.mjs', 'host-integration.test.mjs', 'host-windows.test.mjs', 'scratch.mjs',
  'portability-workflow.mjs', 'portability-owner-handoff.mjs',
  'licenses/tokenizers-js.txt', 'licenses/onnxruntime.txt']) {copy('tools/cli-nim/'+file)}
 copy('packages/cli/src/mcp/actions/bridge.ts')
 copy('packages/cli/src/mcp/runtime/process.ts')
 const repository = JSON.parse(readFileSync(join(root, 'package.json')))
 const tool = JSON.parse(readFileSync(join(root, 'tools/cli-nim/package.json')))
 assert.equal(tool.devDependencies['nim-toolchain'], '0.1.0')
 const turbo = repository.devDependencies.turbo
 assert.match(turbo, /^\d+\.\d+\.\d+$/)
 if (withProjectWorker) {
  json('project-packages.json', { version: 1, vite: repository.workspaces.catalog.vite,
   packages: [packProjectPackage('packages/build'), packProjectPackage('packages/lib')] })
 }
 json('package.json', { name: 'xplat-nim-portability-snapshot', private: true, type: 'module', packageManager: 'bun@1.4.4', workspaces: ['tools/cli-nim'], devDependencies: { turbo } })
 json('tools/cli-nim/package.json', { name: '@xplat/nim-portability-source', private: true, type: 'module', scripts: { 'build:portability': 'node portability-build.mjs', 'benchmark:portability': 'node portability-smoke.mjs',
  'build:portability-http': 'node portability-build.mjs http', 'test:portability-http': 'node --test http.test.mjs',
  'test:portability-http-live': 'node http-live.mjs',
  'build:portability-process': 'node portability-build.mjs process', 'test:portability-process': 'node --test process.test.mjs process-windows.test.mjs',
  'build:portability-storage': 'node portability-build.mjs storage', 'test:portability-storage': 'node --test storage-windows.test.mjs',
  'build:portability-rpc': 'node portability-build.mjs rpc', 'test:portability-rpc': 'node --test rpc.test.mjs',
  'test:portability-handoff-start': 'node portability-owner-handoff.mjs start', 'test:portability-handoff-verify': 'node portability-owner-handoff.mjs verify',
  'build:portability-host': 'node portability-build.mjs host', 'test:portability-host': 'node --test --test-concurrency=1 host-bootstrap.test.mjs host-integration.test.mjs host-windows.test.mjs',
  ...(withProjectWorker ? { 'test:portability-workflow': 'node portability-workflow.mjs' } : {}) }, devDependencies: { 'nim-toolchain': tool.devDependencies['nim-toolchain'] } })
 json('turbo.json', { tasks: {
  'build:portability': { cache: false, passThroughEnv: ['XPLAT_NIM_PORTABILITY_CACHE', 'XPLAT_NIM_CC', 'INCLUDE', 'LIB', 'LIBPATH'] },
  'build:portability-http': { cache: false, passThroughEnv: ['XPLAT_NIM_PORTABILITY_CACHE', 'XPLAT_NIM_CC', 'INCLUDE', 'LIB', 'LIBPATH'] },
  'test:portability-http': { cache: false, dependsOn: ['build:portability-http'], passThroughEnv: ['XPLAT_NIM_PORTABILITY_CACHE'] },
  'test:portability-http-live': { cache: false, dependsOn: ['build:portability-http'], passThroughEnv: ['XPLAT_NIM_PORTABILITY_CACHE'] },
  'build:portability-process': { cache: false, passThroughEnv: ['XPLAT_NIM_PORTABILITY_CACHE', 'XPLAT_NIM_CC', 'INCLUDE', 'LIB', 'LIBPATH'] },
  'test:portability-process': { cache: false, dependsOn: ['build:portability-process'], passThroughEnv: ['XPLAT_NIM_PORTABILITY_CACHE'] },
  'build:portability-storage': { cache: false, passThroughEnv: ['XPLAT_NIM_PORTABILITY_CACHE', 'XPLAT_NIM_CC', 'INCLUDE', 'LIB', 'LIBPATH'] },
  'test:portability-storage': { cache: false, dependsOn: ['build:portability-storage'], passThroughEnv: ['XPLAT_NIM_PORTABILITY_CACHE'] },
  'build:portability-rpc': { cache: false, passThroughEnv: ['XPLAT_NIM_PORTABILITY_CACHE', 'XPLAT_NIM_CC', 'INCLUDE', 'LIB', 'LIBPATH'] },
  'test:portability-rpc': { cache: false, dependsOn: ['build:portability-rpc'], passThroughEnv: ['XPLAT_NIM_PORTABILITY_CACHE'] },
  'build:portability-host': { cache: false, passThroughEnv: ['XPLAT_NIM_PORTABILITY_CACHE', 'XPLAT_NIM_CC', 'INCLUDE', 'LIB', 'LIBPATH'] },
  'test:portability-handoff-start': { cache: false, passThroughEnv: ['XPLAT_NIM_PORTABILITY_CACHE'] },
  'test:portability-handoff-verify': { cache: false, passThroughEnv: ['XPLAT_NIM_PORTABILITY_CACHE'] },
  'test:portability-host': { cache: false, dependsOn: ['build:portability-host', 'build:portability'], passThroughEnv: ['XPLAT_NIM_PORTABILITY_CACHE'] },
  ...(withProjectWorker ? { 'test:portability-workflow': { cache: false, dependsOn: ['build:portability', 'test:portability-http'], passThroughEnv: ['XPLAT_NIM_PORTABILITY_CACHE'] } } : {}),
  'benchmark:portability': { cache: false, passThroughEnv: ['XPLAT_NIM_SMOKE_BINARY', 'XPLAT_NIM_SMOKE_RECORD'] },
 } })
 const commit = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' })
 assert.equal(commit.status, 0, commit.stderr)
 const manifest = { version: 1, sourceCommit: commit.stdout.trim(), sourceNativeInputs: build.nativeInputs,
  files: files.sort().map(path => ({ path, sha256: sha256(readFileSync(join(source, path))) })) }
 const contents = JSON.stringify(manifest, null, 2)+'\n'
 writeFileSync(join(source, 'portability-source.json'), contents)
 const id = sha256(contents).slice(0, 16)
 const archive = join(work, `portability-source-${id}.tgz`)
 const packed = spawnSync('tar', ['-czf', archive, '-C', run, 'source'], { encoding: 'utf8' })
 assert.equal(packed.status, 0, packed.stderr)
 const bytes = readFileSync(archive)
 const output = { archive, bytes: bytes.length, sha256: sha256(bytes), manifestSha256: sha256(contents), sourceCommit: manifest.sourceCommit,
  projectWorkerFixture: withProjectWorker,
  scope: 'Identical native source and generated metadata; isolated pinned build tooling and optional project fixture packages; no host runtime qualification from snapshot creation' }
 writeFileSync(join(work, 'portability-snapshot.json'), JSON.stringify(output, null, 2)+'\n')
 console.log(JSON.stringify(output, null, 2))
} finally {rmSync(run, { recursive: true, force: true })}
