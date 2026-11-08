import { afterEach, expect, it, vi } from 'vitest'
import { host } from '../src/host.windows'
import { createAppMenuService } from '../src/controller'
import type { AppMenuEntry } from '../src/shared'

const state = vi.hoisted(() => ({ window: { Content: null as any } }))
vi.mock('@nativescript/core/application/window-helper.windows', () => ({ findCurrentWindow: () => state.window }))
class Vector<T> extends Array<T> {
  get Size() { return this.length }
  GetAt(i: number) { return this[i] }
  Append(value: T) { this.push(value) }
  Clear() { this.length = 0 }
  SetAt(index: number, value: T) { this[index] = value }
}
class Element {
  KeyboardAccelerators = new Vector<any>()
  Children = new Vector<any>()
  Items = new Vector<any>()
  RowDefinitions = new Vector<any>()
  Click: any
  Invoked: any
  IsChecked = false
  static SetRow = vi.fn()
  Hide = vi.fn()
}
function setup() {
  state.window.Content = new Element()
  vi.stubGlobal('Microsoft', { UI: { Xaml: {
    Controls: {
      Grid: Element, StackPanel: Element, RowDefinition: Element,
      Button: Element, MenuFlyout: Element, MenuFlyoutItem: Element,
      ToggleMenuFlyoutItem: Element, MenuFlyoutSubItem: Element, MenuFlyoutSeparator: Element,
      Orientation: { Horizontal: 0 },
      Primitives: { FlyoutBase: { SetAttachedFlyout: vi.fn(), ShowAttachedFlyout: vi.fn() } },
    },
    GridLengthHelper: { Auto: {}, FromValueAndType: () => ({}) }, GridUnitType: { Star: 1 },
    Input: { KeyboardAccelerator: Element },
  } } })
  vi.stubGlobal('NSWinRT', { asDelegate: (_type: string, callback: unknown) => callback })
  const service = createAppMenuService(host)
  const install = (items: AppMenuEntry[]) => service.install([{ type: 'submenu', key: 'file', label: 'File', items }])
  return { service, install }
}
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers() })
const action = (onSelect: () => void, accelerator = 'Mod+N'): AppMenuEntry => ({ type: 'action', key: 'new', label: 'New', accelerator, onSelect })

it('requires a live window and the projected controls', () => {
  expect(host.supported()).toBe(false)
  setup()
  expect(host.supported()).toBe(true)
  state.window.Content = null
  expect(host.supported()).toBe(false)
})
it('keeps content, dispatches root shortcuts, updates and retires stale callbacks', () => {
  const { install } = setup()
  const original = state.window.Content
  const old = vi.fn(), next = vi.fn()
  const handle = install([action(old)])
  const wrapper = state.window.Content
  const oldInvoke = wrapper.KeyboardAccelerators[0].Invoked
  const event = { Handled: false }
  oldInvoke(null, event)
  expect(old).toHaveBeenCalledTimes(1)
  expect(event.Handled).toBe(true)
  handle.update([{ type: 'submenu', key: 'file', label: 'File', items: [action(next, 'Mod+M')] }])
  oldInvoke(null, { Handled: false })
  expect(old).toHaveBeenCalledTimes(1)
  const invoke = wrapper.KeyboardAccelerators[0].Invoked
  expect(wrapper.KeyboardAccelerators[0].Key).toBe(77)
  invoke(null, { Handled: false })
  expect(next).toHaveBeenCalledTimes(1)
  handle.dispose()
  expect(state.window.Content).toBe(original)
  expect(wrapper.KeyboardAccelerators).toHaveLength(0)
  invoke(null, { Handled: false })
  expect(next).toHaveBeenCalledTimes(1)
})
it('builds nested, disabled and controlled checkbox items', () => {
  const { install } = setup()
  const change = vi.fn(), disabled = vi.fn()
  const handle = install([
    { type: 'submenu', key: 'nested', label: 'Nested', items: [{ ...action(disabled), isDisabled: true }] },
    { type: 'separator', key: 's' },
    { type: 'checkbox', key: 'check', label: 'Check', value: true, onValueChange: change },
  ])
  const wrapper = state.window.Content
  // Attached flyout is captured by the native API; inspect that actual tree.
  const attach = (globalThis as any).Microsoft.UI.Xaml.Controls.Primitives.FlyoutBase.SetAttachedFlyout
  const flyout = attach.mock.calls[0][1]
  expect(flyout.Items).toHaveLength(3)
  const disabledItem = flyout.Items[0].Items[0]
  expect(disabledItem.IsEnabled).toBe(false)
  disabledItem.Click()
  wrapper.KeyboardAccelerators[0].Invoked(null, { Handled: false })
  expect(disabled).not.toHaveBeenCalled()
  const checkbox = flyout.Items[2]
  checkbox.IsChecked = false
  checkbox.Click()
  expect(change).toHaveBeenCalledWith(false)
  expect(checkbox.IsChecked).toBe(true)
  handle.dispose()
  expect(checkbox.Click).toBe(null)
  expect(flyout.Hide).toHaveBeenCalled()
})
it('rejects unsupported roles before changing window content', () => {
  const { install } = setup()
  const original = state.window.Content
  expect(() => install([{ type: 'role', key: 'quit', role: 'quit' }])).toThrow(/unsupported on Windows/)
  expect(state.window.Content).toBe(original)
})
it('does not overwrite foreign window content on disposal', () => {
  const { install } = setup()
  const callback = vi.fn()
  const handle = install([action(callback)])
  const invoke = state.window.Content.KeyboardAccelerators[0].Invoked
  const foreign = new Element()
  state.window.Content = foreign
  invoke(null, { Handled: false })
  expect(callback).not.toHaveBeenCalled()
  handle.dispose()
  expect(state.window.Content).toBe(foreign)
})
it('defers disposal requested inside an action and immediately gates stale native events', () => {
  vi.useFakeTimers()
  const { install } = setup()
  const original = state.window.Content
  const handle = install([action(() => handle.dispose())])
  const wrapper = state.window.Content
  const invoke = wrapper.KeyboardAccelerators[0].Invoked
  invoke(null, { Handled: false })
  expect(state.window.Content).toBe(wrapper)
  expect(handle.isDisposed).toBe(true)
  const event = { Handled: false }
  invoke(null, event)
  expect(event.Handled).toBe(false)
  vi.runAllTimers()
  expect(state.window.Content).toBe(original)
})

it('keeps the live tree usable when an update requests an unsupported role', () => {
  const { install } = setup()
  const callback = vi.fn()
  const handle = install([action(callback)])
  expect(() => handle.update([{ type: 'submenu', key: 'file', label: 'File', items: [
    { type: 'role', key: 'copy', role: 'copy' },
  ] }])).toThrow(/unsupported on Windows/)
  state.window.Content.KeyboardAccelerators[0].Invoked(null, { Handled: false })
  expect(callback).toHaveBeenCalledTimes(1)
  handle.dispose()
})
