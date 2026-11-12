import { createHash } from 'node:crypto'

// Experimental fixed-Home wire contract. Never serialize Mason buffers or host IDs.
export const HOME_STYLE_KEYS = [
  'alignItems',
  'backgroundColor',
  'borderRadius',
  'borderWidth',
  'color',
  'columnGap',
  'cornerShape',
  'display',
  'flexDirection',
  'flexGrow',
  'flexShrink',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'height',
  'justifyContent',
  'lineHeight',
  'maxWidth',
  'minWidth',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'paddingTop',
  'rowGap',
  'textOverflow',
  'userSelect',
  'whiteSpace',
]
const HEADER_BYTES = 80
const MAX_BYTES = 1024 * 1024
function requireValue(condition, message) {
  if (!condition) throw new Error('Home IR: ' + message)
}
function plain(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    [Object.prototype, null].includes(Object.getPrototypeOf(value))
  )
}

/** Encode the trusted AOT projection. JSON remains the optional debug projection.
 * buildHash binds producer/runtime/CSS/initial-data inputs supplied by the host;
 * it is a compatibility check, not an authenticity signature.
 */
export function encodeHome(artifact, buildHash) {
  requireValue(/^[a-f0-9]{64}$/.test(buildHash), 'expected SHA-256 build identity')
  const chunks = []
  let bytes = HEADER_BYTES
  function append(data) {
    bytes += data.length
    requireValue(bytes <= MAX_BYTES, 'artifact byte limit')
    chunks.push(data)
  }
  function u8(value) {
    append(Buffer.from([value]))
  }
  function u32(value) {
    const data = Buffer.alloc(4)
    data.writeUInt32LE(value)
    append(data)
  }
  function string(value) {
    requireValue(typeof value === 'string' && value.isWellFormed(), 'invalid string')
    const data = Buffer.from(value, 'utf8')
    requireValue(data.length <= 65536, 'string byte limit')
    u32(data.length)
    append(data)
  }
  let values = 0
  function literal(value, depth = 0) {
    requireValue(++values <= 100000 && depth < 16, 'literal complexity limit')
    if (value === null) return u8(0)
    if (value === false) return u8(1)
    if (value === true) return u8(2)
    if (typeof value === 'number') {
      requireValue(Number.isFinite(value), 'non-finite number')
      u8(3)
      const data = Buffer.alloc(8)
      data.writeDoubleLE(value === 0 ? 0 : value)
      return append(data)
    }
    if (typeof value === 'string') {
      u8(4)
      return string(value)
    }
    requireValue(Array.isArray(value) || plain(value), 'nonportable literal')
    const array = Array.isArray(value)
    requireValue(!array || value.length <= 1024, 'literal collection limit')
    const keys = array
      ? Array.from({ length: value.length }, (_, index) => String(index))
      : Object.keys(value).sort()
    requireValue(keys.length <= (array ? 1024 : 256), 'literal collection limit')
    u8(array ? 5 : 6)
    u32(keys.length)
    for (const key of keys) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key)
      requireValue(descriptor && Object.hasOwn(descriptor, 'value'), 'accessor or sparse literal')
      if (!array) string(key)
      literal(descriptor.value, depth + 1)
    }
  }
  const nodes = artifact.nodes
  requireValue(Array.isArray(nodes) && nodes.length > 0 && nodes.length <= 1024, 'node count')
  requireValue(plain(artifact.seed), 'initial data object')
  string(artifact.scope)
  literal(artifact.seed)
  const children = nodes.map(() => [])
  const paths = []
  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index]
    requireValue(
      node.index === index && ['masonview', 'label'].includes(node.kind),
      'node identity or kind',
    )
    requireValue(
      index === 0
        ? node.parent === null
        : Number.isInteger(node.parent) &&
            node.parent >= 0 &&
            node.parent < index &&
            nodes[node.parent].kind === 'masonview',
      'parent ordering or kind',
    )
    const path = index === 0 ? '0' : paths[node.parent] + '/' + children[node.parent].length
    requireValue(
      node.path === path && (node.kind !== 'masonview' || node.text === ''),
      'node path or container text',
    )
    paths.push(path)
    if (index > 0) children[node.parent].push(index)
    requireValue(plain(node.props), 'host props object')
    u8(node.kind === 'masonview' ? 0 : 1)
    u32(index === 0 ? 0xffffffff : node.parent)
    string(node.text)
    literal(node.props)
  }
  for (let index = 0; index < nodes.length; index++)
    requireValue(
      JSON.stringify(nodes[index].children) === JSON.stringify(children[index]),
      'child order',
    )
  requireValue(
    plain(artifact.variants) && Object.keys(artifact.variants).sort().join(',') === 'dark,light',
    'exact light/dark variants required',
  )
  for (const theme of ['light', 'dark']) {
    const records = artifact.variants[theme]
    requireValue(Array.isArray(records) && records.length === nodes.length, 'variant node count')
    for (let index = 0; index < records.length; index++) {
      const record = records[index]
      requireValue(record.index === index && plain(record.style), 'style record identity')
      for (const [key, value] of Object.entries(record.style))
        requireValue(
          HOME_STYLE_KEYS.includes(key) && (typeof value === 'string' || typeof value === 'number'),
          'unsupported style property',
        )
      for (const keys of [record.cssKeys, record.inheritedKeys])
        requireValue(
          Array.isArray(keys) &&
            new Set(keys).size === keys.length &&
            keys.every((key) => Object.hasOwn(record.style, key)),
          'invalid style provenance',
        )
      literal(record.style)
      literal(record.cssKeys)
      literal(record.inheritedKeys)
    }
  }
  const payload = Buffer.concat(chunks)
  const header = Buffer.alloc(HEADER_BYTES)
  header.write('XPH1')
  header.writeUInt16LE(1, 4)
  header.writeUInt32LE(bytes, 8)
  header.writeUInt32LE(nodes.length, 12)
  Buffer.from(buildHash, 'hex').copy(header, 16)
  createHash('sha256').update(payload).digest().copy(header, 48)
  return Buffer.concat([header, payload])
}
