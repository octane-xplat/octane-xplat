import { registerGestureClass } from './gestures'
import type { ActionRegistration } from './action-store'
import type { Actions } from './actions'
import {
  NSApplication,
  NSMenu,
  NSMenuItem,
  NSObject,
  interop,
} from '@octane-xplat/platform/macos'

interface Dependencies {
  actions: Pick<Actions, 'allocate' | 'invokeAction'>
}

export type AppMenu = ReturnType<typeof createAppMenu>

// Leaf-owned menu description consumed from __xplatAppKit. Top-level nodes
// are submenus — the menu-bar titles. Selector items carry no JS callback:
// a nil target routes them down the responder chain (copy:, terminate: …).
export interface AppKitMenuItem {
  type: 'item'
  title: string
  keyEquivalent: string
  modifierMask: number
  enabled: boolean
  state: 0 | 1
  onSelect?: () => void
  selector?: string
}

export interface AppKitMenuSeparator {
  type: 'separator'
}

export interface AppKitMenuSubmenu {
  type: 'submenu'
  title: string
  children: readonly AppKitMenuNode[]
}

export type AppKitMenuNode = AppKitMenuItem | AppKitMenuSeparator | AppKitMenuSubmenu

export interface AppKitMenuHandle {
  update(nodes: readonly AppKitMenuNode[]): void
  dispose(): void
}

interface BuiltItem {
  action: ActionRegistration
  item: NSMenuItem
}

export function createAppMenu(deps: Dependencies) {
  // Same leaf convention as context menus — leaves reach AppKit through
  // __xplatAppKit, never macos-node-api directly.

  let menuActionTarget: any = null

  try {
    class AppMenuActionTarget extends NSObject {
      static ObjCExposedMethods = {
        'appMenuItemSelected:': { params: [NSMenuItem], returns: interop.types.void },
      }

      static {
        registerGestureClass(this)
      }

      appMenuItemSelected(sender: NSMenuItem) {
        deps.actions.invokeAction(sender.tag)
      }
    }

    menuActionTarget = AppMenuActionTarget.new()
  } catch (error) {
    console.error('[macos-leaf] app-menu target registration failed — application menus disabled', error)
  }

  function retireItems(created: BuiltItem[]) {
    for (const { action, item } of created) {
      action.release()
      try {
        item.target = null
        item.action = null as unknown as string
      } catch {}
    }
  }

  function buildMenu(
    node: AppKitMenuSubmenu,
    state: { active: boolean },
    created: BuiltItem[],
  ): NSMenu {
    const menu = NSMenu.alloc().init()
    menu.autoenablesItems = false
    for (const child of node.children) {
      if (child.type === 'separator') {
        menu.addItem(NSMenuItem.separatorItem())
        continue
      }
      if (child.type === 'submenu') {
        const item = NSMenuItem.alloc().initWithTitleActionKeyEquivalent(child.title, null, '')
        item.submenu = buildMenu(child, state, created)
        menu.addItem(item)
        continue
      }
      const item = NSMenuItem.alloc().initWithTitleActionKeyEquivalent(
        child.title,
        child.selector ?? 'appMenuItemSelected:',
        child.keyEquivalent,
      )
      item.keyEquivalentModifierMask = child.modifierMask
      item.enabled = child.enabled
      item.state = child.state
      const onSelect = child.selector ? undefined : child.onSelect
      if (onSelect) {
        item.target = menuActionTarget
        const action = deps.actions.allocate()
        created.push({ action, item })
        item.tag = action.id
        const disabled = !child.enabled
        action.setHandler(() => {
          if (!state.active || disabled) {
            return
          }
          const enabled = (item as any).isEnabled
          const nativeEnabled = typeof enabled === 'function' ? enabled.call(item) : enabled
          if (nativeEnabled === false || nativeEnabled === 0) {
            return
          }
          try {
            onSelect()
          } catch (error) {
            console.error('[macos-leaf] app-menu selection failed', error)
          }
        })
      } else {
        // Nil target — role selectors travel the responder chain.
        item.target = null
      }
      menu.addItem(item)
    }
    return menu
  }

  function buildBar(
    nodes: readonly AppKitMenuNode[],
    state: { active: boolean },
    created: BuiltItem[],
  ): NSMenu {
    const bar = NSMenu.alloc().init()
    bar.autoenablesItems = false
    for (const node of nodes) {
      if (node.type !== 'submenu') {
        // Contract: menu-bar entries are submenus.
        continue
      }
      const item = NSMenuItem.alloc().initWithTitleActionKeyEquivalent(node.title, null, '')
      item.submenu = buildMenu(node, state, created)
      bar.addItem(item)
    }
    return bar
  }

  function installApplicationMenu(
    nodes: readonly AppKitMenuNode[],
  ): AppKitMenuHandle | null {
    if (
      !menuActionTarget ||
      typeof NSMenu?.alloc !== 'function' ||
      typeof NSMenuItem?.alloc !== 'function'
    ) {
      return null
    }
    const app = NSApplication?.sharedApplication
    if (!app) {
      return null
    }

    const state = { active: true }
    const previous = app.mainMenu ?? null
    const current: { bar: NSMenu | null; created: BuiltItem[] } = { bar: null, created: [] }
    try {
      const bar = buildBar(nodes, state, current.created)
      app.mainMenu = bar
      current.bar = bar
    } catch {
      retireItems(current.created)
      try {
        if (app.mainMenu !== previous) {
          app.mainMenu = previous
        }
      } catch {}
      return null
    }

    return {
      update(next) {
        if (!state.active) {
          return
        }
        const built: BuiltItem[] = []
        let nextBar: NSMenu
        try {
          nextBar = buildBar(next, state, built)
          app.mainMenu = nextBar
        } catch (error) {
          retireItems(built)
          throw error
        }
        const old = current.created
        current.created = built
        current.bar = nextBar
        // Swap before retiring so a stale tag can never reach dead items.
        retireItems(old)
      },
      dispose() {
        if (!state.active) {
          return
        }
        state.active = false
        const old = current.created
        current.created = []
        retireItems(old)
        try {
          // Restore the prior menu bar only while ours is still installed.
          if (app.mainMenu === current.bar) {
            app.mainMenu = previous
          }
        } catch {}
      },
    }
  }

  return { installApplicationMenu }
}
