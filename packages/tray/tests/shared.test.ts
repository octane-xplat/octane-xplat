import { describe, expect, it, vi } from 'vitest'

import { TrayError } from '../src/errors'
import {
  dispatchTraySelect,
  normalizeTrayOptions,
  normalizeTrayUpdate,
  validateTrayMenu,
} from '../src/menu'

import type { TrayMenuItem } from '../src/types'

const baseIcon = { type: 'file' as const, path: '/tmp/icon.png' }

function options(overrides: Record<string, unknown> = {}) {
  return { id: 'test-tray', icon: baseIcon, ...overrides }
}

describe('normalizeTrayOptions', () => {
  it('accepts a minimal valid options object', () => {
    const normalized = normalizeTrayOptions(options(), 'macos')

    expect(normalized.id).toBe('test-tray')
    expect(normalized.icon).toEqual(baseIcon)
  })

  it('rejects an empty id', () => {
    expect(() => normalizeTrayOptions(options({ id: '' }), 'macos')).toThrowError(TrayError)
    expect(() => normalizeTrayOptions(options({ id: '' }), 'macos')).toThrowError(
      expect.objectContaining({ code: 'invalid-options' }),
    )
  })

  it('rejects a non-string id', () => {
    expect(() => normalizeTrayOptions(options({ id: 42 }), 'macos')).toThrowError(
      expect.objectContaining({ code: 'invalid-options' }),
    )
  })

  it('rejects non-string title/tooltip', () => {
    expect(() => normalizeTrayOptions(options({ title: 7 }), 'macos')).toThrowError(
      expect.objectContaining({ code: 'invalid-options' }),
    )

    expect(() => normalizeTrayOptions(options({ tooltip: null }), 'macos')).toThrowError(
      expect.objectContaining({ code: 'invalid-options' }),
    )
  })

  it('resolves per-platform icons', () => {
    const normalized = normalizeTrayOptions(
      options({ icon: { linux: { type: 'named', name: 'star' }, macos: baseIcon } }),
      'linux',
    )

    expect(normalized.icon).toEqual({ type: 'named', name: 'star' })
  })

  it('rejects when no icon matches the current platform', () => {
    expect(() =>
      normalizeTrayOptions(options({ icon: { windows: baseIcon } }), 'linux'),
    ).toThrowError(expect.objectContaining({ code: 'invalid-icon' }))
  })

  it('rejects malformed icons', () => {
    expect(() =>
      normalizeTrayOptions(options({ icon: { type: 'file', path: '' } }), 'macos'),
    ).toThrowError(expect.objectContaining({ code: 'invalid-icon' }))

    expect(() => normalizeTrayOptions(options({ icon: { type: 'named' } }), 'macos')).toThrowError(
      expect.objectContaining({ code: 'invalid-icon' }),
    )

    expect(() => normalizeTrayOptions(options({ icon: { type: 'bogus' } }), 'macos')).toThrowError(
      expect.objectContaining({ code: 'invalid-icon' }),
    )
  })
})

describe('validateTrayMenu', () => {
  it('accepts a full nested menu', () => {
    const menu: TrayMenuItem[] = [
      { type: 'action', key: 'a', label: 'A' },
      { type: 'checkbox', key: 'c', label: 'C', value: true },
      {
        type: 'radio-group',
        key: 'r',
        label: 'R',
        value: 'one',
        items: [{ key: 'o1', label: 'One', value: 'one' }],
      },
      {
        type: 'submenu',
        key: 's',
        label: 'S',
        items: [{ type: 'action', key: 'sa', label: 'SA' }],
      },
      { type: 'section', key: 'sec', label: 'Sec', items: [{ type: 'separator', key: 'sep' }] },
      { type: 'separator', key: 'sep2' },
    ]

    expect(validateTrayMenu(menu)).toBe(menu)
  })

  it('rejects duplicate keys within one level', () => {
    expect(() =>
      validateTrayMenu([
        { type: 'action', key: 'x', label: 'A' },
        { type: 'action', key: 'x', label: 'B' },
      ]),
    ).toThrowError(expect.objectContaining({ code: 'invalid-menu' }))
  })

  it('allows the same key at different levels', () => {
    validateTrayMenu([
      { type: 'action', key: 'x', label: 'A' },
      { type: 'submenu', key: 's', label: 'S', items: [{ type: 'action', key: 'x', label: 'B' }] },
    ])
  })

  it('rejects non-string labels', () => {
    expect(() =>
      validateTrayMenu([{ type: 'action', key: 'a', label: 1 as unknown as string }]),
    ).toThrowError(expect.objectContaining({ code: 'invalid-menu' }))

    expect(() =>
      validateTrayMenu([
        {
          type: 'radio-group',
          key: 'r',
          label: 3 as unknown as string,
          items: [{ key: 'o', label: 'O' }],
        },
      ]),
    ).toThrowError(expect.objectContaining({ code: 'invalid-menu' }))
  })

  it('rejects malformed rows', () => {
    expect(() =>
      validateTrayMenu([{ type: 'unknown', key: 'a' } as unknown as TrayMenuItem]),
    ).toThrowError(expect.objectContaining({ code: 'invalid-menu' }))

    expect(() =>
      validateTrayMenu([{ type: 'checkbox', key: 'c', label: 'C' } as unknown as TrayMenuItem]),
    ).toThrowError(expect.objectContaining({ code: 'invalid-menu' }))

    expect(() =>
      validateTrayMenu([{ type: 'radio-group', key: 'r', items: [] } as unknown as TrayMenuItem]),
    ).toThrowError(expect.objectContaining({ code: 'invalid-menu' }))
  })
})

describe('normalizeTrayUpdate', () => {
  it('maps null to clear and keeps undefined unchanged', () => {
    const update = normalizeTrayUpdate({ title: null, tooltip: 'tip' }, 'macos')

    expect(update.title).toBeNull()
    expect(update.tooltip).toBe('tip')
  })

  it('rejects wrong types', () => {
    expect(() => normalizeTrayUpdate({ title: 5 as unknown as string }, 'macos')).toThrowError(
      expect.objectContaining({ code: 'invalid-options' }),
    )

    expect(() =>
      normalizeTrayUpdate(
        {
          menu: [
            { type: 'action', key: 'a', label: 'A' },
            { type: 'action', key: 'a', label: 'B' },
          ],
        },
        'macos',
      ),
    ).toThrowError(expect.objectContaining({ code: 'invalid-menu' }))
  })
})

describe('dispatchTraySelect', () => {
  it('fires onSelect for enabled actions only', () => {
    const onSelect = vi.fn()

    dispatchTraySelect({ type: 'action', key: 'a', label: 'A', onSelect })
    expect(onSelect).toHaveBeenCalledTimes(1)
    dispatchTraySelect({ type: 'action', key: 'a', label: 'A', isDisabled: true, onSelect })
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('toggles checkbox value through onValueChange', () => {
    const onValueChange = vi.fn()

    dispatchTraySelect({ type: 'checkbox', key: 'c', label: 'C', value: false, onValueChange })
    expect(onValueChange).toHaveBeenCalledWith(true)
    dispatchTraySelect({ type: 'checkbox', key: 'c', label: 'C', value: true, onValueChange })
    expect(onValueChange).toHaveBeenCalledWith(false)
  })

  it('does not fire onValueChange for the already-selected radio option', () => {
    const onValueChange = vi.fn()
    const group: TrayMenuItem = {
      type: 'radio-group',
      key: 'r',
      value: 'one',
      onValueChange,
      items: [
        { key: 'o1', label: 'One', value: 'one' },
        { key: 'o2', label: 'Two', value: 'two' },
      ],
    }

    if (group.type !== 'radio-group') {
      throw new Error('unreachable')
    }

    dispatchTraySelect(group, group.items[0])
    expect(onValueChange).not.toHaveBeenCalled()
    dispatchTraySelect(group, group.items[1])
    expect(onValueChange).toHaveBeenCalledWith('two')
  })

  it('falls back to the option key as the radio value', () => {
    const onValueChange = vi.fn()

    dispatchTraySelect(
      {
        type: 'radio-group',
        key: 'r',
        value: 'x',
        onValueChange,
        items: [{ key: 'plain', label: 'P' }],
      },
      { key: 'plain', label: 'P' },
    )

    expect(onValueChange).toHaveBeenCalledWith('plain')
  })

  it('swallows callback exceptions and reports them', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() =>
      dispatchTraySelect({
        type: 'action',
        key: 'a',
        label: 'A',
        onSelect: () => {
          throw new Error('user bug')
        },
      }),
    ).not.toThrow()

    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})
