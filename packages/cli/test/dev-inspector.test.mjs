import assert from 'node:assert/strict'
import vm from 'node:vm'
import { test } from 'node:test'
import { installDevInspector } from '../dist/dev-inspector.web.js'

test('fixed app inspector validates requests, preserves document identity and never focuses', () => {
  const calls = []
  const scope = vm.createContext({ document: {}, crypto: { randomUUID: () => 'fixture' } })
  const install = () =>
    vm.runInContext(`(${installDevInspector.toString()})(globalThis.inspect)`, scope)
  scope.inspect = (args) => {
    calls.push(args)
    return { controls: [], total: 0, nextOffset: null }
  }
  install()
  const inspector = scope['octane-xplat.dev-inspector']
  assert.equal(inspector.documentId, 'doc_fixture')
  install()
  assert.equal(scope['octane-xplat.dev-inspector'], inspector)
  for (const args of [
    null,
    { focus: true },
    { expression: 'globalThis.privateValue' },
    { offset: -1 },
    { offset: 1.5 },
    { limit: 0 },
    { limit: 101 },
    { control: { kind: 'css', name: 'button' } },
    { control: { kind: 'id', name: '' } },
  ]) {
    assert.equal(inspector.inspect(args).error.code, 'invalid_selection')
  }
  assert.equal(calls.length, 0)

  const interaction = {
    documentId: 'doc_fixture',
    control: { kind: 'id', name: 'button' },
    mechanism: 'handler-dispatch',
    expiresAt: Date.now() + 3000,
  }
  for (const changed of [
    { mechanism: 'dom-event' },
    { mechanism: 'os-input' },
    { expression: 'run()' },
    { control: { kind: 'css', name: 'button' } },
  ]) {
    const result = inspector.interact({ ...interaction, ...changed })
    assert.equal(result.error.code, 'invalid_selection')
    assert.equal(result.outcome, 'not-run')
  }
  assert.equal(
    inspector.interact({ ...interaction, documentId: 'stale' }).error.code,
    'stale_identity',
  )
  assert.equal(inspector.interact({ ...interaction, expiresAt: 0 }).outcome, 'not-run')
  assert.equal(calls.length, 0, 'rejected mutation reached the DOM inspector')

  const page = inspector.inspect({
    control: { kind: 'testID', name: 'counter.value' },
    limit: 2,
    offset: 1,
  })
  assert.equal(page.documentId, 'doc_fixture')
  assert.equal(calls.length, 1)
  assert.equal(calls[0].focus, false)
  assert.equal(calls[0].limit, 2)
  assert.equal(calls[0].offset, 1)
  const server = vm.createContext({
    inspect: () => {
      throw new Error('SSR must not inspect')
    },
  })
  vm.runInContext(`(${installDevInspector.toString()})(globalThis.inspect)`, server)
  assert.equal(server['octane-xplat.dev-inspector'], undefined)
})
