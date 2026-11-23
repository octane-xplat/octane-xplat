import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript-classic'

const root = new URL('../src/', import.meta.url)

// Compile the leaf module and run it in a vm realm with the plugin and lib
// seams stubbed — no NativeScript runtime, SwiftUI, or Octane renderer.
const compiled = ts.transpile(await readFile(new URL('swiftui-hosts.ios.ts', root), 'utf8'), {
  module: ts.ModuleKind.CommonJS,
  target: ts.ScriptTarget.ES2022,
})

function load(overrides = {}) {
  const registered = []
  const events = []
  const managerCalls = []
  const lifecycle = { kind: 'shared-lifecycle' }

  const context = vm.createContext({
    NativeScriptViewFactory: {
      shared: { viewDestroyer: (id) => events.push(['destroy', id]) },
      initShared() {
        this.shared ??= { viewDestroyer: () => {} }
      },
      ...overrides.factory,
    },
  })

  const requires = {
    '@nativescript/swift-ui': {
      SwiftUIManager: {
        registerNativeScriptViews: (ids, l) => managerCalls.push({ ids, lifecycle: l }),
      },
    },
    '@octane-xplat/lib': {
      getSwiftUIHostLifecycle: () => lifecycle,
      registerSwiftUIHost: (id, handler) => registered.push({ id, handler }),
      unregisterSwiftUIHost: (id) => events.push(['unregister', id]),
      ...overrides.lib,
    },
  }

  const exports = {}

  vm.runInContext(`(function(exports, require) {${compiled}\n})`, context)(exports, (name) => {
    assert.ok(name in requires, `unexpected import: ${name}`)
    return requires[name]
  })

  return { api: exports, registered, events, managerCalls, lifecycle }
}

test('release destroys the factory views for both host ids before unregistering them', () => {
  const { api, events } = load()

  api.registerContextMenuHosts('ctxmenu1', {}, 'ctxmenu1preview', {})
  api.releaseContextMenuHosts('ctxmenu1', 'ctxmenu1preview')

  // The representable keys factory views by the stable host id, so release
  // must reach viewDestroyer with the exact ids — and before the host
  // handlers are dropped, while they can still resolve.
  assert.deepEqual(events, [
    ['destroy', 'ctxmenu1'],
    ['destroy', 'ctxmenu1preview'],
    ['unregister', 'ctxmenu1'],
    ['unregister', 'ctxmenu1preview'],
  ])
})

test('registration binds host creation and shares the lib lifecycle under both ids', () => {
  const { api, registered, managerCalls, lifecycle } = load()
  const trigger = {},
    preview = {}

  api.registerContextMenuHosts('ctxmenu2', trigger, 'ctxmenu2preview', preview)

  assert.equal(registered.length, 2)
  assert.equal(registered[0].id, 'ctxmenu2')
  assert.equal(registered[0].handler.create('ctxmenu2'), trigger)
  assert.equal(registered[1].id, 'ctxmenu2preview')
  assert.equal(registered[1].handler.create('ctxmenu2preview'), preview)
  assert.equal(managerCalls.length, 1)
  // The ids map is built in the vm realm — compare entries, not prototypes.
  assert.deepEqual(Object.keys(managerCalls[0].ids).sort(), ['ctxmenu2', 'ctxmenu2preview'])
  assert.equal(managerCalls[0].lifecycle, lifecycle)
})

test('release tolerates an absent shared factory and stays idempotent', () => {
  const { api, events } = load({
    factory: { shared: undefined },
  })

  api.releaseContextMenuHosts('ctxmenu3', 'ctxmenu3preview')
  api.releaseContextMenuHosts('ctxmenu3', 'ctxmenu3preview')

  assert.deepEqual(events, [
    ['unregister', 'ctxmenu3'],
    ['unregister', 'ctxmenu3preview'],
    ['unregister', 'ctxmenu3'],
    ['unregister', 'ctxmenu3preview'],
  ])
})
