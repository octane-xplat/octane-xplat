import { createHash } from 'node:crypto'
import { ARTIFACT_LIMITS, integer, record, requireArtifact, validateArtifact } from './schema.ts'
import type { StartupArtifact, Literal, LiteralObject } from './schema.ts'

export type ArtifactIdentity = { build: string; platform: 'ios' | 'android' }
const HEADER_BYTES = 80
const digest = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest()

/** XPI1 is a portable tagged binary tree, never a native struct or JSON payload. */
export function encodeStartupArtifact(input: unknown): Uint8Array {
  const artifact = validateArtifact(input)
  const chunks: Buffer[] = []
  let bytes = HEADER_BYTES,
    values = 0
  function append(data: Buffer) {
    bytes += data.length
    requireArtifact(bytes <= ARTIFACT_LIMITS.bytes, 'artifact byte limit')
    chunks.push(data)
  }
  function byte(value: number) {
    append(Buffer.from([value]))
  }
  function u32(value: number) {
    const buffer = Buffer.alloc(4)
    buffer.writeUInt32LE(value)
    append(buffer)
  }
  function text(value: string) {
    const buffer = Buffer.from(value, 'utf8')
    requireArtifact(buffer.length <= 65536, 'string byte limit')
    u32(buffer.length)
    append(buffer)
  }
  function literal(value: unknown, depth: number) {
    requireArtifact(++values <= ARTIFACT_LIMITS.values && depth < 32, 'binary literal complexity')
    if (value === null) return byte(0)
    if (value === false) return byte(1)
    if (value === true) return byte(2)
    if (typeof value === 'number') {
      requireArtifact(Number.isFinite(value), 'non-finite number')
      byte(3)
      const buffer = Buffer.alloc(8)
      buffer.writeDoubleLE(value === 0 ? 0 : value)
      return append(buffer)
    }
    if (typeof value === 'string') {
      byte(4)
      return text(value)
    }
    if (Array.isArray(value)) {
      byte(5)
      u32(value.length)
      for (const item of value) literal(item, depth + 1)
      return
    }
    const object = record(value, 'binary literal')
    const keys = Object.keys(object).sort()
    byte(6)
    u32(keys.length)
    for (const key of keys) {
      text(key)
      literal(object[key], depth + 1)
    }
  }
  literal(artifact, 0)
  const payload = Buffer.concat(chunks)
  const header = Buffer.alloc(HEADER_BYTES)
  header.write('XPI1')
  header.writeUInt16LE(1, 4)
  header.writeUInt32LE(bytes, 8)
  header.writeUInt32LE(artifact.nodes.length, 12)
  Buffer.from(artifact.build, 'hex').copy(header, 16)
  digest(payload).copy(header, 48)
  return Buffer.concat([header, payload])
}

function identity(artifact: StartupArtifact, expected: ArtifactIdentity) {
  requireArtifact(
    artifact.build === expected.build && artifact.platform === expected.platform,
    'artifact/app identity mismatch',
  )
}

/** Decode/validate completely before returning records to a native allocator. */
export function decodeStartupArtifact(
  input: Uint8Array,
  expected: ArtifactIdentity,
): StartupArtifact {
  requireArtifact(
    input.byteLength >= HEADER_BYTES && input.byteLength <= ARTIFACT_LIMITS.bytes,
    'artifact byte length',
  )
  const data = Buffer.from(input)
  requireArtifact(
    data.subarray(0, 4).equals(Buffer.from('XPI1')) &&
      data.readUInt16LE(4) === 1 &&
      data.readUInt16LE(6) === 0,
    'binary version or required flags',
  )
  requireArtifact(data.readUInt32LE(8) === data.length, 'binary length')
  const count = integer(data.readUInt32LE(12), 1, ARTIFACT_LIMITS.nodes, 'header node count')
  requireArtifact(
    /^[a-f0-9]{64}$/.test(expected.build) &&
      data.subarray(16, 48).toString('hex') === expected.build,
    'binary build identity',
  )
  const payload = data.subarray(HEADER_BYTES)
  requireArtifact(digest(payload).equals(data.subarray(48, 80)), 'payload checksum')
  let offset = HEADER_BYTES,
    values = 0
  function take(length: number): Buffer {
    requireArtifact(length >= 0 && offset + length <= data.length, 'truncated binary value')
    const result = data.subarray(offset, offset + length)
    offset += length
    return result
  }
  function u32() {
    return take(4).readUInt32LE(0)
  }
  function text() {
    const length = integer(u32(), 0, 65536, 'string byte length')
    return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(take(length))
  }
  function literal(depth: number): Literal {
    requireArtifact(++values <= ARTIFACT_LIMITS.values && depth < 32, 'binary literal complexity')
    const tag = take(1)[0]
    if (tag === 0) return null
    if (tag === 1 || tag === 2) return tag === 2
    if (tag === 3) {
      const value = take(8).readDoubleLE(0)
      requireArtifact(Number.isFinite(value), 'non-finite binary value')
      return value === 0 ? 0 : value
    }
    if (tag === 4) return text()
    requireArtifact(tag === 5 || tag === 6, 'unknown binary value tag')
    const count = integer(
      u32(),
      0,
      tag === 5 ? ARTIFACT_LIMITS.nodes : 256,
      'binary collection size',
    )
    if (tag === 5) return Array.from({ length: count }, () => literal(depth + 1))
    const result: LiteralObject = Object.create(null)
    let previous: string | undefined
    for (let index = 0; index < count; index++) {
      const key = text()
      requireArtifact(previous === undefined || previous < key, 'duplicate or unsorted object key')
      result[key] = literal(depth + 1)
      previous = key
    }
    return result
  }
  const artifact = validateArtifact(literal(0))
  requireArtifact(
    offset === data.length && artifact.nodes.length === count,
    'trailing bytes or header node count',
  )
  identity(artifact, expected)
  return artifact
}

export function writeStartupJson(input: unknown): string {
  const artifact = validateArtifact(input)
  // Apply exactly the binary limits before emitting the optional debug form.
  encodeStartupArtifact(artifact)
  const text = JSON.stringify(artifact, null, 2) + '\n'
  requireArtifact(Buffer.byteLength(text, 'utf8') <= ARTIFACT_LIMITS.debugBytes, 'JSON byte limit')
  return text
}
export function readStartupJson(input: string, expected: ArtifactIdentity): StartupArtifact {
  requireArtifact(Buffer.byteLength(input, 'utf8') <= ARTIFACT_LIMITS.debugBytes, 'JSON byte limit')
  const artifact = validateArtifact(JSON.parse(input))
  identity(artifact, expected)
  encodeStartupArtifact(artifact)
  return artifact
}
