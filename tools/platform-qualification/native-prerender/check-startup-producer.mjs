import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { projectVisualTree } from '@octane-xplat/native-prerender'
import { decodeStartupArtifact, readStartupJson } from '@octane-xplat/native-prerender/codec'

const directory = process.env.XPLAT_HOME_CODEC_PRODUCER
assert.ok(directory, 'Set XPLAT_HOME_CODEC_PRODUCER to the producer output directory')
const root = resolve(directory)
const json = (file) => JSON.parse(readFileSync(join(root, file), 'utf8'))
const plain = (value) => JSON.parse(JSON.stringify(value))
const manifest = json('build.json')
const bytes = readFileSync(join(root, 'startup.bin'))
assert.equal(manifest.startupFormat, 'XPI1')
assert.equal(createHash('sha256').update(bytes).digest('hex'), manifest.startupArtifactHash)
const identity = { build: manifest.buildHash, platform: manifest.platform }
const artifact = decodeStartupArtifact(bytes, identity)
assert.deepEqual(
  artifact,
  readStartupJson(readFileSync(join(root, 'startup.json'), 'utf8'), identity),
)
assert.deepEqual(plain(artifact.nodes), json('light-tree.json').logicalNodes)
assert.deepEqual(json('light-tree.json').logicalNodes, json('dark-tree.json').logicalNodes)
assert.equal(artifact.nodes.length, manifest.logicalNodeCount)
const visual = projectVisualTree(artifact.nodes)
const previous = json('resolved.json')
assert.deepEqual(plain(visual.map(({ logicalNode, ...node }) => node)), previous.nodes)
for (const theme of ['light', 'dark']) {
  const canonical = (records) =>
    records.map((record) => ({
      ...plain(record),
      cssKeys: [...record.cssKeys].sort(),
      inheritedKeys: [...record.inheritedKeys].sort(),
    }))
  assert.deepEqual(
    canonical(
      artifact.variants[theme].map(({ node, ...record }, index) => {
        assert.equal(node, visual[index].logicalNode)
        return { index, ...record }
      }),
    ),
    canonical(previous.variants[theme]),
  )
}
console.log(
  JSON.stringify(
    {
      passed: true,
      platform: artifact.platform,
      logicalNodes: artifact.nodes.length,
      visualNodes: visual.length,
      bytes: bytes.length,
      build: artifact.build,
      scope:
        'Real JSX producer, host binary/JSON and complete visual/style agreement; no native XPI1 claim',
    },
    null,
    2,
  ),
)
