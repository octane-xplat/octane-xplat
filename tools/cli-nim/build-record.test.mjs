import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { nativeInputs, artifactFingerprint, assertCurrentNativeBuild } from './native-inputs.mjs'

test('benchmark records bind source bytes, host and the exact executable rather than a shared version', t => {
 const root = mkdtempSync(join(tmpdir(), 'xplat-nim-record-'))
 t.after(() => rmSync(root, { recursive: true, force: true }))
 const files = ['packages/cli/nim/main.nim', 'packages/cli/nim/metadata.json', 'tools/cli-nim/nim-dependencies.json',
  'tools/cli-nim/build.mjs', 'tools/cli-nim/native-inputs.mjs', 'tools/cli-nim/package.json']
 for (const path of files) { mkdirSync(dirname(join(root, path)), { recursive: true }); writeFileSync(join(root, path), path) }
 const bytes = Buffer.from('fixture executable bytes; this fixture does not qualify a native target')
 const record = { version: '0.19.0-nim.0', platform: process.platform, arch: process.arch,
  nativeInputs: nativeInputs(root), nativeArtifact: artifactFingerprint(bytes) }
 assert.doesNotThrow(() => assertCurrentNativeBuild(root, record, bytes))
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
})
