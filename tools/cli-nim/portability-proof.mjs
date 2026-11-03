import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, lstatSync } from 'node:fs'
import { join, resolve, sep } from 'node:path'

export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
export function verifyPortabilitySource(root) {
 const bytes = readFileSync(join(root, 'portability-source.json'))
 const manifest = JSON.parse(bytes)
 assert.equal(manifest.version, 1)
 assert.ok(Array.isArray(manifest.files) && manifest.files.length > 0)
 for (const item of manifest.files) {
  const path = resolve(root, item.path)
  assert.ok(path.startsWith(root+sep), 'Source path escaped snapshot')
  assert.ok(lstatSync(path).isFile() && !lstatSync(path).isSymbolicLink(), item.path)
  assert.equal(sha256(readFileSync(path)), item.sha256, `Source changed: ${item.path}`)
 }
 return { manifest, sha256: sha256(bytes) }
}
export function assertPortabilityArtifact(root, record, bytes, entry) {
 const source = verifyPortabilitySource(root)
 assert.equal(record.platform, process.platform)
 assert.equal(record.arch, process.arch)
 assert.equal(record.sourceManifestSha256, source.sha256)
 assert.equal(record.entry, entry)
 assert.equal(record.compiled, true)
 assert.equal(record.artifact.sha256, sha256(bytes))
 assert.equal(record.artifact.bytes, bytes.length)
}
