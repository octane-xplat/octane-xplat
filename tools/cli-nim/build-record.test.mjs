import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { nativeInputs, artifactFingerprint, assertCurrentNativeBuild, httpProbeInputs, processProbeInputs, envProbeInputs, rpcProbeInputs, hostProbeInputs, coreInputs } from './native-inputs.mjs'

test('benchmark records bind source bytes, host and the exact executable rather than a shared version', t => {
 const root = mkdtempSync(join(tmpdir(), 'xplat-nim-record-'))
 t.after(() => rmSync(root, { recursive: true, force: true }))
 const files = ['packages/cli/nim/main.nim', 'packages/cli/nim/metadata.json', 'packages/cli/nim/route_templates.json',
  'packages/cli/src/commands/routes.ts', 'tools/cli-nim/route-templates.mjs', 'tools/cli-nim/nim-dependencies.json',
  'packages/cli/src/mcp/contracts/capabilities.ts', 'packages/cli/src/mcp/contracts/boundaries.ts',
  'tools/cli-nim/build.mjs', 'tools/cli-nim/native-inputs.mjs', 'tools/cli-nim/dependencies.mjs',
  'tools/cli-nim/licenses/tokenizers-js.txt', 'tools/cli-nim/ort-runtime.json',
  'tools/cli-nim/build-model.mjs', 'tools/cli-nim/model_probe.nim', 'tools/cli-nim/package.json']
 for (const path of files) { mkdirSync(dirname(join(root, path)), { recursive: true }); writeFileSync(join(root, path), path) }
 const bytes = Buffer.from('fixture executable bytes; this fixture does not qualify a native target')
 const record = { version: '0.19.0-nim.0', platform: process.platform, arch: process.arch,
  nativeInputs: nativeInputs(root), nativeArtifact: artifactFingerprint(bytes) }
 assert.doesNotThrow(() => assertCurrentNativeBuild(root, record, bytes))
 for (const file of ['packages/cli/nim/route_templates.json', 'packages/cli/src/commands/routes.ts', 'tools/cli-nim/route-templates.mjs',
  'packages/cli/src/mcp/contracts/capabilities.ts', 'packages/cli/src/mcp/contracts/boundaries.ts']) {
  writeFileSync(join(root, file), 'changed embedded contract or rendering input')
  assert.throws(() => assertCurrentNativeBuild(root, record, bytes), /Sources differ/)
  writeFileSync(join(root, file), file)
  assert.doesNotThrow(() => assertCurrentNativeBuild(root, record, bytes))
 }
 for (const file of ['tools/cli-nim/build-probe.mjs','tools/cli-nim/process_probe.nim','tools/cli-nim/env_probe.nim','tools/cli-nim/sessions_scenario.nim','tools/cli-nim/jobs_scenario.nim','tools/cli-nim/rpc_probe.nim','tools/cli-nim/host_probe.nim','tools/cli-nim/core.nim','tools/cli-nim/catalog.json','tools/cli-nim/prepare.mjs']) writeFileSync(join(root,file),file)
 const processRecord = { ...record, nativeInputs: processProbeInputs(root) }
 const coreRecord = { ...record, nativeInputs: coreInputs(root) }
 const envRecord = { ...record, nativeInputs: envProbeInputs(root) }
 const rpcRecord = { ...record, nativeInputs: rpcProbeInputs(root) }
 const hostRecord = { ...record, nativeInputs: hostProbeInputs(root) }
 assert.doesNotThrow(() => assertCurrentNativeBuild(root,processRecord,bytes,processProbeInputs))
 assert.doesNotThrow(() => assertCurrentNativeBuild(root,coreRecord,bytes,coreInputs))
 assert.doesNotThrow(() => assertCurrentNativeBuild(root,envRecord,bytes,envProbeInputs))
 assert.doesNotThrow(() => assertCurrentNativeBuild(root,rpcRecord,bytes,rpcProbeInputs))
 assert.doesNotThrow(() => assertCurrentNativeBuild(root,hostRecord,bytes,hostProbeInputs))
 writeFileSync(join(root,'tools/cli-nim/host_probe.nim'),'changed host bootstrap adapter')
 assert.throws(() => assertCurrentNativeBuild(root,hostRecord,bytes,hostProbeInputs),/Sources differ/)
 assert.doesNotThrow(() => assertCurrentNativeBuild(root,rpcRecord,bytes,rpcProbeInputs))
 writeFileSync(join(root,'tools/cli-nim/host_probe.nim'),'tools/cli-nim/host_probe.nim')
 writeFileSync(join(root,'tools/cli-nim/rpc_probe.nim'),'changed RPC adapter')
 assert.throws(() => assertCurrentNativeBuild(root,rpcRecord,bytes,rpcProbeInputs),/Sources differ/)
 assert.doesNotThrow(() => assertCurrentNativeBuild(root,envRecord,bytes,envProbeInputs))
 writeFileSync(join(root,'tools/cli-nim/rpc_probe.nim'),'tools/cli-nim/rpc_probe.nim')
 for (const file of ['tools/cli-nim/sessions_scenario.nim','tools/cli-nim/jobs_scenario.nim']) {
  writeFileSync(join(root,file),'changed registry scenario')
  assert.throws(() => assertCurrentNativeBuild(root,envRecord,bytes,envProbeInputs),/Sources differ/)
  assert.doesNotThrow(() => assertCurrentNativeBuild(root,record,bytes))
  writeFileSync(join(root,file),file)
 }
 writeFileSync(join(root,'tools/cli-nim/process_probe.nim'),'changed process driver')
 assert.throws(() => assertCurrentNativeBuild(root,processRecord,bytes,processProbeInputs),/Sources differ/)
 assert.doesNotThrow(() => assertCurrentNativeBuild(root,record,bytes))
 writeFileSync(join(root,'tools/cli-nim/core.nim'),'changed combined entry')
 assert.throws(() => assertCurrentNativeBuild(root,coreRecord,bytes,coreInputs),/Sources differ/)
 assert.doesNotThrow(() => assertCurrentNativeBuild(root,record,bytes))
 // A same-sized replacement could still report the same --version.
 const replacement = Buffer.from(bytes); replacement[0] ^= 1
 assert.throws(() => assertCurrentNativeBuild(root, record, replacement), /Executable differs/)
 assert.throws(() => assertCurrentNativeBuild(root, { ...record, nativeArtifact: undefined }, bytes), /Executable differs/)
 assert.throws(() => assertCurrentNativeBuild(root, { ...record, nativeInputs: undefined }, bytes), /Sources differ/)
 assert.throws(() => assertCurrentNativeBuild(root, { ...record, platform: 'other-host' }, bytes), /this host/)
 assert.throws(() => assertCurrentNativeBuild(root, { ...record, arch: 'other-architecture' }, bytes), /this host architecture/)
 writeFileSync(join(root, 'packages/cli/nim/main.nim'), 'edited source')
 assert.throws(() => assertCurrentNativeBuild(root, record, bytes), /Sources differ/)
 writeFileSync(join(root, 'packages/cli/nim/main.nim'), 'packages/cli/nim/main.nim')
 assert.doesNotThrow(() => assertCurrentNativeBuild(root, record, bytes))
 writeFileSync(join(root, 'packages/cli/nim/extra.nim'), 'new native module')
 assert.throws(() => assertCurrentNativeBuild(root, record, bytes), /Sources differ/)
 rmSync(join(root, 'packages/cli/nim/extra.nim'))
 writeFileSync(join(root, 'tools/cli-nim/licenses/tokenizers-js.txt'), 'changed attribution')
 assert.throws(() => assertCurrentNativeBuild(root, record, bytes), /Sources differ/)
 writeFileSync(join(root, 'tools/cli-nim/licenses/tokenizers-js.txt'), 'tools/cli-nim/licenses/tokenizers-js.txt')
 writeFileSync(join(root, 'packages/cli/nim/ffi.c'), 'new C bridge')
 assert.throws(() => assertCurrentNativeBuild(root, record, bytes), /Sources differ/)
 rmSync(join(root, 'packages/cli/nim/ffi.c'))
 for (const file of ['tools/cli-nim/http_probe.nim', 'tools/cli-nim/build-probe.mjs']) writeFileSync(join(root, file), file)
 const httpRecord = { ...record, nativeInputs: httpProbeInputs(root) }
 assert.doesNotThrow(() => assertCurrentNativeBuild(root, httpRecord, bytes, httpProbeInputs))
 writeFileSync(join(root, 'tools/cli-nim/http_probe.nim'), 'changed probe entry')
 assert.throws(() => assertCurrentNativeBuild(root, httpRecord, bytes, httpProbeInputs), /Sources differ/)
 assert.doesNotThrow(() => assertCurrentNativeBuild(root, record, bytes))
})
