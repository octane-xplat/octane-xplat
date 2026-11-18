import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import { projectVisualTree } from '@octane-xplat/native-prerender'
import { encodeStartupArtifact } from '@octane-xplat/native-prerender/codec'

const binary = process.env.XPLAT_HOME_CODEC_NATIVE
const work = process.env.XPLAT_HOME_CODEC_WORK
assert.ok(binary && work, 'Run the platform backend Turbo task under a native build reservation')
const build = 'ab'.repeat(32)
const platform = process.env.XPLAT_HOME_CODEC_PLATFORM
assert.ok(['ios', 'android'].includes(platform), 'Expected an explicit backend platform')
function fixture() {
  return {
    version: 1,
    platform,
    hostContract: 'mason-label-v1',
    build,
    seed: { title: 'Hello, 世界', count: 3, '\u00e9': 'composed', 'e\u0301': 'decomposed' },
    constraints: [{ input: 'fontScale', equals: 1 }],
    nodes: [
      {
        index: 0,
        parent: null,
        path: '0',
        kind: 'masonview',
        props: { accessibilityState: 'disabled', accessibilityValue: 'Loading' },
      },
      { index: 1, parent: 0, path: '0/0', kind: 'label', props: {} },
      { index: 2, parent: 1, path: '0/0/0', kind: '#text', props: { value: 'Hello, ' } },
      { index: 3, parent: 1, path: '0/0/1', kind: '#text', props: { value: '世界' } },
    ],
    variants: Object.fromEntries(
      ['light', 'dark'].map((theme) => [
        theme,
        [
          { node: 0, style: { display: 'flex' }, cssKeys: ['display'], inheritedKeys: [] },
          {
            node: 1,
            style: { fontSize: 15, color: '#172033', opacity: 0.5 },
            cssKeys: ['fontSize', 'opacity'],
            inheritedKeys: ['color'],
          },
        ],
      ]),
    ),
  }
}
let sequence = 0
function native(artifact) {
  return nativeBytes(encodeStartupArtifact(artifact))
}
function nativeBytes(bytes) {
  const path = join(work, 'backend-' + sequence++ + '.bin')
  writeFileSync(path, bytes)
  return spawnSync(binary, [path, build], { encoding: 'utf8', timeout: 15000 })
}
/** The schema gates bounded style values at encode, so an out-of-contract
 *  value only reaches the native validators through a forged artifact: swap
 *  the string literal under `key` and refresh the length fields and payload
 *  checksum so the binary stays well-formed. */
function forged(artifact, key, from, to) {
  const original = Buffer.from(encodeStartupArtifact(artifact))
  const name = Buffer.from(key, 'utf8')
  let cursor = 0
  for (;;) {
    const at = original.indexOf(name, cursor)
    assert.ok(at >= 0, 'missing style key ' + key)
    cursor = at + name.length
    if (original[cursor] !== 4) {continue}
    const length = original.readUInt32LE(cursor + 1)
    const start = cursor + 5
    if (!original.subarray(start, start + length).equals(Buffer.from(from, 'utf8'))) {continue}
    const value = Buffer.from(to, 'utf8')
    const bytes = Buffer.concat([
      original.subarray(0, start),
      value,
      original.subarray(start + length),
    ])
    bytes.writeUInt32LE(value.length, cursor + 1)
    bytes.writeUInt32LE(bytes.length, 8)
    createHash('sha256').update(bytes.subarray(80)).digest().copy(bytes, 48)
    return bytes
  }
}
const GRID_STYLE = {
  display: 'grid',
  gridTemplateRows: '1fr',
  gridTemplateColumns: '1fr',
  gridRow: '1',
  gridColumn: '1',
  justifySelf: 'stretch',
  alignSelf: 'center',
}
test(`${platform} backend lowers the complete logical artifact to its expected visual records`, () => {
  const artifact = fixture(),
    result = native(artifact)
  assert.equal(result.status, 0, result.stderr)
  const projection = JSON.parse(result.stdout)
  assert.deepEqual(projection.seed, artifact.seed)
  assert.deepEqual(
    projection.nodes,
    JSON.parse(
      JSON.stringify(projectVisualTree(artifact.nodes).map(({ logicalNode, ...node }) => node)),
    ),
  )
  for (const theme of ['light', 'dark'])
    assert.deepEqual(
      projection.variants[theme],
      artifact.variants[theme].map(({ node, ...record }, index) => ({ index, ...record })),
    )
})
test(`${platform} backend accepts each placeholder leaf and numeric authored width`, () => {
  for (const [kind, props, size] of [
    ['activityindicator', { id: 'spin', busy: true }, { width: 16, height: 16 }],
    [
      'svgview',
      {
        id: 'icon',
        src: '<svg xmlns="http://www.w3.org/2000/svg"/>',
        stretch: 'aspectFit',
        accessible: false,
        accessibilityLabel: 'Done',
      },
      { width: 24, height: 24 },
    ],
  ]) {
    const artifact = fixture()
    artifact.nodes = [
      { index: 0, parent: null, path: '0', kind: 'masonview', props: {} },
      { index: 1, parent: 0, path: '0/0', kind, props: { ...props, style: size } },
      { index: 2, parent: 0, path: '0/1', kind: 'label', props: { text: 'Title' } },
    ]
    artifact.variants = Object.fromEntries(
      ['light', 'dark'].map((theme) => [
        theme,
        [
          { node: 0, style: { display: 'flex' }, cssKeys: ['display'], inheritedKeys: [] },
          { node: 1, style: size, cssKeys: [], inheritedKeys: [] },
          { node: 2, style: {}, cssKeys: [], inheritedKeys: [] },
        ],
      ]),
    )
    const result = native(artifact)
    assert.equal(result.status, 0, `${kind}: ${result.stderr}`)
    const projection = JSON.parse(result.stdout)
    assert.equal(projection.nodes[1].kind, 'placeholder')
    assert.equal(projection.nodes[1].hostKind, kind)
    assert.deepEqual(
      projection.nodes,
      JSON.parse(
        JSON.stringify(projectVisualTree(artifact.nodes).map(({ logicalNode, ...node }) => node)),
      ),
    )
  }
})
test(`${platform} backend rejects unsupported placeholder style values`, () => {
  for (const [kind, extra] of [
    ['activityindicator', { busy: true }],
    ['svgview', { src: '<svg/>' }],
  ])
    for (const width of ['50%', -1, '16px']) {
      const artifact = fixture()
      artifact.nodes = [
        { index: 0, parent: null, path: '0', kind: 'masonview', props: {} },
        {
          index: 1,
          parent: 0,
          path: '0/0',
          kind,
          props: { ...extra, style: { width: 16, height: 16 } },
        },
      ]
      artifact.variants = Object.fromEntries(
        ['light', 'dark'].map((theme) => [
          theme,
          [
            { node: 0, style: { display: 'flex' }, cssKeys: ['display'], inheritedKeys: [] },
            { node: 1, style: { width, height: 16 }, cssKeys: [], inheritedKeys: [] },
          ],
        ]),
      )
      const result = native(artifact)
      assert.equal(result.status, 1, `${kind} width=${width}: ${result.stderr}`)
      assert.match(result.stderr, /Home IR rejected/)
    }
})
test(`${platform} backend schema rejects a placeholder with children and unknown props on either host kind`, () => {
  // The XPI1 encoder validates before the native binary can run, so these
  // structural rejections gate at encode. The native validators mirror them
  // for artifacts produced without this schema.
  const cases = [
    {
      pattern: /child kind/,
      nodes: [
        { index: 0, parent: null, path: '0', kind: 'masonview', props: {} },
        {
          index: 1,
          parent: 0,
          path: '0/0',
          kind: 'activityindicator',
          props: { style: { width: 16, height: 16 }, busy: true },
        },
        { index: 2, parent: 1, path: '0/0/0', kind: 'label', props: {} },
      ],
      variants: [
        { node: 0, style: { display: 'flex' }, cssKeys: ['display'], inheritedKeys: [] },
        { node: 1, style: { width: 16, height: 16 }, cssKeys: [], inheritedKeys: [] },
        { node: 2, style: {}, cssKeys: [], inheritedKeys: [] },
      ],
    },
    {
      pattern: /child kind/,
      nodes: [
        { index: 0, parent: null, path: '0', kind: 'masonview', props: {} },
        {
          index: 1,
          parent: 0,
          path: '0/0',
          kind: 'svgview',
          props: { style: { width: 24, height: 24 }, src: '<svg/>' },
        },
        { index: 2, parent: 1, path: '0/0/0', kind: 'label', props: {} },
      ],
      variants: [
        { node: 0, style: { display: 'flex' }, cssKeys: ['display'], inheritedKeys: [] },
        { node: 1, style: { width: 24, height: 24 }, cssKeys: [], inheritedKeys: [] },
        { node: 2, style: {}, cssKeys: [], inheritedKeys: [] },
      ],
    },
    {
      pattern: /unsupported host prop busy/,
      nodes: [
        { index: 0, parent: null, path: '0', kind: 'masonview', props: { busy: true } },
        { index: 1, parent: 0, path: '0/0', kind: 'label', props: {} },
      ],
      variants: [
        { node: 0, style: { display: 'flex' }, cssKeys: ['display'], inheritedKeys: [] },
        { node: 1, style: {}, cssKeys: [], inheritedKeys: [] },
      ],
    },
    {
      // busy is only valid on the activityindicator placeholder.
      pattern: /unsupported host prop busy/,
      nodes: [
        { index: 0, parent: null, path: '0', kind: 'masonview', props: {} },
        {
          index: 1,
          parent: 0,
          path: '0/0',
          kind: 'svgview',
          props: { busy: true },
        },
      ],
      variants: [
        { node: 0, style: { display: 'flex' }, cssKeys: ['display'], inheritedKeys: [] },
        { node: 1, style: {}, cssKeys: [], inheritedKeys: [] },
      ],
    },
  ]
  for (const { pattern, nodes, variants } of cases) {
    const artifact = fixture()
    artifact.nodes = nodes
    artifact.variants = Object.fromEntries(
      ['light', 'dark'].map((theme) => [theme, variants]),
    )
    assert.throws(() => encodeStartupArtifact(artifact), pattern)
  }
})
test(`${platform} backend rejects structurally valid unsupported native setter values in either theme`, () => {
  for (const theme of ['light', 'dark'])
    for (const [key, value] of [
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
      ['color', 'rgba(1d, 2, 3, 1)'],
      ['color', 'rgba(0x1p0, 2, 3, 1)'],
      ['backgroundColor', 123],
    ]) {
      const artifact = fixture()
      artifact.variants[theme][1].style[key] = value
      const result = native(artifact)
      assert.equal(result.status, 1, `${theme} ${key}=${value}: ${result.stderr}`)
      assert.match(result.stderr, /Home IR rejected/)
    }
})
test(`${platform} backend lowers a scrollview container and rejects unsupported scroll values`, () => {
  const scrolling = () => {
    const artifact = fixture()
    artifact.nodes[0].kind = 'scrollview'
    artifact.nodes[0].props = { orientation: 'vertical' }
    for (const theme of ['light', 'dark'])
      Object.assign(artifact.variants[theme][0].style, {
        overflowX: 'hidden',
        overflowY: 'scroll',
        maxHeight: '100%',
      })
    return artifact
  }
  const accepted = native(scrolling())
  assert.equal(accepted.status, 0, accepted.stderr)
  assert.equal(JSON.parse(accepted.stdout).nodes[0].kind, 'scrollview')
  for (const [key, value] of [
    ['overflowY', 'auto'],
    ['overflowX', 'visible'],
    ['maxHeight', '50%'],
  ]) {
    const artifact = scrolling()
    artifact.variants.dark[0].style[key] = value
    const result = native(artifact)
    assert.equal(result.status, 1, `${key}=${value}: ${result.stderr}`)
    assert.match(result.stderr, /Home IR rejected/)
  }
})
test(`${platform} backend accepts Screen shell styles and rejects other values`, () => {
  const shell = () => {
    const artifact = fixture()
    artifact.nodes[0].props = { iosIgnoreSafeArea: true }
    for (const theme of ['light', 'dark'])
      Object.assign(artifact.variants[theme][0].style, {
        alignSelf: 'stretch',
        width: '100%',
        height: '100%',
      })
    return artifact
  }
  const accepted = native(shell())
  assert.equal(accepted.status, 0, accepted.stderr)
  for (const [key, value] of [
    ['width', '50%'],
    ['height', '50%'],
  ]) {
    const artifact = shell()
    artifact.variants.light[0].style[key] = value
    const result = native(artifact)
    assert.equal(result.status, 1, `${key}=${value}: ${result.stderr}`)
    assert.match(result.stderr, /Home IR rejected/)
  }
})
test(`${platform} backend accepts the loading Button grid subset and rejects other values`, () => {
  const accepted = fixture()
  for (const theme of ['light', 'dark'])
    Object.assign(accepted.variants[theme][0].style, GRID_STYLE)
  const result = native(accepted)
  assert.equal(result.status, 0, result.stderr)
  // Bounded values gate at the schema during encode; forge checksum-valid
  // binaries so the native validators see each out-of-contract value anyway.
  for (const theme of ['light', 'dark'])
    for (const [key, from, to] of [
      ['display', 'grid', 'contents'],
      ['gridRow', '1', '2'],
      ['gridColumn', '1', '2'],
      ['gridTemplateRows', '1fr', 'auto'],
      ['gridTemplateColumns', '1fr', 'auto'],
      ['justifySelf', 'stretch', 'end'],
      ['alignSelf', 'center', 'end'],
    ]) {
      const artifact = fixture()
      Object.assign(artifact.variants[theme][0].style, GRID_STYLE)
      const rejected = nativeBytes(forged(artifact, key, from, to))
      assert.equal(rejected.status, 1, `${theme} ${key}=${to}: ${rejected.stderr}`)
      assert.match(rejected.stderr, /Home IR rejected/)
    }
})
