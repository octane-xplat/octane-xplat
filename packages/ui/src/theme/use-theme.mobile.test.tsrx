/** @jsxImportSource @octane-xplat/jsx */
// Object-driver contract for the provider-resolved useTheme result: the
// Theme's context carries a per-effective-mode UseThemeReturn, so consumers
// get an identity-stable object per scope and re-render through the context
// when the scheme flips. The no-Theme fallback keeps its own scheme
// subscription plus the registered root scope. The @nativescript/core mock
// models both halves of an OS appearance change — a mutable
// systemAppearance() snapshot and captured systemAppearanceChanged listeners.
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createObjectContainer,
  createObjectDriver,
  createUniversalRoot,
  flushUniversalSync,
} from 'octane/universal/native'

const nativeState = vi.hoisted(() => ({
  appearance: 'light' as 'light' | 'dark',
  listeners: new Map<string, Set<(...args: any[]) => void>>(),
}))

// Gesture hosts reach for native APIs the object driver doesn't provide.
vi.mock('../gestures/host.tsrx', () => import('../../tests/interaction-host-mock.tsrx'))
vi.mock('../gestures/host.macos.tsrx', () => import('../../tests/interaction-host-mock.tsrx'))

vi.mock('@nativescript/core', () => ({
  Property: class {
    constructor(_opts?: any) {}
    register() {}
  },
  CSSType: () => () => {},
  registerElement: () => {},
  View: class {},
  ScrollView: class {},
  isIOS: true,
  isAndroid: false,
  Application: {
    ios: true,
    android: false,
    addCss() {},
    on(name: string, cb: (...args: any[]) => void) {
      let set = nativeState.listeners.get(name)
      if (!set) nativeState.listeners.set(name, (set = new Set()))
      set.add(cb)
    },
    off(name: string, cb: (...args: any[]) => void) {
      nativeState.listeners.get(name)?.delete(cb)
    },
    systemAppearance: () => nativeState.appearance,
  },
  Utils: { openUrl: () => true },
}))

vi.mock('../internal/platform/apply-native-modifiers.native', () => ({
  applyNativeModifiers: () => {},
}))

import { Theme } from './Theme.tsrx'
import { useTheme } from './use-theme.tsrx'
import type { UseThemeReturn } from './theme-context'
import { defineTheme, resolveThemeTokens } from './defined-theme'
import { setRootThemeScope } from './theme-scope'
import { setThemePreference } from './theme-scheme'

const theme = defineTheme({
  name: 'probe',
  tokens: { '--color-text-secondary': ['#111111', '#eeeeee'] },
})
const inner = defineTheme({
  name: 'probe-inner',
  tokens: { '--color-text-secondary': '#222222' },
})

function fireSystemAppearanceChanged() {
  for (const cb of nativeState.listeners.get('systemAppearanceChanged') ?? []) cb()
}

function mount(supply: () => unknown) {
  const container = createObjectContainer('nativescript')
  const root = createUniversalRoot(container, createObjectDriver('nativescript'))
  root.render(supply, {})
  flushUniversalSync(() => {})
  return { container, root }
}

/** Theme scope registration and its unmount restore both complete on a
 *  microtask, not inside flushUniversalSync. */
const settle = () => Promise.resolve()

afterEach(() => {
  setThemePreference('system')
  nativeState.appearance = 'light'
})

describe('native useTheme', () => {
  it('returns the provider-resolved result, stable across a no-change re-render', async () => {
    const seen: UseThemeReturn[] = []
    function Probe(_props: { tick: number }): unknown @{
      seen.push(useTheme())
      return <span />
    }
    function Surface(props: { tick: number }): unknown @{
      return (
        <Theme theme={theme}>
          <Probe tick={props.tick} />
        </Theme>
      )
    }

    const container = createObjectContainer('nativescript')
    const root = createUniversalRoot(container, createObjectDriver('nativescript'))
    root.render(Surface, { tick: 0 })
    flushUniversalSync(() => {})
    const first = seen.at(-1)!
    expect(first.name).toBe('probe')
    expect(first.mode).toBe('light')
    expect(first.tokens).toEqual(resolveThemeTokens(theme, { mode: 'light' }))
    expect(first.token('--color-text-secondary')).toBe('#111111')

    root.render(Surface, { tick: 1 })
    flushUniversalSync(() => {})
    expect(seen.length).toBeGreaterThan(1)
    expect(seen.at(-1)).toBe(first)
    root.unmount()
    await settle()
  })

  it('re-renders a retained consumer on preference and OS appearance changes', async () => {
    const seen: Array<{ mode: string; token: string }> = []
    function Probe(): unknown @{
      const t = useTheme()
      seen.push({ mode: t.mode, token: t.token('--color-text-secondary') })
      return <span />
    }
    function Surface(): unknown @{
      return (
        <Theme theme={theme}>
          <Probe />
        </Theme>
      )
    }

    const { root } = mount(Surface)
    expect(seen.at(-1)).toEqual({ mode: 'light', token: '#111111' })

    const renders = seen.length
    flushUniversalSync(() => setThemePreference('dark'))
    expect(seen.length).toBeGreaterThan(renders)
    expect(seen.at(-1)).toEqual({ mode: 'dark', token: '#eeeeee' })

    // 'system' follows the OS appearance — start dark, then switch the mock
    // OS to light and fire the captured systemAppearanceChanged listener.
    nativeState.appearance = 'dark'
    flushUniversalSync(() => setThemePreference('system'))
    expect(seen.at(-1)).toEqual({ mode: 'dark', token: '#eeeeee' })

    nativeState.appearance = 'light'
    flushUniversalSync(fireSystemAppearanceChanged)
    expect(seen.at(-1)).toEqual({ mode: 'light', token: '#111111' })
    root.unmount()
    await settle()
  })

  it('resolves nested scopes nearest-first with mode inheritance', async () => {
    const seen: Record<string, { name: string; mode: string; token: string }> = {}
    function Probe(props: { id: string }): unknown @{
      const t = useTheme()
      seen[props.id] = { name: t.name, mode: t.mode, token: t.token('--color-text-secondary') }
      return <span />
    }
    function Surface(): unknown @{
      return (
        <Theme theme={theme}>
          <Probe id="outer" />
          <Theme theme={inner} mode="dark">
            <Probe id="inner" />
            <Theme theme={inner}>
              <Probe id="innermost" />
            </Theme>
          </Theme>
        </Theme>
      )
    }

    const { root } = mount(Surface)
    expect(seen.outer).toEqual({ name: 'probe', mode: 'light', token: '#111111' })
    expect(seen.inner).toEqual({ name: 'probe-inner', mode: 'dark', token: '#222222' })
    expect(seen.innermost).toEqual({ name: 'probe-inner', mode: 'dark', token: '#222222' })
    root.unmount()
    await settle()
  })

  it('falls back to the root theme scope without a Theme ancestor', async () => {
    const seen: Array<{ name: string; mode: string }> = []
    function Probe(): unknown @{
      const t = useTheme()
      seen.push({ name: t.name, mode: t.mode })
      return <span />
    }

    const restore = setRootThemeScope(theme)
    try {
      const { root } = mount(Probe)
      expect(seen.at(-1)).toEqual({ name: 'probe', mode: 'light' })

      flushUniversalSync(() => setThemePreference('dark'))
      expect(seen.at(-1)).toEqual({ name: 'probe', mode: 'dark' })
      root.unmount()
      await settle()
    } finally {
      restore()
    }

    const again = mount(Probe)
    expect(seen.at(-1)!.name).toBe('default')
    again.root.unmount()
    await settle()
  })
})
