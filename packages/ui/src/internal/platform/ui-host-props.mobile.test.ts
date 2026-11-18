import { describe, expect, it, vi } from 'vitest'

vi.mock('@nativescript/core', () => ({ isAndroid: true, ScrollView: class ScrollView {} }))

import { ScrollView } from '@nativescript/core'
import { prepareUIHost, applyUIHostModifiers } from './ui-host-props'

describe('UI native host setup', () => {
  it('sets Android overflow after load and applies modifiers after escape props', () => {
    let loaded: (() => void) | undefined
    const native = { setClipChildren: vi.fn(), setClipToPadding: vi.fn() }
    const host = { android: native, style: {}, color: '', on: (_event: string, cb: () => void) => { loaded = cb } }
    prepareUIHost(host)
    host.color = 'escape'
    applyUIHostModifiers(host, { modifiers: [{ type: 'property', name: 'color', value: 'modifier' }] })
    expect(host.color).toBe('modifier')
    expect(native.setClipChildren).not.toHaveBeenCalled()
    loaded?.()
    expect(native.setClipChildren).toHaveBeenCalledWith(false)
    expect(native.setClipToPadding).toHaveBeenCalledWith(false)
  })

  it('preserves clipping on scroll containers', () => {
    const scroll = new ScrollView()
    const native = { setClipChildren: vi.fn(), setClipToPadding: vi.fn() }
    Object.assign(scroll, { android: native, on: (_event: string, cb: () => void) => cb() })
    prepareUIHost(scroll)
    expect(native.setClipChildren).not.toHaveBeenCalled()
  })

  it('registers the loaded handler once per host across repeat prepares', () => {
    const handlers: Array<() => void> = []
    const host = {
      android: { setClipChildren: vi.fn(), setClipToPadding: vi.fn() },
      on: (_event: string, cb: () => void) => handlers.push(cb),
    }

    prepareUIHost(host)
    prepareUIHost(host)
    expect(handlers).toHaveLength(1)

    const other = {
      android: { setClipChildren: vi.fn(), setClipToPadding: vi.fn() },
      on: (_event: string, cb: () => void) => handlers.push(cb),
    }

    prepareUIHost(other)
    expect(handlers).toHaveLength(2)
  })
})
