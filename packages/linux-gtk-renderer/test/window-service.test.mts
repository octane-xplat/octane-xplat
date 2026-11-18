// Window-service failure teardown (issue #301): an openWindow that fails
// after deps.mount — a content-resolver throw, non-component resolution, or
// a render throw — must unmount the mounted root and destroy the Gtk.Window
// instead of leaking the liveGtkContainers registration and native window.
// GTK cannot load outside GJS, so gi://Gtk resolves to a recording fake
// through registerHooks (the macos-appkit native-boundary pattern); the
// service under test is the real source module.
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import test from 'node:test'

const gtkSource = `
const events = (globalThis.__gtkWindowServiceEvents ??= [])
export class Window {
  constructor(props) { this.props = props }
  set_transient_for() {}
  set_modal() {}
  set_child() {}
  connect(signal) { events.push('connect:' + signal) }
  set_title() {}
  set_default_size() {}
  present() { events.push('present') }
  destroy() { events.push('destroy') }
}
export class Box {
  constructor(props) { this.props = props }
}
export const Orientation = { VERTICAL: 1 }
export default { Window, Box, Orientation }
`

const hooks = registerHooks({
  resolve(specifier, owner, next) {
    if (specifier === 'gi://Gtk?version=4.0') {
      return {
        url: 'data:text/javascript,' + encodeURIComponent(gtkSource),
        shortCircuit: true,
      }
    }

    return next(specifier, owner)
  },
})

const { createGtkWindowService } = await import('../src/window-service.ts')
hooks.deregister()

const gtkEvents = () => globalThis.__gtkWindowServiceEvents

function harness(root) {
  gtkEvents().length = 0
  return createGtkWindowService({
    mount: () => ({ root }),
    parentWindow: () => null,
  })
}

function assertTornDown(calls) {
  assert.deepEqual(calls, ['unmount'], 'the mounted root is released exactly once')
  assert.ok(gtkEvents().includes('destroy'), `window destroyed (events: ${gtkEvents()})`)
  assert.ok(!gtkEvents().includes('present'), `window never presented (events: ${gtkEvents()})`)
}

test('openWindow destroys the window when mount throws', () => {
  const service = createGtkWindowService({
    mount: () => {
      throw new Error('mount exploded')
    },
    parentWindow: () => null,
  })
  gtkEvents().length = 0

  assert.throws(() => service.openWindow({ component: () => null }), /mount exploded/)
  assert.ok(gtkEvents().includes('destroy'), `window destroyed (events: ${gtkEvents()})`)
  assert.ok(!gtkEvents().includes('present'), `window never presented (events: ${gtkEvents()})`)
})

test('openWindow tears down the window and root when render throws', () => {
  const calls = []
  const service = harness({
    render() {
      throw new Error('render exploded')
    },
    unmount() {
      calls.push('unmount')
    },
  })

  assert.throws(() => service.openWindow({ component: () => null }), /render exploded/)
  assertTornDown(calls)
})

test('openWindow tears down the window and root when the content resolver throws', () => {
  const calls = []
  const service = harness({
    render() {
      calls.push('render')
    },
    unmount() {
      calls.push('unmount')
    },
  })
  service.setWindowContentResolver(() => {
    throw new Error('resolver exploded')
  })

  assert.throws(() => service.openWindow({ data: { id: 1 } }), /resolver exploded/)
  assertTornDown(calls)
})

test('openWindow tears down the window and root when no component resolves', () => {
  const calls = []
  const service = harness({
    render() {
      calls.push('render')
    },
    unmount() {
      calls.push('unmount')
    },
  })

  assert.throws(() => service.openWindow({}), /Install a window content resolver/)
  assertTornDown(calls)
})

test('openWindow presents the window and keeps it live after a successful render', () => {
  const calls = []
  const service = harness({
    render() {
      calls.push('render')
    },
    unmount() {
      calls.push('unmount')
    },
  })

  const controller = service.openWindow({ component: () => null, title: 'T' })

  assert.deepEqual(calls, ['render'])
  assert.ok(gtkEvents().at(-1) === 'present', `present runs last (events: ${gtkEvents()})`)
  assert.ok(!gtkEvents().includes('destroy'), `window stays live (events: ${gtkEvents()})`)
  assert.equal(controller.isClosed, false)

  controller.close()

  assert.deepEqual(calls, ['render', 'unmount'])
  assert.ok(gtkEvents().includes('destroy'), `close destroys the window (events: ${gtkEvents()})`)
  assert.equal(controller.isClosed, true)
})
