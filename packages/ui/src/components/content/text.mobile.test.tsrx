/** @jsxImportSource @octane-xplat/jsx */
// Object-driver contract for Text's render-cost trims: ambient text skips the
// theme read and plain string/number children skip the InText scope, while the
// scale path still re-resolves through the provider on scheme changes. Host
// refs stay the shared prepareUIHost function unless escape bags or modifiers
// need re-applying after each render. The @nativescript/core mock models a
// mutable systemAppearance() plus captured systemAppearanceChanged listeners.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

vi.mock('../../gestures/host.tsrx', () => import('../../../tests/interaction-host-mock.tsrx'))
vi.mock('../../gestures/host.macos.tsrx', () => import('../../../tests/interaction-host-mock.tsrx'))

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

vi.mock('../../internal/platform/apply-native-modifiers.native', () => ({
  applyNativeModifiers: () => {},
}))

vi.mock('../../internal/platform/ui-host-props', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../internal/platform/ui-host-props')>()
  return {
    ...actual,
    prepareUIHost: vi.fn(actual.prepareUIHost),
    applyUIHostModifiers: vi.fn(actual.applyUIHostModifiers),
  }
})

import { Text } from './Text.tsrx'
import { Theme } from '../../theme/Theme.tsrx'
import { defineTheme } from '../../theme/defined-theme'
import { setThemePreference } from '../../theme/theme-scheme'
import { nativeAccessibilityRole, nativeAccessibilityState } from '../../internal/accessibility/native-accessibility'
import { prepareUIHost } from '../../internal/platform/ui-host-props'

const theme = defineTheme({
  name: 'text-probe',
  tokens: { '--color-text-secondary': ['#111111', '#eeeeee'] },
})

const prepare = vi.mocked(prepareUIHost)

function all(node: any): any[] {
  return [node, ...(node.children ?? []).flatMap(all)]
}
const spansOf = (node: any): any[] => all(node).filter((n) => n.type === 'span')
const labelsOf = (node: any): any[] => all(node).filter((n) => n.type === 'label')
const textsOf = (node: any): string[] =>
  all(node).flatMap((n) => {
    const text = n.props?.text ?? n.props?.value ?? n.text

    return typeof text === 'string' && text ? [text] : []
  })

function mount(supply: () => unknown, props: Record<string, any> = {}) {
  const container = createObjectContainer('nativescript')
  const root = createUniversalRoot(container, createObjectDriver('nativescript'))
  root.render(supply, props)
  flushUniversalSync(() => {})
  return { container, root }
}

beforeEach(() => {
  prepare.mockClear()
})

afterEach(() => {
  setThemePreference('system')
  nativeState.appearance = 'light'
})

describe('native Text plain children', () => {
  it('renders string children directly in the label without a span', () => {
    function Surface(): unknown @{
      return <Text>hello</Text>
    }
    const { container, root } = mount(Surface)
    const label = labelsOf(container)[0]
    expect(label).toBeTruthy()
    expect(textsOf(label)).toContain('hello')
    expect(spansOf(label)).toHaveLength(0)
    root.unmount()
  })

  it('renders number children directly in the label without a span', () => {
    function Surface(): unknown @{
      return <Text>{7}</Text>
    }
    const { container, root } = mount(Surface)
    const label = labelsOf(container)[0]
    expect(label).toBeTruthy()
    expect(textsOf(label)).toContain('7')
    expect(spansOf(label)).toHaveLength(0)
    root.unmount()
  })

  it('keeps element children under the scope so nested Text becomes a span', () => {
    function Surface(): unknown @{
      return (
        <Text>
          outer <Text>inner</Text>
        </Text>
      )
    }
    const { container, root } = mount(Surface)
    const label = labelsOf(container)[0]
    expect(label).toBeTruthy()
    const spans = spansOf(label)
    expect(spans).toHaveLength(1)
    expect(textsOf(spans[0])).toContain('inner')
    root.unmount()
  })

  it('scopes mixed array children the same way', () => {
    function Surface(): unknown @{
      return <Text>{['a', <Text>b</Text>, 3]}</Text>
    }
    const { container, root } = mount(Surface)
    const label = labelsOf(container)[0]
    expect(label).toBeTruthy()
    expect(textsOf(label)).toEqual(expect.arrayContaining(['a', '3']))
    const spans = spansOf(label)
    expect(spans).toHaveLength(1)
    expect(textsOf(spans[0])).toContain('b')
    root.unmount()
  })
})

describe('native Text scale tokens', () => {
  it('styles the scale color from the scope and re-resolves on scheme change', () => {
    function Surface(): unknown @{
      return (
        <Theme theme={theme}>
          <Text type="supporting">supporting</Text>
        </Theme>
      )
    }
    const { container, root } = mount(Surface)
    const label = labelsOf(container).find((n) => textsOf(n).includes('supporting'))!
    expect(label.props.style.color).toBe('#111111')

    flushUniversalSync(() => setThemePreference('dark'))
    // Same retained host — the style object carries the dark token now.
    expect(label.props.style.color).toBe('#eeeeee')
    root.unmount()
  })

  it('leaves ambient text unstyled by the scale', () => {
    function Surface(): unknown @{
      return (
        <Theme theme={theme}>
          <Text>ambient</Text>
        </Theme>
      )
    }
    const { container, root } = mount(Surface)
    const label = labelsOf(container).find((n) => textsOf(n).includes('ambient'))!
    expect(label.props.style?.color).toBeUndefined()
    expect(label.props.style?.fontSize).toBeUndefined()
    root.unmount()
  })
})

describe('native Text host props', () => {
  it('forwards testID, id and accessibility props to the label host', () => {
    function Surface(): unknown @{
      return (
        <Text
          testID="text.one"
          id="text-id"
          accessibilityLabel="label-text"
          accessibilityRole="button"
          accessibilityState={{ selected: true }}
          accessibilityHint="hint-text"
          accessibilityLiveRegion="polite"
        >
          hi
        </Text>
      )
    }
    const { container, root } = mount(Surface)
    const label = labelsOf(container)[0]
    expect(label.props.testID).toBe('text.one')
    expect(label.props.id).toBe('text-id')
    expect(label.props.accessibilityLabel).toBe('label-text')
    expect(label.props.accessibilityRole).toBe(nativeAccessibilityRole('button'))
    expect(label.props.accessibilityState).toBe(nativeAccessibilityState({ selected: true }))
    expect(label.props.accessibilityHint).toBe('hint-text')
    expect(label.props.accessibilityLiveRegion).toBe('polite')
    root.unmount()
  })
})

describe('native Text host ref stability', () => {
  it('calls prepareUIHost once across re-renders without escape props', () => {
    function Surface(props: { text: string }): unknown @{
      return <Text>{props.text}</Text>
    }
    const { container, root } = mount(Surface, { text: 'one' })
    const label = labelsOf(container)[0]
    expect(prepare).toHaveBeenCalledTimes(1)
    expect(prepare.mock.calls[0][0]).toBe(label)

    root.render(Surface, { text: 'two' })
    flushUniversalSync(() => {})
    root.render(Surface, { text: 'three' })
    flushUniversalSync(() => {})
    expect(prepare).toHaveBeenCalledTimes(1)
    root.unmount()
  })

  it('re-applies the escape bag after each render when ios props are set', () => {
    function Surface(props: { text: string }): unknown @{
      return <Text ios={{ customFlag: 1 }}>{props.text}</Text>
    }
    const { container, root } = mount(Surface, { text: 'one' })
    const label = labelsOf(container)[0]
    expect(label.customFlag).toBe(1)
    const calls = prepare.mock.calls.length

    root.render(Surface, { text: 'two' })
    flushUniversalSync(() => {})
    expect(prepare.mock.calls.length).toBeGreaterThan(calls)
    expect(label.customFlag).toBe(1)
    root.unmount()
  })
})
