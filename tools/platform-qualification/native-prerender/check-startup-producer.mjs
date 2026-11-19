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
const previous = json('resolved.json')
const canonical = (records) =>
  records.map((record) => ({
    ...plain(record),
    cssKeys: [...record.cssKeys].sort(),
    inheritedKeys: [...record.inheritedKeys].sort(),
  }))
// Flat artifacts have one implicit tree; layered artifacts check every
// scheme-bound tree's prepared render and resolved cascade independently.
// Points emit bind-major (bind then light/dark), so a declared tree's render
// pair is index >> 1.
const trees = artifact.trees ?? [{ bind: null, nodes: artifact.nodes, variants: artifact.variants }]
const resolvedTrees = previous.trees ?? [previous]
assert.equal(trees.length, resolvedTrees.length)
const declared = Boolean(artifact.launchInputs?.length)
let logicalTotal = 0
let visualTotal = 0
for (const [index, tree] of trees.entries()) {
  logicalTotal += tree.nodes.length
  if (artifact.trees) {
    const scheme = tree.bind.systemAppearance
    assert.deepEqual(
      plain(tree.nodes),
      json(declared ? 'tree-' + (index >> 1) + '-' + scheme + '.json' : scheme + '-tree.json')
        .logicalNodes,
    )
    assert.deepEqual(plain(tree.bind), resolvedTrees[index].bind)
  } else {
    assert.deepEqual(plain(tree.nodes), json('light-tree.json').logicalNodes)
    assert.deepEqual(json('light-tree.json').logicalNodes, json('dark-tree.json').logicalNodes)
  }
  const visual = projectVisualTree(tree.nodes)
  visualTotal += visual.length
  assert.deepEqual(
    plain(visual.map(({ logicalNode, ...node }) => node)),
    resolvedTrees[index].nodes,
  )
  // Layered trees carry one variant keyed by bind.systemAppearance; flat
  // trees carry both schemes.
  const variants = artifact.trees
    ? [[tree.bind.systemAppearance, tree.variant]]
    : Object.entries(tree.variants)
  for (const [theme, records] of variants) {
    assert.deepEqual(
      canonical(
        records.map(({ node, ...record }, row) => {
          assert.equal(node, visual[row].logicalNode)
          return { index: row, ...record }
        }),
      ),
      canonical(
        artifact.trees ? resolvedTrees[index].variant : resolvedTrees[index].variants[theme],
      ),
    )
  }
}
assert.equal(logicalTotal, manifest.logicalNodeCount)
console.log(
  JSON.stringify(
    {
      passed: true,
      platform: artifact.platform,
      trees: trees.length,
      binds: trees.map((tree) => tree.bind),
      logicalNodes: logicalTotal,
      visualNodes: visualTotal,
      bytes: bytes.length,
      build: artifact.build,
      scope:
        'Real JSX producer, host binary/JSON and complete visual/style agreement; no native XPI1 claim',
    },
    null,
    2,
  ),
)
