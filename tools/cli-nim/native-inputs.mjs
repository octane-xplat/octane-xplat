import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

export function nativeInputs(root) {
 const files = [...readdirSync(join(root, 'packages/cli/nim')).filter(file => /\.(nim|c|h)$/.test(file)).map(file => `packages/cli/nim/${file}`),
  'packages/cli/nim/metadata.json', 'packages/cli/src/commands/routes.ts', 'packages/cli/src/commands/build.ts',
  'packages/cli/src/commands/lint.ts', 'packages/lint/src/runner.ts', 'packages/lint/bin/lint.mjs',
  'packages/cli/src/mcp/contracts/capabilities.ts', 'packages/cli/src/mcp/contracts/boundaries.ts',
  'tools/cli-nim/route-templates.mjs', 'tools/cli-nim/nim-dependencies.json', 'tools/cli-nim/build.mjs',
  'tools/cli-nim/native-inputs.mjs', 'tools/cli-nim/dependencies.mjs', 'tools/cli-nim/windows-http-build.mjs',
  'tools/cli-nim/licenses/tokenizers-js.txt', 'tools/cli-nim/licenses/onnxruntime.txt', 'tools/cli-nim/ort-runtime.json',
  'tools/cli-nim/ort-headers.mjs', 'tools/cli-nim/model-assets.json',
  'tools/cli-nim/build-model.mjs', 'tools/cli-nim/model_probe.nim', 'tools/cli-nim/package.json'].sort()
 const hash = createHash('sha256')
 for (const file of files) {hash.update(file).update('\0').update(readFileSync(join(root, file))).update('\0')}
 return { files, sha256: hash.digest('hex') }
}

export function computeProbeInputs(root) {
 const files = [...nativeInputs(root).files, 'tools/cli-nim/docs_compute_probe.nim', 'tools/cli-nim/build-probe.mjs'].sort()
 const hash = createHash('sha256')
 for (const file of files) {hash.update(file).update('\0').update(readFileSync(join(root, file))).update('\0')}
 return { files, sha256: hash.digest('hex') }
}

export function httpProbeInputs(root) {
 const files = [...nativeInputs(root).files, 'tools/cli-nim/http_probe.nim', 'tools/cli-nim/build-probe.mjs'].sort()
 const hash = createHash('sha256')
 for (const file of files) {hash.update(file).update('\0').update(readFileSync(join(root, file))).update('\0')}
 return { files, sha256: hash.digest('hex') }
}

export function processProbeInputs(root) {
 const files = [...nativeInputs(root).files, 'tools/cli-nim/process_probe.nim', 'tools/cli-nim/build-probe.mjs'].sort()
 const hash = createHash('sha256')
 for (const file of files) {hash.update(file).update('\0').update(readFileSync(join(root, file))).update('\0')}
 return { files, sha256: hash.digest('hex') }
}

export function envProbeInputs(root) {
 const files = [...nativeInputs(root).files, 'tools/cli-nim/env_probe.nim', 'tools/cli-nim/sessions_scenario.nim', 'tools/cli-nim/jobs_scenario.nim', 'tools/cli-nim/history_scenario.nim', 'tools/cli-nim/build-probe.mjs'].sort()
 const hash = createHash('sha256')
 for (const file of files) {hash.update(file).update('\0').update(readFileSync(join(root, file))).update('\0')}
 return { files, sha256: hash.digest('hex') }
}

export function rpcProbeInputs(root) {
 const files = [...nativeInputs(root).files, 'tools/cli-nim/rpc_probe.nim', 'tools/cli-nim/build-probe.mjs'].sort()
 const hash = createHash('sha256')
 for (const file of files) {hash.update(file).update('\0').update(readFileSync(join(root, file))).update('\0')}
 return { files, sha256: hash.digest('hex') }
}

export function storageProbeInputs(root) {
 const files = [...nativeInputs(root).files, 'tools/cli-nim/storage_probe.nim', 'tools/cli-nim/build-probe.mjs'].sort()
 const hash = createHash('sha256')
 for (const file of files) {hash.update(file).update('\0').update(readFileSync(join(root, file))).update('\0')}
 return { files, sha256: hash.digest('hex') }
}

export function hostProbeInputs(root) {
 const files = [...nativeInputs(root).files, 'tools/cli-nim/host_probe.nim', 'tools/cli-nim/build-probe.mjs'].sort()
 const hash = createHash('sha256')
 for (const file of files) {hash.update(file).update('\0').update(readFileSync(join(root, file))).update('\0')}
 return { files, sha256: hash.digest('hex') }
}

export function coreInputs(root) {
 const files = [...readdirSync(join(root, 'packages/cli/nim')).filter(file => /\.(nim|c|h)$/.test(file)).map(file => `packages/cli/nim/${file}`),
  'tools/cli-nim/core.nim', 'tools/cli-nim/catalog.json', 'tools/cli-nim/nim-dependencies.json',
  'packages/cli/src/commands/routes.ts', 'packages/cli/src/commands/build.ts', 'tools/cli-nim/route-templates.mjs',
  'tools/cli-nim/prepare.mjs', 'tools/cli-nim/dependencies.mjs', 'tools/cli-nim/native-inputs.mjs',
  'tools/cli-nim/licenses/tokenizers-js.txt', 'tools/cli-nim/package.json'].sort()
 const hash = createHash('sha256')
 for (const file of files) {hash.update(file).update('\0').update(readFileSync(join(root, file))).update('\0')}
 return { files, sha256: hash.digest('hex') }
}

export function artifactFingerprint(bytes) {
 return { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }
}

export function assertCurrentNativeBuild(root, build, bytes, inputs = nativeInputs) {
 assert.equal(build.platform, process.platform, 'Benchmark needs an executable built for this host')
 assert.equal(build.arch, process.arch, 'Benchmark needs an executable built for this host architecture')
 assert.equal(build.nativeInputs?.sha256, inputs(root).sha256, 'Sources differ from the build record; rebuild before measuring')
 const artifact = artifactFingerprint(bytes)
 assert.equal(build.nativeArtifact?.sha256, artifact.sha256, 'Executable differs from the build record; rebuild before measuring')
 assert.equal(build.nativeArtifact?.bytes, artifact.bytes, 'Executable length differs from the build record; rebuild before measuring')
}
