import assert from 'node:assert/strict'
import test from 'node:test'
import { expected, commands, fixture, resign } from './fixture.mjs'
import {
  validateArtifact,
  projectPreparedTree,
  projectVisualTree,
  matchPreparedTree,
  checkLaunchEnvironment,
} from '../src/index.ts'
import {
  encodeStartupArtifact,
  decodeStartupArtifact,
  writeStartupJson,
  readStartupJson,
} from '../src/codec.ts'

test('binary and optional JSON round-trip the same validated artifact', () => {
  const value = fixture()
  const canonical = validateArtifact(value)
  const encoded = encodeStartupArtifact(value)
  assert.equal(Buffer.from(encoded).subarray(0, 4).toString(), 'XPI1')
  assert.deepEqual(decodeStartupArtifact(encoded, expected), canonical)
  assert.deepEqual(readStartupJson(writeStartupJson(value), expected), canonical)
  assert.deepEqual(
    encodeStartupArtifact(readStartupJson(writeStartupJson(value), expected)),
    encoded,
  )
  const offset = Buffer.concat([Buffer.from([1, 2]), encoded, Buffer.from([3])])
  assert.deepEqual(decodeStartupArtifact(offset.subarray(2, -1), expected), canonical)
})

test('different supported topology and command identities preserve artifact-local ownership', () => {
  for (const texts of [[], ['One'], ['One', 'Two', 3, false, null]]) {
    const source = commands(texts)
    const projection = projectPreparedTree(source)
    assert.equal(projection.nodes.length, 2 + texts.length)
    assert.deepEqual(projectPreparedTree(commands(texts, 20000)).nodes, projection.nodes)
    const visual = projectVisualTree(projection.nodes)
    assert.equal(visual.length, 2)
    assert.equal(
      visual[1].text,
      texts.map((value) => (value == null ? '' : String(value))).join(''),
    )
    assert.deepEqual(visual[0].children, [1])
    assert.deepEqual(
      [...matchPreparedTree(source, projection.nodes).visualByCommandId],
      [
        [100, 0],
        [101, 1],
      ],
    )
    assert.deepEqual(
      decodeStartupArtifact(encodeStartupArtifact(fixture(texts)), expected),
      validateArtifact(fixture(texts)),
    )
  }
  const root = [
    { index: 0, path: '0', parent: null, kind: 'label', props: { text: 'Single root' } },
  ]
  assert.equal(projectVisualTree(root)[0].text, 'Single root')
})

test('logical text slot changes cannot pass merely because folded text/count match', () => {
  const a = projectPreparedTree(commands(['a', 'bc'])).nodes
  const b = projectPreparedTree(commands(['ab', 'c'])).nodes
  assert.equal(projectVisualTree(a)[1].text, projectVisualTree(b)[1].text)
  assert.throws(() => matchPreparedTree(commands(['ab', 'c']), a), /logical tree differs/)
})

test('text slots carry exact ECMAScript display text without changing typed initial data', () => {
  const projected = projectPreparedTree(commands([3, 1e21, false, null]))
  assert.deepEqual(
    projected.nodes.slice(2).map((node) => node.props.value),
    ['3', '1e+21', 'false', ''],
  )
  const value = fixture([3])
  assert.equal(validateArtifact(value).seed.count, 1234.5)
  value.nodes[2].props.value = 3
  assert.throws(() => validateArtifact(value), /canonical text/)
})

test('rejects unsupported hosts, unresolved ownership, cycles and initial mutations', () => {
  const cases = [
    [{ op: 'create', id: 0, type: 'webview', props: {} }],
    [...commands(), { op: 'create', id: 999, type: 'label', props: {} }],
    [...commands(), { op: 'insert', id: 101, parent: 100, before: null }],
    [...commands(), { op: 'update', id: 101, props: {} }],
    [...commands(), { op: 'event', id: 102, name: 'tap' }],
    [
      { op: 'create', id: 0, type: 'masonview', props: {} },
      { op: 'insert', id: 0, parent: 0, before: null },
    ],
  ]
  for (const value of cases) {assert.throws(() => projectPreparedTree(value))}
})

test('validates tree order, labels, host props and style ownership', () => {
  for (const mutate of [
    (x) => {
      x.nodes[1].parent = 1
    },
    (x) => {
      x.nodes[1].path = '0/3'
    },
    (x) => {
      x.nodes[1].props.text = 'ambiguous'
    },
    (x) => {
      x.nodes[0].props.plugin = 'unsupported'
    },
    (x) => {
      x.variants.light[1].node = 2
    },
    (x) => {
      x.variants.light[0].style.position = 'absolute'
    },
    (x) => {
      x.variants.light[0].cssKeys = ['color', 'color']
    },
    (x) => {
      x.variants.light[0].inheritedKeys = ['paddingLeft']
    },
    (x) => {
      x.features = ['unknown-required-feature']
    },
  ]) {
    const value = fixture()
    mutate(value)
    assert.throws(() => validateArtifact(value))
  }
  const value = fixture()
  value.nodes[1].kind = 'masonview'
  assert.throws(() => validateArtifact(value), /child kind/)
})

test('accessors/native objects/non-finite values never execute or cross the boundary', () => {
  let calls = 0
  const value = fixture()
  Object.defineProperty(value.seed, 'secret', {
    enumerable: true,
    get() {
      calls++
      return 'bad'
    },
  })
  assert.throws(() => validateArtifact(value), /accessor/)
  assert.equal(calls, 0)
  for (const item of [NaN, Infinity, new Date(), () => {}, Symbol('native')]) {
    const value = fixture()
    value.seed.value = item
    assert.throws(() => validateArtifact(value))
  }
  const sparse = fixture()
  sparse.seed.value = Array(2)
  assert.throws(() => validateArtifact(sparse), /sparse/)
})

test('seed dictionaries cannot poison object prototypes and inputs are detached', () => {
  const value = fixture()
  value.seed = JSON.parse('{"__proto__":{"polluted":true},"title":"a"}')
  const result = decodeStartupArtifact(encodeStartupArtifact(value), expected)
  assert.equal(Object.getPrototypeOf(result.seed), null)
  assert.equal(result.seed.__proto__.polluted, true)
  assert.equal({}.polluted, undefined)
  value.seed.title = 'changed'
  assert.equal(result.seed.title, 'a')
})

test('hidden accessors and symbol/array properties are rejected without evaluation', () => {
  let called = false
  const value = fixture()
  Object.defineProperty(value.seed, 'hidden', {
    get() {
      called = true
      return 1
    },
  })
  assert.throws(() => validateArtifact(value), /hidden|accessor/)
  assert.equal(called, false)
  const symbolic = fixture()
  symbolic.seed[Symbol('extra')] = 1
  assert.throws(() => validateArtifact(symbolic), /symbol key/)
  const array = fixture()
  array.seed.data.extra = 'unserialized'
  assert.throws(() => validateArtifact(array), /extra properties/)
})

test('pretty JSON has its own bounded overhead and can round-trip a compact binary tree', () => {
  const value = fixture()
  let nested = Array.from({ length: 1024 }, () => Array(32).fill(false))
  for (let i = 0; i < 17; i++) {nested = { next: nested }}
  value.seed.large = nested
  const binary = encodeStartupArtifact(value)
  const json = writeStartupJson(value)
  assert.ok(binary.length < 1048576)
  assert.ok(Buffer.byteLength(json) > 1048576)
  assert.deepEqual(readStartupJson(json, expected), decodeStartupArtifact(binary, expected))
})

test('bounded native launch checks accept interval edges and reject unsupported inputs', () => {
  const artifact = validateArtifact(fixture())
  const env = { platform: 'android', fontScale: 1, width: 320, height: 800, reducedMotion: false }
  assert.deepEqual(checkLaunchEnvironment(artifact, env), { supported: true })
  assert.deepEqual(checkLaunchEnvironment(artifact, { ...env, width: 800 }), { supported: true })
  for (const [key, value] of [
    ['width', 801],
    ['fontScale', 1.3],
    ['platform', 'ios'],
  ])
    {assert.deepEqual(checkLaunchEnvironment(artifact, { ...env, [key]: value }), {
      supported: false,
      input: key,
    })}
  assert.throws(
    () => checkLaunchEnvironment(artifact, { ...env, width: NaN }),
    /environment|dimension/,
  )
  const bad = fixture()
  bad.constraints = []
  assert.throws(() => validateArtifact(bad), /font scale preflight/)

  const insetArtifact = validateArtifact({
    ...fixture(),
    constraints: [
      ...fixture().constraints,
      { input: 'safeAreaTop', equals: 24 },
      { input: 'safeAreaBottom', equals: 16 },
    ],
  })
  const insets = { top: 24, right: 0, bottom: 16, left: 0 }
  assert.deepEqual(checkLaunchEnvironment(insetArtifact, { ...env, safeAreaInsets: insets }), {
    supported: true,
  })
  assert.deepEqual(
    checkLaunchEnvironment(insetArtifact, {
      ...env,
      safeAreaInsets: { ...insets, top: 32 },
    }),
    { supported: false, input: 'safeAreaTop' },
  )
  assert.deepEqual(checkLaunchEnvironment(insetArtifact, env), {
    supported: false,
    input: 'safeAreaTop',
  })
})

test('rejects truncation, corruption, unknown features, trailing bytes and mismatched apps', () => {
  const encoded = Buffer.from(encodeStartupArtifact(fixture()))
  for (const length of [0, 1, 79, 80, encoded.length - 1])
    {assert.throws(() => decodeStartupArtifact(encoded.subarray(0, length), expected))}
  for (const offset of [0, 4, 6, 8, 12, 16, 48, encoded.length - 1]) {
    const bad = Buffer.from(encoded)
    bad[offset] ^= 1
    assert.throws(() => decodeStartupArtifact(bad, expected))
  }
  const highBit = Buffer.from(encoded)
  highBit[0] ^= 128
  assert.throws(() => decodeStartupArtifact(highBit, expected), /version|flags/)
  assert.throws(() => decodeStartupArtifact(encoded, { ...expected, platform: 'ios' }), /identity/)
  assert.throws(
    () => decodeStartupArtifact(encoded, { ...expected, build: 'cd'.repeat(32) }),
    /identity/,
  )
  assert.throws(
    () => readStartupJson(writeStartupJson(fixture()), { ...expected, platform: 'ios' }),
    /identity/,
  )
  assert.throws(
    () => decodeStartupArtifact(resign(Buffer.concat([encoded, Buffer.from([0])])), expected),
    /trailing/,
  )
})

test('decoder rejects malicious binary lengths, tags, UTF-8 and numeric payloads after checksum validation', () => {
  const encoded = Buffer.from(encodeStartupArtifact(fixture()))
  const count = Buffer.from(encoded)
  count.writeUInt32LE(0xffffffff, 81)
  assert.throws(() => decodeStartupArtifact(resign(count), expected), /collection size/)
  const tag = Buffer.from(encoded)
  tag[80] = 255
  assert.throws(() => decodeStartupArtifact(resign(tag), expected), /tag/)
  const text = Buffer.from(encoded)
  const position = text.indexOf(Buffer.from('Hello, 世界'))
  assert.ok(position >= 80)
  text[position] = 255
  assert.throws(() => decodeStartupArtifact(resign(text), expected))
  const number = Buffer.alloc(8)
  number.writeDoubleLE(1234.5)
  const numeric = Buffer.from(encoded),
    index = numeric.indexOf(number)
  assert.ok(index >= 80)
  numeric.writeDoubleLE(Infinity, index)
  assert.throws(() => decodeStartupArtifact(resign(numeric), expected), /non-finite/)
})

test('top-level className joins like the live driver before validation', () => {
  const cases = [
    [['vx-view', ['extra', null, 'more'], false, 0], 'vx-view extra more'],
    [{ a: true, b: false, c: 1 }, 'a c'],
    [4, '4'],
    ['kept', 'kept'],
  ]
  for (const [input, joined] of cases) {
    const batch = [
      { op: 'create', id: 100, type: 'masonview', props: { className: input } },
      { op: 'insert', id: 100, parent: null, before: null },
    ]
    const projection = projectPreparedTree(batch)
    assert.equal(projection.nodes[0].props.className, joined)
    assert.deepEqual([...matchPreparedTree(batch, projection.nodes).visualByCommandId], [[100, 0]])
  }
})

test('disabled controls: string accessibility state/value and bounded opacity', () => {
  const value = fixture()
  Object.assign(value.nodes[0].props, { accessibilityState: 'disabled', accessibilityValue: 'Loading' })
  value.variants.light[0].style.opacity = 0.5
  value.variants.light[0].cssKeys = ['fontSize', 'opacity']
  const canonical = validateArtifact(value)
  assert.equal(canonical.nodes[0].props.accessibilityState, 'disabled')
  assert.deepEqual(decodeStartupArtifact(encodeStartupArtifact(value), expected), canonical)
  for (const opacity of [-0.1, 1.5, '0.5']) {
    const invalid = fixture()
    invalid.variants.light[0].style.opacity = opacity
    invalid.variants.light[0].cssKeys = ['fontSize', 'opacity']
    assert.throws(() => validateArtifact(invalid), /style value/)
  }
  const object = fixture()
  object.nodes[0].props.accessibilityState = { disabled: true }
  assert.throws(() => validateArtifact(object), /accessibilityState/)
})

test('scrollview is a Mason container with a bounded orientation and scroll styles', () => {
  const batch = [
    { op: 'create', id: 1, type: 'scrollview', props: { orientation: 'vertical' } },
    { op: 'create', id: 2, type: 'masonview', props: {} },
    { op: 'insert', id: 2, parent: 1, before: null },
    { op: 'insert', id: 1, parent: null, before: null },
  ]
  const { nodes } = projectPreparedTree(batch)
  assert.deepEqual(
    projectVisualTree(nodes).map((node) => node.kind),
    ['scrollview', 'masonview'],
  )
  const value = fixture()
  value.nodes = nodes
  const style = { overflowX: 'hidden', overflowY: 'scroll', maxHeight: '100%' }
  value.variants = Object.fromEntries(
    ['light', 'dark'].map((theme) => [
      theme,
      nodes.map((node) => ({ node: node.index, style, cssKeys: ['maxHeight'], inheritedKeys: [] })),
    ]),
  )
  const canonical = validateArtifact(value)
  assert.deepEqual(decodeStartupArtifact(encodeStartupArtifact(value), expected), canonical)
  for (const [index, orientation] of [
    [0, 'diagonal'],
    [1, 'vertical'],
  ]) {
    const invalid = structuredClone(value)
    invalid.nodes[index].props.orientation = orientation
    assert.throws(() => validateArtifact(invalid), /scroll orientation/)
  }
  const text = structuredClone(value)
  text.nodes.push({ index: 2, path: '0/1', parent: 0, kind: '#text', props: { value: 'x' } })
  assert.throws(() => validateArtifact(text), /child kind/)
})
