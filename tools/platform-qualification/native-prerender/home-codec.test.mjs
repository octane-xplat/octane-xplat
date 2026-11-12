import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { encodeHome } from './home-codec.mjs'

const build = 'ab'.repeat(32)
const fixture = {
  scope: 'Experimental Home codec 🏠',
  seed: { name: 'Alex', initialCompleted: 3, nested: [null, false, true, 0.125] },
  nodes: [
    {
      index: 0,
      path: '0',
      kind: 'masonview',
      parent: null,
      text: '',
      props: { style: { display: 'flex' } },
      children: [1],
    },
    {
      index: 1,
      path: '0/0',
      kind: 'label',
      parent: 0,
      text: 'Hello, 世界',
      props: { maxLines: 0 },
      children: [],
    },
  ],
  variants: Object.fromEntries(
    ['light', 'dark'].map((theme) => [
      theme,
      [
        {
          index: 0,
          style: { backgroundColor: theme === 'light' ? '#ffffff' : '#000000' },
          cssKeys: ['backgroundColor'],
          inheritedKeys: [],
        },
        {
          index: 1,
          style: { fontSize: 15, color: '#172033' },
          cssKeys: ['fontSize'],
          inheritedKeys: ['color'],
        },
      ],
    ]),
  ),
}
const binary = process.env.XPLAT_HOME_CODEC_NATIVE
const work = process.env.XPLAT_HOME_CODEC_WORK
assert.ok(
  binary && work,
  'Use the test:prerender:codec Turbo task to compile the native reader first',
)
let sequence = 0
function native(data, hash = build) {
  const file = join(work, 'case-' + sequence++ + '.bin')
  writeFileSync(file, data)
  return spawnSync(binary, [file, hash], { encoding: 'utf8', timeout: 10000 })
}
function rejects(data, hash) {
  const result = native(data, hash)
  assert.equal(result.status, 1, result.stderr)
  assert.match(result.stderr, /Home IR rejected/)
}
function resigned(data) {
  const result = Buffer.from(data)
  result.writeUInt32LE(result.length, 8)
  createHash('sha256').update(result.subarray(80)).digest().copy(result, 48)
  return result
}

test('native reader returns the same semantic artifact, including Unicode and typed props', () => {
  const encoded = encodeHome(fixture, build)
  const result = native(encoded)
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), fixture)
  assert.deepEqual(encodeHome({ ...fixture, seed: { ...fixture.seed } }, build), encoded)
})
test('writer rejects invalid tree references, order and host kinds', () => {
  for (const change of [
    (x) => (x.nodes[1].parent = 2),
    (x) => (x.nodes[0].children = []),
    (x) => (x.nodes[1].kind = 'webview'),
    (x) => (x.nodes[1].path = '0/9'),
  ]) {
    const input = structuredClone(fixture)
    change(input)
    assert.throws(() => encodeHome(input, build), /Home IR/)
  }
})
test('writer rejects callbacks, accessors, sparse arrays and non-finite values', () => {
  for (const value of [
    () => {},
    Infinity,
    new Date(),
    Array(2),
    {
      get value() {
        throw new Error('must not run')
      },
    },
    '\ud800',
  ]) {
    const input = structuredClone(fixture)
    input.seed.bad = value
    assert.throws(() => encodeHome(input, build), /Home IR/)
  }
})
test('writer rejects unknown styles, provenance and missing variants', () => {
  for (const change of [
    (x) => (x.variants.light[0].style.unknown = 0),
    (x) => x.variants.light[0].cssKeys.push('color'),
    (x) => delete x.variants.dark,
  ]) {
    const input = structuredClone(fixture)
    change(input)
    assert.throws(() => encodeHome(input, build), /Home IR/)
  }
})
test('writer bounds nesting, collection sizes and strings', () => {
  let nested = 0
  for (let index = 0; index < 16; index++) nested = [nested]
  for (const value of [nested, Array(1025).fill(0), 'a'.repeat(65537)]) {
    const input = structuredClone(fixture)
    input.seed.bad = value
    assert.throws(() => encodeHome(input, build), /Home IR/)
  }
})
test('native reader rejects header incompatibility, wrong build, checksums and truncation', () => {
  const data = encodeHome(fixture, build)
  rejects(data, 'cd'.repeat(32))
  for (const offset of [0, 4, 6, 8, 12, 16, 48, data.length - 1]) {
    const copy = Buffer.from(data)
    copy[offset] ^= 255
    rejects(copy)
  }
  for (const end of [0, 79, 80, data.length - 1]) rejects(data.subarray(0, end))
  rejects(resigned(Buffer.concat([data, Buffer.from([0])])))
})
test('native reader rejects unsupported setter values in either theme before mounting', () => {
  for (const [key, value] of [
    ['display', 'block'],
    ['flexDirection', 'row-reverse'],
    ['alignItems', 'stretch'],
    ['justifyContent', 'start'],
    ['maxWidth', '80%'],
    ['cornerShape', 'invalid'],
    ['whiteSpace', 'pre'],
    ['textOverflow', 'fade'],
    ['userSelect', 'text'],
    ['fontFamily', 'Arial,,Helvetica'],
    ['fontFamily', 12],
    ['fontSize', 0],
    ['fontSize', '15px'],
    ['fontWeight', 550],
    ['fontWeight', '600'],
    ['borderWidth', 1],
    ['borderRadius', -1],
    ['paddingTop', '24px'],
    ['height', -1],
    ['lineHeight', 1e100],
    ['color', '#12zz34'],
    ['color', '#fff'],
    ['color', 'rgba(1, 2, 3, 2)'],
    ['color', 'rgba(-1, 2, 3, 1)'],
    ['color', 'rgba(1, 2, 300, 1)'],
    ['color', 'rgba(1, 2, nan, 1)'],
    ['color', 'rgba(1, 2, 3, 1)trailing'],
    ['backgroundColor', 123],
  ]) {
    for (const theme of ['light', 'dark']) {
      const input = structuredClone(fixture)
      // Put a bad value on the last node, including the unused theme. All
      // records must pass preflight, rather than failing halfway through mount.
      input.variants[theme].at(-1).style[key] = value
      const result = native(encodeHome(input, build))
      assert.equal(result.status, 1, `${theme}.${key}: ${result.stderr}`)
      assert.match(result.stderr, /unsupported style value/)
    }
  }
})
test('native reader rejects malformed payloads even with a matching checksum', () => {
  const data = encodeHome(fixture, build)
  const scopeBytes = Buffer.byteLength(fixture.scope)
  const seedTag = 84 + scopeBytes
  for (const [offset, value] of [
    [80, 255],
    [84, 255],
    [seedTag, 255],
    [seedTag + 1, 255],
  ]) {
    const copy = Buffer.from(data)
    copy[offset] = value
    rejects(resigned(copy))
  }
  // Root follows the scope and seed literals. Locate its fixed kind/parent prefix.
  const prefix = Buffer.from([0, 255, 255, 255, 255, 0, 0, 0, 0])
  const root = data.indexOf(prefix, seedTag)
  assert.ok(root > seedTag)
  const badKind = Buffer.from(data)
  badKind[root] = 2
  rejects(resigned(badKind))
  const badParent = Buffer.from(data)
  badParent.writeUInt32LE(0, root + 1)
  rejects(resigned(badParent))
})
test(
  'actual AOT Home projection round-trips through the native reader when supplied',
  { skip: !process.env.XPLAT_HOME_CODEC_INPUT },
  () => {
    const input = JSON.parse(readFileSync(process.env.XPLAT_HOME_CODEC_INPUT, 'utf8'))
    const encoded = encodeHome(input, build)
    const result = native(encoded)
    assert.equal(result.status, 0, result.stderr)
    assert.deepEqual(JSON.parse(result.stdout), input)
    writeFileSync(join(work, 'home.bin'), encoded)
    writeFileSync(join(work, 'home.debug.json'), JSON.stringify(input, null, 2))
  },
)
