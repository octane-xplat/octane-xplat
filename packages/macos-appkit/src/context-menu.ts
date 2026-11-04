import { registerGestureClass } from './gestures'
import type { Actions } from './actions'
import { NSMenu, NSMenuItem, NSView, NSObject, interop } from '@octane-xplat/platform/macos'
import type { ContextMenuOptions } from './model'

interface Dependencies {
  actions: Pick<Actions, 'actionHandlers' | 'nextActionId' | 'invokeAction'>
}

export type ContextMenu = ReturnType<typeof createContextMenu>

export function createContextMenu(deps: Dependencies) {
  // Leaf-native controls for the @octane-xplat leaf packages (context-menu,
  // date-picker, sheet). Same convention as the pointer-intent plumbing —
  // leaves reach AppKit through __xplatAppKit, never macos-node-api directly.

  let menuActionTarget: any = null

  try {
    class MenuActionTarget extends NSObject {
      static ObjCExposedMethods = {
        'menuItemSelected:': { params: [NSMenuItem], returns: interop.types.void },
      }

      static {
        registerGestureClass(this)
      }

      menuItemSelected(sender: NSMenuItem) {
        deps.actions.invokeAction(sender.tag)
      }
    }

    menuActionTarget = MenuActionTarget.new()
  } catch (error) {
    console.error('[macos-leaf] menu target registration failed — context menus disabled', error)
  }

  const contextMenuAttachments = new WeakMap<NSMenu, { active: boolean; previous: NSMenu | null }>()

  /** Attach at the wrapper only. Unhandled right-clicks follow AppKit's responder
   * chain; descendant editing/nested menus retain their own menus, including views
   * mounted later. Custom native responder behavior still needs OS qualification. */
  function attachContextMenu(
    view: NSView,
    options: ContextMenuOptions,
    onSelect: (id: string | undefined) => void,
  ) {
    if (
      !view ||
      !menuActionTarget ||
      typeof NSMenu?.alloc !== 'function' ||
      typeof NSMenuItem?.alloc !== 'function'
    ) {
      return null
    }

    let menu: NSMenu
    try {
      menu = NSMenu.alloc().init()
    } catch {
      return null
    }
    if (!menu) {
      return null
    }
    const state = { active: true, previous: null as NSMenu | null }
    contextMenuAttachments.set(menu, state)
    const created: { id: number; item: NSMenuItem }[] = []
    let selecting = false
    const detach = () => {
      if (!state.active) {
        return
      }
      state.active = false
      for (const { id, item } of created) {
        deps.actions.actionHandlers.delete(id)
        try {
          item.target = null
          item.action = null as unknown as string
        } catch {}
      }
      try {
        menu.cancelTracking()
      } catch {}
      try {
        if (view.menu === menu) {
          let previous = state.previous
          while (previous) {
            const prior = contextMenuAttachments.get(previous)
            if (!prior || prior.active) {
              break
            }

            previous = prior.previous
          }

          view.menu = previous as NSMenu
        }
      } catch {}
    }
    try {
      menu.autoenablesItems = false
      state.previous = view.menu ?? null
      for (const item of options?.items ?? []) {
        // The shared item contract renders the divider AND the item's own row —
        // a divider marks the row before it, not a separator-only item.
        if (item?.divider) {
          menu.addItem(NSMenuItem.separatorItem())
        }

        const menuItem = NSMenuItem.alloc().initWithTitleActionKeyEquivalent(
          String(item?.title ?? ''),
          'menuItemSelected:',
          '',
        )

        menuItem.target = menuActionTarget
        const disabled = !!item?.disabled
        menuItem.enabled = !disabled

        const actionId = deps.actions.nextActionId++
        menuItem.tag = actionId
        const id = item?.id
        created.push({ id: actionId, item: menuItem })
        deps.actions.actionHandlers.set(actionId, () => {
          if (!state.active || selecting || disabled || view.menu !== menu || !view.window) {
            return
          }
          const enabled = (menuItem as any).isEnabled
          const nativeEnabled = typeof enabled === 'function' ? enabled.call(menuItem) : enabled
          if (nativeEnabled === false || nativeEnabled === 0) {
            return
          }
          selecting = true
          try {
            onSelect?.(id)
          } catch {
            console.error('[macos-leaf] context-menu selection failed')
          } finally {
            selecting = false
          }
        })

        menu.addItem(menuItem)
      }

      view.menu = menu
      return detach
    } catch {
      detach()
      return null
    }
  }
  return {
    attachContextMenu,
  }
}
