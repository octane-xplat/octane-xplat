import assert from 'node:assert/strict'
import { test } from 'node:test'
import { rendererSource } from './renderer-source.ts'
import { runSlice } from './mock-globals.ts'

const source = rendererSource()
const scheduling = source.slice(
  source.indexOf('function queueLayoutReconcile('),
  source.indexOf('function reconcileLayoutParent('),
)

interface Node {
  type: string
  parent: Node | null
  children: Node[]
  projectedChildren?: Node[]
}

function fixture(batched = true) {
  const root: Node = { type: 'masonview', parent: null, children: [] }
  const content: Node = { type: 'masonview', parent: root, children: [] }
  root.children.push(content)
  const container = { children: [root], layoutDirty: batched ? new Set<Node>() : null }
  const events: { phase: string; node: Node }[] = []
  const api = runSlice(scheduling + '\n({ queueLayoutReconcile, drainLayoutDirty })', {
    reconcileLayoutParent: (node: Node) => events.push({ phase: 'layout', node }),
    syncProxyProjection: (node: Node) => events.push({ phase: 'projection', node }),
  })
  return { root, content, container, events, api }
}

test('routine geometry stays local instead of disturbing the containing viewport', () => {
  const { content, root, container, events, api } = fixture()
  api.queueLayoutReconcile(container, content)
  assert.equal(container.layoutDirty!.size, 1)
  assert.equal(container.layoutDirty!.has(root), false)
  api.drainLayoutDirty(container.layoutDirty)
  assert.deepEqual(events, [{ phase: 'layout', node: content }])
})

test('content changes synchronize local projection, size ancestors, and retain local work', () => {
  const { content, root, container, events, api } = fixture()
  content.projectedChildren = []
  api.queueLayoutReconcile(container, content, 'subtree')
  api.queueLayoutReconcile(container, content, 'subtree')
  assert.equal(container.layoutDirty!.size, 2)
  api.drainLayoutDirty(container.layoutDirty)
  assert.deepEqual(events, [
    { phase: 'projection', node: content },
    { phase: 'layout', node: root },
    { phase: 'layout', node: content },
  ])
})

test('content changes outside a batch preserve ancestor then local reconciliation', () => {
  const { content, root, container, events, api } = fixture(false)
  api.queueLayoutReconcile(container, content, 'subtree')
  assert.deepEqual(events, [
    { phase: 'layout', node: root },
    { phase: 'layout', node: content },
  ])
})
