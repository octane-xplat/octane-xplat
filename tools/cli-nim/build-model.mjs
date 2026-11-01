// Optional inference probe: native C headers/libraries stay task-local.
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { getToolchain } from 'nim-toolchain'
import { prepareDependencies } from './dependencies.mjs'
import { runtimeDir, runtimeTarget, runtimePin } from './ort-fixtures.mjs'
import { nativeInputs, artifactFingerprint } from './native-inputs.mjs'

const root = resolve(import.meta.dirname, '../..')
const work = join(root, 'research/nim-cli')
if (!runtimeTarget) throw Error('Native inference qualification currently requires macOS arm64')
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const header = readFileSync(join(runtimeDir, 'include/onnxruntime_c_api.h'))
const library = readFileSync(join(runtimeDir, runtimeTarget.library))
assert.equal(sha(header), runtimeTarget.headerSha256, 'Pinned native header differs')
assert.equal(sha(library), runtimeTarget.librarySha256, 'Pinned native library differs')
const compiler = await getToolchain({ cacheDir: join(work, 'toolchain') })
const paths = prepareDependencies(work, compiler)
const binary = join(work, 'native/model-probe')
const flags = ['c', '-d:release', '--opt:size', '--mm:orc', '--passL:-dead_strip',
 ...paths.map(path => `--path:${path}`), `--cincludes:${join(runtimeDir, 'include')}`,
 `--nimcache:${join(work, 'model-cache')}`, `-o:${binary}`, join(import.meta.dirname, 'model_probe.nim')]
const inputs = nativeInputs(root)
for (const [command, args] of [[compiler.nim, flags], ['strip', [binary]]]) {
 const run = spawnSync(command, args, { stdio: 'inherit' })
 if (run.status !== 0) throw Error('Native model probe build failed')
}
assert.equal(nativeInputs(root).sha256, inputs.sha256, 'Sources changed during compilation')
writeFileSync(join(work, 'native/model-build.json'), JSON.stringify({ version: runtimePin.version,
 platform: process.platform, arch: process.arch, nativeInputs: inputs,
 nativeArtifact: artifactFingerprint(readFileSync(binary)), headerSha256: sha(header), librarySha256: sha(library) }))
