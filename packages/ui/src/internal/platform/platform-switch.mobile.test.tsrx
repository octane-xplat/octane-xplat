/** @jsxImportSource @octane-xplat/jsx */
import { describe, expect, it, vi } from 'vitest'
import {
  createObjectContainer,
  createObjectDriver,
  createUniversalRoot,
  flushUniversalAct,
  flushUniversalSync,
} from 'octane/universal/native'

vi.mock('@nativescript/core', () => ({ isIOS: false, isAndroid: true }))

import { UISwitch } from '../../ios/UISwitch.ios.tsrx'
import { MaterialSwitch } from '../../android/MaterialSwitch.android.tsrx'

function createRoot() {
  const container = createObjectContainer('nativescript')

  return { container, root: createUniversalRoot(container, createObjectDriver('nativescript')) }
}

describe.each([
  ['UISwitch', UISwitch],
  ['MaterialSwitch', MaterialSwitch],
] as const)('%s field-state and accessibility props', (_name, Switch) => {
  it('forwards disabled, read-only, label, and testID to the host switch', () => {
    const { container, root } = createRoot()
    const change = vi.fn()

    flushUniversalSync(() =>
      root.render(Switch, {
        value: false,
        onChange: change,
        isDisabled: true,
        label: 'Airplane mode',
        disabledMessage: 'Managed by your admin',
        testID: 'settings.airplane',
      }),
    )

    const host = container.children[0]

    expect(host.props.isEnabled).toBe(false)
    expect(host.props.isUserInteractionEnabled).toBe(true)
    expect(host.props.testID).toBe('settings.airplane')
    expect(host.props.accessibilityRole).toBe('switch')
    expect(host.props.accessibilityLabel).toBe('Airplane mode')
    expect(host.props.accessibilityHint).toBe('Managed by your admin')
    expect(host.props.accessibilityState).toBe('disabled')

    // isDisabled maps to the host's enabled flag; a disabled OS widget
    // reports the state instead of toggling.
    flushUniversalSync(() =>
      root.render(Switch, { value: false, onChange: change, isDisabled: false, isReadOnly: true }),
    )

    expect(host.props.isEnabled).toBe(true)
    expect(host.props.isUserInteractionEnabled).toBe(false)

    // A read-only switch reverts stray change events instead of calling
    // onChange — the value cannot actually change.
    flushUniversalSync(() =>
      container.dispatchEvent(host, 'checkedChange', { value: true, object: host }),
    )

    expect(change).not.toHaveBeenCalled()
    expect(host.checked).toBe(false)

    root.unmount()
  })

  it('delivers checked state and onChange unchanged when enabled', () => {
    const { container, root } = createRoot()
    const change = vi.fn()

    flushUniversalSync(() => root.render(Switch, { value: true, onChange: change }))

    const host = container.children[0]

    expect(host.props.checked).toBe(true)
    expect(host.props.isEnabled).toBe(true)
    expect(host.props.isUserInteractionEnabled).toBe(true)

    flushUniversalSync(() =>
      container.dispatchEvent(host, 'checkedChange', { value: false, object: host }),
    )

    expect(change).toHaveBeenCalledWith(false)
    root.unmount()
  })

  it('restores the native checked state when a controlled change is rejected', () => {
    const { container, root } = createRoot()
    const change = vi.fn()

    flushUniversalAct(() => root.render(Switch, { value: false, onChange: change }))

    const host = container.children[0] as any

    // The native widget writes its own checked before firing checkedChange —
    // the app declining the controlled update must restore the owner value.
    host.checked = true
    flushUniversalAct(() =>
      container.dispatchEvent(host, 'checkedChange', { value: true, object: host }),
    )

    expect(change).toHaveBeenCalledWith(true)
    expect(host.checked).toBe(false)

    root.unmount()
  })

  it('keeps an accepted controlled change on the native widget', () => {
    const { container, root } = createRoot()
    let value = false
    const change = vi.fn((next: boolean) => {
      value = next
    })
    const render = () => root.render(Switch, { value, onChange: change })

    flushUniversalAct(render)

    const host = container.children[0] as any

    host.checked = true
    flushUniversalAct(() => {
      container.dispatchEvent(host, 'checkedChange', { value: true, object: host })
      render()
    })

    expect(change).toHaveBeenCalledWith(true)
    expect(host.checked).toBe(true)
    expect(host.props.checked).toBe(true)

    root.unmount()
  })

  it('leaves uncontrolled checked state with the widget', () => {
    const { container, root } = createRoot()
    const change = vi.fn()

    flushUniversalAct(() => root.render(Switch, { defaultValue: false, onChange: change }))

    const host = container.children[0] as any

    host.checked = true
    flushUniversalAct(() =>
      container.dispatchEvent(host, 'checkedChange', { value: true, object: host }),
    )

    expect(change).toHaveBeenCalledWith(true)
    expect(host.checked).toBe(true)

    root.unmount()
  })
})
