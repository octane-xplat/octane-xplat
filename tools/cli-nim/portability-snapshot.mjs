// A small immutable native source snapshot; shared remote checkouts stay untouched.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cpSync, readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { scratchRun } from './scratch.mjs'
import { assertCurrentNativeBuild } from './native-inputs.mjs'

const root = resolve(import.meta.dirname, '../..')
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
try {
 for (const file of readdirSync(join(root, 'packages/cli/nim')).sort()) {
  if (/\.(nim|c|h)$/.test(file) || file === 'metadata.json') {copy('packages/cli/nim/'+file)}
 }
 for (const file of ['dependencies.mjs', 'nim-dependencies.json', 'model-assets.json', 'ort-runtime.json', 'portability-build.mjs',
  'licenses/tokenizers-js.txt', 'licenses/onnxruntime.txt']) {copy('tools/cli-nim/'+file)}
 const repository = JSON.parse(readFileSync(join(root, 'package.json')))
 const tool = JSON.parse(readFileSync(join(root, 'tools/cli-nim/package.json')))
 assert.equal(tool.devDependencies['nim-toolchain'], '0.1.0')
 const turbo = repository.devDependencies.turbo
 assert.match(turbo, /^\d+\.\d+\.\d+$/)
 json('package.json', { name: 'xplat-nim-portability-snapshot', private: true, type: 'module', packageManager: 'bun@1.4.4', workspaces: ['tools/cli-nim'], devDependencies: { turbo } })
 json('tools/cli-nim/package.json', { name: '@xplat/nim-portability-source', private: true, type: 'module', scripts: { 'build:portability': 'node portability-build.mjs' }, devDependencies: { 'nim-toolchain': tool.devDependencies['nim-toolchain'] } })
 json('turbo.json', { tasks: { 'build:portability': { cache: false, passThroughEnv: ['XPLAT_NIM_PORTABILITY_CACHE', 'XPLAT_NIM_CC', 'INCLUDE', 'LIB', 'LIBPATH'] } } })
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
  scope: 'Identical native source and generated metadata; isolated pinned build tooling; no host runtime qualification' }
 writeFileSync(join(work, 'portability-snapshot.json'), JSON.stringify(output, null, 2)+'\n')
 console.log(JSON.stringify(output, null, 2))
} finally {rmSync(run, { recursive: true, force: true })}
