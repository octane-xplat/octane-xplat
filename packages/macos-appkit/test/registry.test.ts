import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createRegistry } from '../src/registry.ts'

// The metadata foundation can validate builtin and plugin types before any
// node factories, native classes or runtime bridges have been constructed.
test('registry queries track plugin registrations independently of node construction', () => {
  const registry = createRegistry()
  assert.throws(() => registry.assertSupportedType('label'), /label/)
  registry.adapters.register('label', { container: false, hasView: true, create() {} })
  assert.doesNotThrow(() => registry.assertSupportedType('label'))
  assert.equal(registry.canContainView('label'), false)
  assert.equal(registry.canContainView('rootlayout'), true)
  assert.equal(registry.canContainView('portalroot'), true)
  assert.equal(registry.typeHasView('proxyviewcontainer'), false)
  assert.equal(registry.typeHasView('span'), false)
  assert.equal(registry.typeHasView('label'), true)

  assert.throws(() => registry.assertSupportedType('plugin-host'), /plugin-host/)
  registry.registerElementType('plugin-host', { container: true, layout() {} })
  assert.doesNotThrow(() => registry.assertSupportedType('plugin-host'))
  assert.equal(registry.canContainView('plugin-host'), true)
  assert.equal(registry.isManualLayoutParent('plugin-host'), true)

  // Replacing behavior must change subsequent queries, rather than preserving
  // capabilities captured when the registry was constructed.
  registry.registerElementType('plugin-host', {})
  assert.doesNotThrow(() => registry.assertSupportedType('plugin-host'))
  assert.equal(registry.canContainView('plugin-host'), false)
  assert.equal(registry.isManualLayoutParent('plugin-host'), false)
})

test('independent registries do not share plugin registrations', () => {
  const first = createRegistry(), second = createRegistry()
  first.registerElementType('plugin-host', { container: true })
  assert.throws(() => second.assertSupportedType('plugin-host'), /plugin-host/)
  assert.equal(second.canContainView('plugin-host'), false)
})
