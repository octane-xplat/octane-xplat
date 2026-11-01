import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

export function nativeInputs(root) {
 const files = [...readdirSync(join(root, 'packages/cli/nim')).filter(file => /\.(nim|c|h)$/.test(file)).map(file => `packages/cli/nim/${file}`),
  'packages/cli/nim/metadata.json', 'tools/cli-nim/nim-dependencies.json', 'tools/cli-nim/build.mjs',
  'tools/cli-nim/native-inputs.mjs', 'tools/cli-nim/dependencies.mjs',
  'tools/cli-nim/licenses/tokenizers-js.txt', 'tools/cli-nim/ort-runtime.json',
  'tools/cli-nim/build-model.mjs', 'tools/cli-nim/model_probe.nim', 'tools/cli-nim/package.json'].sort()
 const hash = createHash('sha256')
 for (const file of files) hash.update(file).update('\0').update(readFileSync(join(root, file))).update('\0')
 return { files, sha256: hash.digest('hex') }
}

export function artifactFingerprint(bytes) {
 return { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }
}

export function assertCurrentNativeBuild(root, build, bytes) {
 assert.equal(build.platform, process.platform, 'Benchmark needs an executable built for this host')
 assert.equal(build.arch, process.arch, 'Benchmark needs an executable built for this host architecture')
 assert.equal(build.nativeInputs?.sha256, nativeInputs(root).sha256, 'Sources differ from the build record; rebuild before measuring')
 const artifact = artifactFingerprint(bytes)
 assert.equal(build.nativeArtifact?.sha256, artifact.sha256, 'Executable differs from the build record; rebuild before measuring')
 assert.equal(build.nativeArtifact?.bytes, artifact.bytes, 'Executable length differs from the build record; rebuild before measuring')
}
