import { describe, expect, it } from 'vitest'
import { normalizeAppMenu } from '../src/model'
import type { AppMenuEntry, AppMenuSubmenu } from '../src/shared'

const menus = (items: readonly AppMenuEntry[], key = 'file', label = 'File'): AppMenuSubmenu[] => [
  { type: 'submenu', key, label, items },
]

const action = (over: Record<string, unknown> = {}): AppMenuEntry => ({
  type: 'action',
  key: 'a',
  label: 'A',
  onSelect: () => {},
  ...over,
})

describe('normalizeAppMenu validation', () => {
  it('accepts a tree and assigns dispatch ids to actionable nodes', () => {
    const tree = normalizeAppMenu(
      menus([
        action({ key: 'new' }),
        { type: 'checkbox', key: 'wrap', label: 'Wrap', value: true, onValueChange: () => {} },
        { type: 'role', key: 'copy', role: 'copy' },
        {
          type: 'submenu',
          key: 'recent',
          label: 'Recent',
          items: [action({ key: 'r1' })],
        },
      ]),
      undefined,
      'linux',
      1,
    )

    const ids = [...tree.nodes.keys()]

    expect(ids).toHaveLength(4)
    expect(new Set(ids).size).toBe(4)
    expect(tree.menus[0]!.items.map((item) => item.kind)).toEqual([
      'action',
      'checkbox',
      'role',
      'submenu',
    ])
  })

  it('rejects non-submenu menu-bar entries and non-array menus', () => {
    expect(() => normalizeAppMenu([action() as never], undefined, 'linux', 1)).toThrow(
      /menus\[0\].*submenu/,
    )

    expect(() => normalizeAppMenu(null as never, undefined, 'linux', 1)).toThrow(/menus/)
  })

  it('reports the entry path in validation errors', () => {
    expect(() =>
      normalizeAppMenu(
        menus([{ type: 'submenu', key: 'sub', label: 'Sub', items: [action({ label: '' })] }]),
        undefined,
        'linux',
        1,
      ),
    ).toThrow(/menus\[0\]\.items\[0\]\.items\[0\].*label/)

    expect(() => normalizeAppMenu(menus([action({ onSelect: 1 })]), undefined, 'linux', 1)).toThrow(
      /menus\[0\]\.items\[0\].*onSelect.*function/,
    )

    expect(() =>
      normalizeAppMenu(
        menus([
          { type: 'checkbox', key: 'c', label: 'C', value: 'x', onValueChange: () => {} },
        ] as never),
        undefined,
        'linux',
        1,
      ),
    ).toThrow(/value.*boolean/)
  })

  it('rejects empty keys, duplicate sibling keys and unknown types/roles', () => {
    expect(() => normalizeAppMenu(menus([action({ key: '' })]), undefined, 'linux', 1)).toThrow(
      /key.*non-empty/,
    )

    expect(() => normalizeAppMenu(menus([action(), action()]), undefined, 'linux', 1)).toThrow(
      /menus\[0\]\.items\[1\].*duplicate.*"a"/,
    )

    // Same key in different siblings is fine.
    expect(() =>
      normalizeAppMenu(
        [...menus([action()]), { type: 'submenu', key: 'edit', label: 'Edit', items: [action()] }],
        undefined,
        'linux',
        1,
      ),
    ).not.toThrow()

    expect(() =>
      normalizeAppMenu(menus([{ type: 'bogus', key: 'x' } as never]), undefined, 'linux', 1),
    ).toThrow(/unknown menu entry type/)

    expect(() =>
      normalizeAppMenu(
        menus([{ type: 'role', key: 'r', role: 'about' } as never]),
        undefined,
        'linux',
        1,
      ),
    ).toThrow(/unknown role/)
  })

  it('applies role default labels and honors overrides', () => {
    const tree = normalizeAppMenu(
      menus([
        { type: 'role', key: 'r1', role: 'copy' },
        { type: 'role', key: 'r2', role: 'quit', label: 'Leave' },
      ]),
      undefined,
      'linux',
      1,
    )

    const [copy, quit] = tree.menus[0]!.items

    expect(copy).toMatchObject({ kind: 'role', label: 'Copy' })
    expect(quit).toMatchObject({ kind: 'role', label: 'Leave' })
    expect(() =>
      normalizeAppMenu(
        menus([{ type: 'role', key: 'r', role: 'copy', label: '' }]),
        undefined,
        'linux',
        1,
      ),
    ).toThrow(/label/)
  })

  it('collapses leading, trailing and repeated separators', () => {
    const sep = (key: string): AppMenuEntry => ({ type: 'separator', key })
    const tree = normalizeAppMenu(
      menus([
        sep('s1'),
        sep('s2'),
        action(),
        sep('s3'),
        sep('s4'),
        action({ key: 'b' }),
        sep('s5'),
      ]),
      undefined,
      'linux',
      1,
    )

    expect(tree.menus[0]!.items.map((item) => item.kind)).toEqual(['action', 'separator', 'action'])
  })

  it('rejects bad accelerators with the entry path', () => {
    expect(() =>
      normalizeAppMenu(menus([action({ accelerator: 'Nope+K' })]), undefined, 'linux', 1),
    ).toThrow(/menus\[0\]\.items\[0\]\.accelerator/)

    expect(() =>
      normalizeAppMenu(menus([action({ accelerator: 'Shift+A' })]), undefined, 'linux', 1),
    ).toThrow(/accelerator/)
  })

  it('rejects duplicate effective accelerators per platform', () => {
    const dupe = [
      action({ key: 'a', accelerator: 'Mod+Y' }),
      action({ key: 'b', accelerator: 'Control+Y' }),
    ]

    // Mod → Control on GTK: same effective accelerator.
    expect(() => normalizeAppMenu(menus(dupe), undefined, 'linux', 1)).toThrow(/duplicates/)
    // …but Mod → Command on macOS: distinct there.
    expect(() => normalizeAppMenu(menus(dupe), undefined, 'macos', 1)).not.toThrow()
    // Mod and Meta also collide on macOS (both Command).
    expect(() =>
      normalizeAppMenu(
        menus([
          action({ key: 'a', accelerator: 'Command+Q' }),
          action({ key: 'b', accelerator: 'Mod+Q' }),
        ]),
        undefined,
        'macos',
        1,
      ),
    ).toThrow(/duplicates/)
  })

  it('counts role accelerators registered on the platform', () => {
    // GTK registers <Control>q for quit.
    expect(() =>
      normalizeAppMenu(
        menus([
          { type: 'role', key: 'q', role: 'quit' },
          action({ key: 'a', accelerator: 'Control+Q' }),
        ]),
        undefined,
        'linux',
        1,
      ),
    ).toThrow(/duplicates/)

    // macOS registers ⌘V for paste.
    expect(() =>
      normalizeAppMenu(
        menus([
          { type: 'role', key: 'p', role: 'paste' },
          action({ key: 'a', accelerator: 'Mod+V' }),
        ]),
        undefined,
        'macos',
        1,
      ),
    ).toThrow(/duplicates/)

    // But GTK does not register edit-role accels (display only).
    expect(() =>
      normalizeAppMenu(
        menus([
          { type: 'role', key: 'p', role: 'paste' },
          action({ key: 'a', accelerator: 'Control+V' }),
        ]),
        undefined,
        'linux',
        1,
      ),
    ).not.toThrow()
  })

  it('counts the standard macOS application menu accelerators', () => {
    for (const accelerator of ['Mod+Q', 'Mod+H', 'Mod+Alt+H']) {
      expect(() =>
        normalizeAppMenu(menus([action({ accelerator })]), undefined, 'macos', 1),
      ).toThrow(new RegExp(`${accelerator.replace('+', '\\+')}.*application menu|duplicates`))
    }
  })

  it('includes options.macos.applicationItems in macOS validation and storage', () => {
    const options = {
      macos: {
        applicationItems: [action({ key: 'settings', accelerator: 'Mod+,' })],
      },
    }

    expect(() =>
      normalizeAppMenu(menus([action({ accelerator: 'Mod+,' })]), options, 'macos', 1),
    ).toThrow(/duplicates/)

    const tree = normalizeAppMenu(menus([]), options, 'macos', 1)

    expect(tree.applicationItems).toHaveLength(1)
    expect(tree.applicationItems[0]).toMatchObject({ kind: 'action', label: 'A' })

    // Non-macOS platforms validate shape but ignore contents and collisions.
    const ignored = normalizeAppMenu(menus([action({ accelerator: 'Mod+,' })]), options, 'linux', 1)

    expect(ignored.applicationItems).toHaveLength(1)
    expect(() =>
      normalizeAppMenu(
        menus([]),
        { macos: { applicationItems: [{ type: 'bogus', key: 'x' } as never] } },
        'linux',
        1,
      ),
    ).toThrow(/options\.macos\.applicationItems\[0\]/)
  })
})
