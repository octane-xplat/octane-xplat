import { afterEach, describe, expect, it, vi } from 'vitest'
import { host } from '../src/host.macos'
import { normalizeAppMenu } from '../src/model'
import type { AppMenuEntry, AppMenuSubmenu } from '../src/shared'

const COMMAND = 1 << 20,
  OPTION = 1 << 19

const menus = (items: readonly AppMenuEntry[]): AppMenuSubmenu[] => [
  { type: 'submenu', key: 'file', label: 'File', items },
]

interface Captured {
  nodes: any[]
  handle: { update(nodes: any[]): void; dispose(): void } | null
  updates: any[][]
  disposed: number
  installer: ((nodes: any[]) => unknown) | null
}

function bridge(): Captured {
  const captured: Captured = {
    nodes: [],
    handle: null,
    updates: [],
    disposed: 0,
    installer: null,
  }

  captured.installer = (nodes: any[]) => {
    captured.nodes = nodes

    const handle = {
      update(next: any[]) {
        captured.updates.push(next)
      },
      dispose() {
        captured.disposed++
      },
    }

    captured.handle = handle
    return handle
  }

  vi.stubGlobal('__xplatAppKit', { installApplicationMenu: captured.installer })
  vi.stubGlobal('NSProcessInfo', { processInfo: { processName: 'MenuTest' } })
  return captured
}

const install = (captured: Captured, items: readonly AppMenuEntry[], options?: any) => {
  const dispatch = vi.fn(() => true)
  const tree = normalizeAppMenu(menus(items), options, 'macos', 7)
  const native = host.install(tree, dispatch)

  return { native, dispatch, nodes: captured.nodes }
}

afterEach(() => vi.unstubAllGlobals())

describe('host.macos', () => {
  it('is supported only when the AppKit bridge exposes the installer', () => {
    vi.stubGlobal('__xplatAppKit', {})
    expect(host.supported()).toBe(false)
    vi.stubGlobal('__xplatAppKit', { installApplicationMenu: () => null })
    expect(host.supported()).toBe(true)
    vi.stubGlobal('__xplatAppKit', undefined)
    expect(host.supported()).toBe(false)
  })

  it('prepends the standard application menu', () => {
    const captured = bridge()

    install(captured, [])

    const [appMenu, ...rest] = captured.nodes

    expect(rest).toHaveLength(1)
    expect(appMenu).toMatchObject({ type: 'submenu', title: 'MenuTest' })

    const titles = appMenu.children.map((child: any) =>
      child.type === 'separator' ? '—' : child.title,
    )

    expect(titles).toEqual([
      'About MenuTest',
      '—',
      'Hide MenuTest',
      'Hide Others',
      'Show All',
      '—',
      'Quit MenuTest',
    ])

    const quit = appMenu.children.at(-1)

    expect(quit).toMatchObject({
      selector: 'terminate:',
      keyEquivalent: 'q',
      modifierMask: COMMAND,
    })

    const hide = appMenu.children[2]

    expect(hide).toMatchObject({ selector: 'hide:', keyEquivalent: 'h', modifierMask: COMMAND })

    const hideOthers = appMenu.children[3]

    expect(hideOthers).toMatchObject({
      selector: 'hideOtherApplications:',
      modifierMask: COMMAND | OPTION,
    })
  })

  it('falls back to "App" when the process name is unavailable', () => {
    const captured = bridge()

    vi.stubGlobal('NSProcessInfo', undefined)
    install(captured, [])
    expect(captured.nodes[0].title).toBe('App')
  })

  it('places options.macos.applicationItems between About and the Hide group', () => {
    const captured = bridge()
    const options = {
      macos: {
        applicationItems: [
          {
            type: 'action',
            key: 'settings',
            label: 'Settings…',
            accelerator: 'Mod+,',
            onSelect: () => {},
          },
        ],
      },
    }

    install(captured, [], options)

    const titles = captured.nodes[0].children.map((child: any) =>
      child.type === 'separator' ? '—' : child.title,
    )

    expect(titles).toEqual([
      'About MenuTest',
      '—',
      'Settings…',
      '—',
      'Hide MenuTest',
      'Hide Others',
      'Show All',
      '—',
      'Quit MenuTest',
    ])

    const settings = captured.nodes[0].children[2]

    expect(settings).toMatchObject({ keyEquivalent: ',', modifierMask: COMMAND, enabled: true })
  })

  it('converts actions, checkboxes and selectors; omits quit roles', () => {
    const captured = bridge()
    const { nodes, dispatch } = install(captured, [
      {
        type: 'action',
        key: 'new',
        label: 'New',
        accelerator: 'Mod+N',
        isDisabled: true,
        onSelect: () => {},
      },
      { type: 'checkbox', key: 'wrap', label: 'Wrap', value: true, onValueChange: () => {} },
      { type: 'separator', key: 's' },
      { type: 'role', key: 'copy', role: 'copy' },
      { type: 'separator', key: 's2' },
      { type: 'role', key: 'quit', role: 'quit' },
    ])

    const file = nodes[1]

    expect(file).toMatchObject({ type: 'submenu', title: 'File' })

    // The quit role is omitted, and its stranded separator collapsed.
    const titles = file.children.map((child: any) =>
      child.type === 'separator' ? '—' : child.title,
    )

    expect(titles).toEqual(['New', 'Wrap', '—', 'Copy'])

    const [newItem, wrap, , copy] = file.children

    expect(newItem).toMatchObject({
      keyEquivalent: 'n',
      modifierMask: COMMAND,
      enabled: false,
      state: 0,
    })

    expect(newItem.onSelect).toBeTypeOf('function')
    expect(wrap).toMatchObject({ state: 1, enabled: true })
    expect(copy).toMatchObject({ selector: 'copy:', keyEquivalent: 'c', modifierMask: COMMAND })
    expect(copy.onSelect).toBeUndefined()

    newItem.onSelect()
    expect(dispatch).toHaveBeenCalled()

    const [id, gen] = dispatch.mock.calls[0]!

    expect(gen).toBe(7)
    expect(typeof id).toBe('number')
  })

  it('maps every remaining role to its selector and key equivalent', () => {
    const captured = bridge()
    const roles = [
      ['undo', 'undo:', 'z', COMMAND],
      ['redo', 'redo:', 'z', COMMAND | (1 << 17)],
      ['cut', 'cut:', 'x', COMMAND],
      ['copy', 'copy:', 'c', COMMAND],
      ['paste', 'paste:', 'v', COMMAND],
      ['selectAll', 'selectAll:', 'a', COMMAND],
      ['minimize', 'performMiniaturize:', 'm', COMMAND],
      ['close', 'performClose:', 'w', COMMAND],
    ] as const

    const { nodes } = install(
      captured,
      roles.map(([role], index) => ({ type: 'role', key: `r${index}`, role: role as any })),
    )

    for (const [index, [role, selector, key, mask]] of roles.entries()) {
      expect(nodes[1].children[index], role).toMatchObject({
        selector,
        keyEquivalent: key,
        modifierMask: mask,
        enabled: true,
      })
    }
  })

  it('update and dispose forward to the bridge handle', () => {
    const captured = bridge()
    const { native } = install(captured, [])
    const tree = normalizeAppMenu(menus([]), undefined, 'macos', 8)

    native.update(tree)
    expect(captured.updates).toHaveLength(1)
    expect(captured.updates[0]![0].title).toBe('MenuTest')
    native.dispose()
    expect(captured.disposed).toBe(1)
  })
})
