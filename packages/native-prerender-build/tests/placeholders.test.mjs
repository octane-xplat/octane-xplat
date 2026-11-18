import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { projectPreparedTree, projectVisualTree } from '@octane-xplat/native-prerender'

const resolve = fileURLToPath(new URL('../src/resolve.mjs', import.meta.url))

const PLACEHOLDER_PROPS = {
  activityindicator: { id: 'spin', busy: true },
  svgview: { id: 'icon', src: '<svg xmlns="http://www.w3.org/2000/svg"/>', stretch: 'aspectFit' },
  image: { id: 'img', stretch: 'aspectFill', loadMode: 'async' },
}

function nodes(style, className = 'spin', kind = 'activityindicator') {
  const commands = [
    { op: 'create', id: 0, type: 'masonview', props: { className: 'screen' } },
    {
      op: 'create',
      id: 1,
      type: kind,
      props: { ...PLACEHOLDER_PROPS[kind], className, style },
    },
    { op: 'create', id: 2, type: 'label', props: { text: 'Title' } },
    { op: 'insert', id: 1, parent: 0, before: null },
    { op: 'insert', id: 2, parent: 0, before: null },
    { op: 'insert', id: 0, parent: null, before: null },
  ]
  return projectVisualTree(projectPreparedTree(commands).nodes).map(
    ({ logicalNode: _logicalNode, ...node }) => node,
  )
}

function run(t, visualNodes, css) {
  const work = mkdtempSync(join(tmpdir(), 'native-startup-resolve-'))
  t.after(() => rmSync(work, { recursive: true, force: true }))
  const tree = join(work, 'tree.json')
  const output = join(work, 'resolved.json')
  writeFileSync(tree, JSON.stringify({ nodes: visualNodes }))
  const input = join(work, 'input.json')
  writeFileSync(
    input,
    JSON.stringify({
      tree,
      seed: {},
      sheets: [{ id: 'test.css', css }],
      environment: { width: 320, height: 640 },
      output,
    }),
  )
  const result = spawnSync(process.execPath, [resolve, input], { encoding: 'utf8' })
  return { result, output }
}

test('a placeholder without numeric authored size rejects with an explicit reason', (t) => {
  for (const kind of ['activityindicator', 'svgview', 'image']) {
    const { result } = run(t, nodes({}, 'spin', kind), '.screen { display: flex; }')
    assert.equal(result.status, 1)
    assert.match(result.stderr, new RegExp('placeholder size not authored for ' + kind))
  }
})

test('a sized placeholder keeps box geometry and reports dropped styles', (t) => {
  const { result, output } = run(
    t,
    nodes({ width: 16, height: 16 }),
    '.spin { background-color: #112233; border-radius: 4px; }',
  )
  assert.equal(result.status, 0, result.stderr)
  const resolved = JSON.parse(readFileSync(output, 'utf8'))
  for (const theme of ['light', 'dark']) {
    assert.deepEqual(resolved.variants[theme][1].style, { width: 16, height: 16 })
    assert.deepEqual(resolved.variants[theme][1].cssKeys, [])
    assert.deepEqual(resolved.variants[theme][1].inheritedKeys, [])
  }
  assert.deepEqual(resolved.placeholders, [
    {
      path: '0/0',
      hostKind: 'activityindicator',
      droppedStyles: ['backgroundColor', 'borderRadius'],
    },
  ])
})

test('a sized svgview placeholder keeps box geometry and reports dropped styles', (t) => {
  const { result, output } = run(
    t,
    nodes({ width: 24, height: 24 }, 'icon', 'svgview'),
    '.icon { opacity: 0.5; }',
  )
  assert.equal(result.status, 0, result.stderr)
  const resolved = JSON.parse(readFileSync(output, 'utf8'))
  for (const theme of ['light', 'dark']) {
    assert.deepEqual(resolved.variants[theme][1].style, { width: 24, height: 24 })
    assert.deepEqual(resolved.variants[theme][1].cssKeys, [])
    assert.deepEqual(resolved.variants[theme][1].inheritedKeys, [])
  }
  assert.deepEqual(resolved.placeholders, [
    {
      path: '0/0',
      hostKind: 'svgview',
      droppedStyles: ['opacity'],
    },
  ])
})

test('a sized image placeholder keeps box geometry and reports dropped styles', (t) => {
  const { result, output } = run(
    t,
    nodes({ width: 40, height: 40 }, 'img', 'image'),
    '.img { background-color: #112233; }',
  )
  assert.equal(result.status, 0, result.stderr)
  const resolved = JSON.parse(readFileSync(output, 'utf8'))
  for (const theme of ['light', 'dark']) {
    assert.deepEqual(resolved.variants[theme][1].style, { width: 40, height: 40 })
    assert.deepEqual(resolved.variants[theme][1].cssKeys, [])
    assert.deepEqual(resolved.variants[theme][1].inheritedKeys, [])
  }
  assert.deepEqual(resolved.placeholders, [
    {
      path: '0/0',
      hostKind: 'image',
      droppedStyles: ['backgroundColor'],
    },
  ])
})
