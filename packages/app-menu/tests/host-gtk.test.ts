import { beforeEach, describe, expect, it, vi } from 'vitest'
import Gtk from 'gi://Gtk?version=4.0'
import Gio from 'gi://Gio'
import GLib from 'gi://GLib'
import { host } from '../src/host.gtk'
import { normalizeAppMenu } from '../src/model'
import type { AppMenuEntry, AppMenuSubmenu } from '../src/shared'

const menus = (items: readonly AppMenuEntry[]): AppMenuSubmenu[] => [
  { type: 'submenu', key: 'file', label: 'File', items },
]

function install(items: readonly AppMenuEntry[], generation = 3) {
  const dispatch = vi.fn(() => true)
  const tree = normalizeAppMenu(menus(items), undefined, 'linux', generation)
  const native = host.install(tree, dispatch)
  return { native, dispatch, tree, app: Gio.Application.default! }
}

function fakeWindow(focus: any = null) {
  const window = {
    closeCalls: 0,
    minimizeCalls: 0,
    focus,
    close() {
      window.closeCalls++
    },
    minimize() {
      window.minimizeCalls++
    },
    get_focus() {
      return window.focus
    },
  }
  return window
}

const app = () => Gio.Application.default! as InstanceType<typeof Gio.Application>

beforeEach(() => {
  Gio.Application.default = new Gtk.Application()
  GLib.idleQueue.length = 0
})

describe('host.gtk', () => {
  it('is supported only when the default application is a GtkApplication', () => {
    Gio.Application.default = null
    expect(host.supported()).toBe(false)
    Gio.Application.default = new Gio.Application()
    expect(host.supported()).toBe(false)
    Gio.Application.default = new Gtk.Application()
    expect(host.supported()).toBe(true)
  })

  it('defers through GLib.idle_add', () => {
    const fn = vi.fn()
    host.defer(fn)
    expect(GLib.idleQueue).toHaveLength(1)
    expect(GLib.idleQueue[0]!()).toBe(GLib.SOURCE_REMOVE)
    expect(fn).toHaveBeenCalled()
  })

  it('builds a menubar with sections for separators and mnemonics escaped', () => {
    install([
      { type: 'action', key: 'a', label: '_Open', onSelect: () => {} },
      { type: 'separator', key: 's1' },
      { type: 'submenu', key: 'sub', label: 'More', items: [
        { type: 'action', key: 'b', label: 'Deep', onSelect: () => {} },
      ]},
      { type: 'separator', key: 's2' },
      { type: 'action', key: 'c', label: 'Close_now', onSelect: () => {} },
    ])
    const menubar = app().menubar as InstanceType<typeof Gio.Menu>
    expect(menubar.children).toHaveLength(1)
    const file = menubar.children[0] as { label: string; submenu: InstanceType<typeof Gio.Menu> }
    expect(file.label).toBe('File')
    const sections = file.submenu.children as { section: InstanceType<typeof Gio.Menu> }[]
    expect(sections).toHaveLength(3)
    expect(sections[0]!.section.children).toEqual([
      { label: '__Open', action: expect.stringMatching(/^app\.xplat-menu-\d+-3-\d+$/) },
    ])
    const sub = sections[1]!.section.children[0] as { label: string; submenu: InstanceType<typeof Gio.Menu> }
    expect(sub.label).toBe('More')
    expect(sections[2]!.section.children[0]).toMatchObject({ label: 'Close__now' })
  })

  it('registers simple and stateful actions with enabled flags and accels', () => {
    install([
      { type: 'action', key: 'a', label: 'A', accelerator: 'Mod+O', isDisabled: true, onSelect: () => {} },
      { type: 'checkbox', key: 'w', label: 'Wrap', value: true, onValueChange: () => {} },
    ])
    const actions = [...app().actions.values()]
    expect(actions).toHaveLength(2)
    const [open, wrap] = actions
    expect(open!.enabled).toBe(false)
    expect(open!.stateful).toBe(false)
    expect(wrap!.stateful).toBe(true)
    expect(wrap!.state).toMatchObject({ kind: 'b', value: true })
    // Only the accelerated action registers an app-level shortcut.
    const accels = [...app().accels.values()]
    expect(accels).toEqual([['<Control>o']])
    for (const name of app().accels.keys()) {
      expect(name).toBe(`app.${open!.name}`)
    }
  })

  it('dispatches activations with the node id and generation', () => {
    const { dispatch, tree } = install([
      { type: 'action', key: 'a', label: 'A', onSelect: () => {} },
    ])
    const [action] = [...app().actions.values()]
    action!.activate()
    const [id] = [...tree.nodes.keys()]
    expect(dispatch).toHaveBeenCalledWith(id, 3)
  })

  it('edit roles show accels without registering and activate the focus widget', () => {
    const focus = { activate_action: vi.fn(() => true) }
    app().activeWindow = fakeWindow(focus)
    const { dispatch } = install([{ type: 'role', key: 'copy', role: 'copy' }])
    expect([...app().accels.values()]).toEqual([])
    const menubar = app().menubar as InstanceType<typeof Gio.Menu>
    const section = (menubar.children[0] as any).submenu.children[0].section
    const item = section.children[0] as InstanceType<typeof Gio.MenuItem>
    expect(item).toBeInstanceOf(Gio.MenuItem)
    expect(item.attrs.get('accel')).toMatchObject({ kind: 's', value: '<Control>c' })
    const [action] = [...app().actions.values()]
    action!.activate()
    expect(dispatch).toHaveBeenCalled()
    expect(focus.activate_action).toHaveBeenCalledWith('clipboard.copy', null)
  })

  it('window roles close/minimize the active window and quit quits the app', () => {
    app().activeWindow = fakeWindow()
    install([
      { type: 'role', key: 'close', role: 'close' },
      { type: 'role', key: 'min', role: 'minimize' },
      { type: 'role', key: 'quit', role: 'quit' },
    ])
    const byAction = new Map(
      [...app().actions.entries()].map(([name, action]) => [name, action]),
    )
    const names = [...byAction.keys()]
    const [close, minimize, quit] = names
    expect(app().accels.get(`app.${close}`)).toEqual(['<Control>w'])
    expect(app().accels.get(`app.${quit}`)).toEqual(['<Control>q'])
    byAction.get(close!)!.activate()
    byAction.get(minimize!)!.activate()
    expect(app().activeWindow).toMatchObject({ closeCalls: 1, minimizeCalls: 1 })
    byAction.get(quit!)!.activate()
    expect(app().quitCalls).toBe(1)
  })

  it('update registers the new generation under fresh action names', () => {
    const { native, tree } = install([{ type: 'action', key: 'a', label: 'A', onSelect: () => {} }])
    const oldNames = [...app().actions.keys()]
    expect(oldNames).toHaveLength(1)
    // Same shape tree, next generation: ids restart at 1, names must not collide.
    const next = normalizeAppMenu(
      menus([{ type: 'action', key: 'a', label: 'A', accelerator: 'Control+S', onSelect: () => {} }]),
      undefined,
      'linux',
      tree.generation + 1,
    )
    native.update(next)
    const newNames = [...app().actions.keys()]
    expect(newNames).toHaveLength(1)
    expect(newNames[0]).not.toBe(oldNames[0])
    expect(newNames[0]).toContain(`-${tree.generation + 1}-`)
    for (const name of oldNames) {
      expect(app().actions.has(name)).toBe(false)
      expect(app().accels.get(`app.${name}`)).toEqual([])
    }
    expect(app().accels.get(`app.${newNames[0]}`)).toEqual(['<Control>s'])
  })

  it('update registers new actions before retiring the old generation', () => {
    const { native, tree } = install([{ type: 'action', key: 'a', label: 'A', onSelect: () => {} }])
    const oldMenubar = app().menubar
    const oldNames = [...app().actions.keys()]
    const order: string[] = []
    const originalSet = app().set_menubar.bind(app())
    app().set_menubar = (menu: InstanceType<typeof Gio.Menu> | null) => {
      order.push(`set_menubar:actions=${app().actions.size}`)
      originalSet(menu)
    }
    const next = normalizeAppMenu(
      menus([{ type: 'action', key: 'b', label: 'B', onSelect: () => {} }]),
      undefined,
      'linux',
      tree.generation + 1,
    )
    native.update(next)
    expect(app().menubar).not.toBe(oldMenubar)
    // At swap time the new actions already existed; afterwards only the new
    // generation's remain and old accels are cleared.
    expect(order).toEqual([`set_menubar:actions=${oldNames.length + 1}`])
    expect([...app().actions.keys()]).toHaveLength(1)
    for (const name of oldNames) {
      expect(app().actions.has(name)).toBe(false)
      expect(app().accels.get(`app.${name}`)).toEqual([])
    }
  })

  it('dispose restores the previous menubar only while ours is installed', () => {
    const previous = new Gio.Menu()
    app().set_menubar(previous)
    const { native } = install([])
    const ours = app().menubar
    native.dispose()
    expect(app().menubar).toBe(previous)
    expect(app().actions.size).toBe(0)

    const second = install([])
    const secondBar = app().menubar
    const foreign = new Gio.Menu()
    app().set_menubar(foreign)
    second.native.dispose()
    expect(app().menubar).toBe(foreign)
    expect(ours).not.toBe(secondBar)
  })

  it('dispose is safe to call twice', () => {
    const { native } = install([{ type: 'action', key: 'a', label: 'A', onSelect: () => {} }])
    native.dispose()
    expect(() => native.dispose()).not.toThrow()
    expect(app().actions.size).toBe(0)
  })
})
