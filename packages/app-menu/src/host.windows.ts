import { findCurrentWindow } from '@nativescript/core/application/window-helper.windows'
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import { toWinUI } from './accelerator.js'
import type { AppMenuHost } from './host-types.js'
import type { NormalizedAppMenu, NormalizedEntry } from './model.js'

interface Vector<T> {
  readonly Size: number
  GetAt(index: number): T
  Append(value: T): void
  Clear(): void
  SetAt(index: number, value: T): void
}
interface Accelerator {
  Key: number
  Modifiers: number
  Invoked: object | null
}
interface Element {
  KeyboardAccelerators: Vector<Accelerator>
}
interface Item extends Element {
  Text: string
  IsEnabled: boolean
  IsChecked: boolean
  Click: object | null
}
interface Submenu { Text: string; Items: Vector<object> }
interface Panel extends Element { Children: Vector<object>; Orientation: number }
interface Grid extends Panel { RowDefinitions: Vector<{ Height: object }> }
interface Button { Content: string; Click: object | null }
interface Window { Content: Element | null }
interface Projection {
  Microsoft?: { UI: { Xaml: {
    Controls: {
      Grid: { new(): Grid; SetRow(element: object, row: number): void }
      RowDefinition: new() => { Height: object }
      StackPanel: new() => Panel
      Button: new() => Button
      MenuFlyout: new() => { Items: Vector<object>; Hide(): void }
      MenuFlyoutItem: new() => Item
      ToggleMenuFlyoutItem: new() => Item
      MenuFlyoutSubItem: new() => Submenu
      MenuFlyoutSeparator: new() => object
      Orientation: { Horizontal: number }
      Primitives: { FlyoutBase: {
        SetAttachedFlyout(button: Button, flyout: object | null): void
        ShowAttachedFlyout(button: Button): void
      } }
    }
    GridLengthHelper: { Auto: object; FromValueAndType(value: number, unit: number): object }
    GridUnitType: { Star: number }
    Input: { KeyboardAccelerator: new() => Accelerator }
  } } }
  NSWinRT?: { asDelegate(type: string, callback: (sender: unknown, args: { Handled: boolean }) => void): object }
}
// The runtime owns these globals. Keep the projection boundary local and named.
const projection = () => globalThis as typeof globalThis & Projection
const window = (): Window | undefined => findCurrentWindow() ?? undefined

function validate(tree: NormalizedAppMenu): void {
  // The pinned projection has no safe responder-chain equivalent or reliable
  // application Exit. Reject roles before touching the installed native tree.
  for (const node of tree.nodes.values()) {
    if (node.kind === 'role') {
      throw new Error(`App menu role "${node.role}" is unsupported on Windows; use an action callback`)
    }
  }
}

export const host: AppMenuHost = {
  platform: 'windows',
  supported() {
    return Boolean(window()?.Content && projection().Microsoft?.UI.Xaml.Controls.MenuFlyout && projection().NSWinRT?.asDelegate)
  },
  defer(fn) { setTimeout(fn, 0) },
  install(tree, dispatch) {
    const owner = window()
    const { Microsoft, NSWinRT } = projection()
    if (!owner?.Content || !Microsoft || !NSWinRT) {
      throw new UnavailabilityError('appMenu')
    }
    validate(tree)
    const ui = Microsoft.UI.Xaml
    const C = ui.Controls
    const previous = owner.Content
    const wrapper = new C.Grid()
    const top = new C.RowDefinition()
    top.Height = ui.GridLengthHelper.Auto
    const rest = new C.RowDefinition()
    rest.Height = ui.GridLengthHelper.FromValueAndType(1, ui.GridUnitType.Star)
    wrapper.RowDefinitions.Append(top)
    wrapper.RowDefinitions.Append(rest)
    let disposed = false

    function build(next: NormalizedAppMenu) {
      validate(next)
      let active = true
      const cleanups: (() => void)[] = []
      const bar = new C.StackPanel()
      bar.Orientation = C.Orientation.Horizontal
      const accelerators: Accelerator[] = []
      const alive = () => active && !disposed && owner!.Content === wrapper && window() === owner
      const click = (callback: () => void) => NSWinRT!.asDelegate('Microsoft.UI.Xaml.RoutedEventHandler', callback)
      const append = (items: Vector<object>, entries: readonly NormalizedEntry[]) => {
        for (const node of entries) {
          if (node.kind === 'separator') {
            items.Append(new C.MenuFlyoutSeparator())
          } else if (node.kind === 'submenu') {
            const sub = new C.MenuFlyoutSubItem()
            sub.Text = node.label
            append(sub.Items, node.items)
            items.Append(sub)
          } else if (node.kind !== 'role') {
            const item = node.kind === 'checkbox' ? new C.ToggleMenuFlyoutItem() : new C.MenuFlyoutItem()
            item.Text = node.label
            item.IsEnabled = !node.disabled
            if (node.kind === 'checkbox') { item.IsChecked = node.value }
            const invoke = () => {
              if (node.kind === 'checkbox') { item.IsChecked = node.value }
              return alive() && !node.disabled && dispatch(node.id, next.generation)
            }
            item.Click = click(() => { invoke() })
            cleanups.push(() => { item.Click = null })
            if (node.accelerator) {
              const keys = toWinUI(node.accelerator)
              // Display on the item; register separately on the content root so
              // the shortcut works without opening the flyout first.
              const display = new ui.Input.KeyboardAccelerator()
              display.Key = keys.key
              display.Modifiers = keys.modifiers
              display.Invoked = NSWinRT!.asDelegate('Windows.Foundation.TypedEventHandler`2<Microsoft.UI.Xaml.Input.KeyboardAccelerator,Microsoft.UI.Xaml.Input.KeyboardAcceleratorInvokedEventArgs>', (_sender, args) => {
                if (invoke()) { args.Handled = true }
              })
              item.KeyboardAccelerators.Append(display)
              const root = new ui.Input.KeyboardAccelerator()
              root.Key = keys.key
              root.Modifiers = keys.modifiers
              root.Invoked = NSWinRT!.asDelegate('Windows.Foundation.TypedEventHandler`2<Microsoft.UI.Xaml.Input.KeyboardAccelerator,Microsoft.UI.Xaml.Input.KeyboardAcceleratorInvokedEventArgs>', (_sender, args) => {
                if (invoke()) { args.Handled = true }
              })
              accelerators.push(root)
              cleanups.push(() => { display.Invoked = null; root.Invoked = null; item.KeyboardAccelerators.Clear() })
            }
            items.Append(item)
          }
        }
      }
      const retire = () => {
        active = false
        for (const cleanup of cleanups.reverse()) { cleanup() }
      }
      try {
        for (const menu of next.menus) {
          const button = new C.Button()
          button.Content = menu.label
          const flyout = new C.MenuFlyout()
          cleanups.push(() => { flyout.Hide(); button.Click = null; C.Primitives.FlyoutBase.SetAttachedFlyout(button, null) })
          append(flyout.Items, menu.items)
          C.Primitives.FlyoutBase.SetAttachedFlyout(button, flyout)
          button.Click = click(() => {
            if (alive()) { C.Primitives.FlyoutBase.ShowAttachedFlyout(button) }
          })
          bar.Children.Append(button)
        }
        C.Grid.SetRow(bar, 0)
        return { bar, accelerators, retire }
      } catch (error) {
        retire()
        throw error
      }
    }

    let current = build(tree)
    // WinUI elements cannot have two parents. Detach before reparenting and
    // restore if installation fails. The content keeps its original Grid.Row.
    // We wrap it in its own grid rather than changing its attached properties.
    const content = new C.Grid()
    C.Grid.SetRow(content, 1)
    try {
      owner.Content = null
      content.Children.Append(previous)
      wrapper.Children.Append(current.bar)
      wrapper.Children.Append(content)
      for (const accelerator of current.accelerators) { wrapper.KeyboardAccelerators.Append(accelerator) }
      owner.Content = wrapper
    } catch (error) {
      current.retire()
      content.Children.Clear()
      owner.Content = previous
      throw error
    }
    return {
      update(next) {
        const replacement = build(next)
        wrapper.KeyboardAccelerators.Clear()
        wrapper.Children.SetAt(0, replacement.bar)
        for (const accelerator of replacement.accelerators) { wrapper.KeyboardAccelerators.Append(accelerator) }
        const old = current
        current = replacement
        old.retire()
      },
      dispose() {
        if (disposed) { return }
        disposed = true
        current.retire()
        wrapper.KeyboardAccelerators.Clear()
        wrapper.Children.Clear()
        content.Children.Clear()
        if (owner.Content === wrapper) { owner.Content = previous }
      },
    }
  },
}
