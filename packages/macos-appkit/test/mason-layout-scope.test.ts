import assert from 'node:assert/strict'
import { test } from 'node:test'
import { masonLayoutRoot } from '../src/mason-layout-scope.ts'

interface Node {
  type: string
  parent?: Node | null
  layoutParent?: Node | null
}

test('nested auto-sized Mason containers reconcile with the containing tree', () => {
  const root: Node = { type: 'masonview' }
  const nested: Node = { type: 'masonview', parent: root }
  const changed: Node = { type: 'masonview', parent: nested }

  assert.equal(masonLayoutRoot(changed), root)
})

test('projection layout ownership takes precedence over the declaring parent', () => {
  const declaring: Node = { type: 'masonview' }
  const projected: Node = { type: 'masonview' }
  const changed: Node = { type: 'masonview', parent: declaring, layoutParent: projected }

  assert.equal(masonLayoutRoot(changed), projected)
})

test('transparent proxies preserve the containing Mason tree', () => {
  const root: Node = { type: 'masonview' }
  const proxy: Node = { type: 'proxyviewcontainer', parent: root }

  assert.equal(masonLayoutRoot<Node>({ type: 'masonview', parent: proxy }), root)
})

test('foreign hosts stop propagation even when another Mason tree owns them', () => {
  const outer: Node = { type: 'masonview' }
  const foreign: Node = { type: 'contentview', parent: outer }
  const inner: Node = { type: 'masonview', parent: foreign }

  assert.equal(masonLayoutRoot(inner), inner)
  assert.equal(masonLayoutRoot(foreign), foreign)
})

test('glass participates in the scroll document, which retains its own compute', () => {
  const root: Node = { type: 'masonview' }
  const scroll: Node = { type: 'scrollview', parent: root }
  const glass: Node = { type: 'liquidglass', parent: scroll }

  assert.equal(masonLayoutRoot(glass), scroll)
  assert.equal(masonLayoutRoot(scroll), scroll)
})
