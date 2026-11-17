import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
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
  const path = join(work, 'backend-' + sequence++ + '.bin')
  writeFileSync(path, encodeStartupArtifact(artifact))
  return spawnSync(binary, [path, build], { encoding: 'utf8', timeout: 15000 })
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
test(`${platform} backend rejects structurally valid unsupported native setter values in either theme`, () => {
  for (const theme of ['light', 'dark'])
    for (const [key, value] of [
      ['display', 'grid'],
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
