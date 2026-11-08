import Gtk from 'gi://Gtk?version=4.0'
import Gio from 'gi://Gio'
import GLib from 'gi://GLib'
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import { toGtk } from './accelerator.js'
import type { NormalizedActionable, NormalizedAppMenu, NormalizedEntry } from './model.js'
import type { AppMenuRole } from './shared.js'
import type { AppMenuDispatch, AppMenuHost, NativeAppMenu } from './host-types.js'

// Edit roles stay widget-owned: the menu item only shows the accelerator
// (registered on the item's `accel` attribute, never on the app) and
// activation forwards to the focused widget's built-in action.
const EDIT_ROLE_TARGETS = new Map<AppMenuRole, { widgetAction: string; accel: string }>([
  ['undo', { widgetAction: 'text.undo', accel: '<Control>z' }],
  ['redo', { widgetAction: 'text.redo', accel: '<Control><Shift>z' }],
  ['cut', { widgetAction: 'clipboard.cut', accel: '<Control>x' }],
  ['copy', { widgetAction: 'clipboard.copy', accel: '<Control>c' }],
  ['paste', { widgetAction: 'clipboard.paste', accel: '<Control>v' }],
  ['selectAll', { widgetAction: 'selection.select-all', accel: '<Control>a' }],
])

// Roles that act on the app/window directly. Their accelerators are real
// app-level registrations, so model.ts counts them in collision checks.
const WINDOW_ROLE_ACCELERATORS: Partial<Record<AppMenuRole, string>> = {
  close: '<Control>w',
  quit: '<Control>q',
}

let instanceCounter = 0

function application(): Gtk.Application | null {
  const app = Gio.Application.get_default()

  return app instanceof Gtk.Application ? app : null
}

function requireApplication(): Gtk.Application {
  const app = application()

  if (!app) {
    throw new UnavailabilityError('appMenu')
  }

  return app
}

/** GTK menu mnemonics treat `_` as an accelerator marker — escape it. */
function escapeLabel(label: string): string {
  return label.replace(/_/g, '__')
}

export const host: AppMenuHost = {
  platform: 'linux',
  supported() {
    try {
      return application() !== null
    } catch {
      return false
    }
  },
  defer(fn) {
    GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
      fn()
      return GLib.SOURCE_REMOVE
    })
  },
  install(tree: NormalizedAppMenu, dispatch: AppMenuDispatch) {
    const app = requireApplication()

    const previous = app.get_menubar()
    // Unique action names per applied tree let update() register the new
    // generation before retiring the old — the menubar never references a
    // removed action, and node ids restart at 1 in every normalized tree.
    const instance = ++instanceCounter

    function roleBehavior(role: AppMenuRole): void {
      if (role === 'quit') {
        app.quit()
        return
      }

      const window = app.get_active_window()

      if (role === 'close') {
        window?.close()
        return
      }

      if (role === 'minimize') {
        window?.minimize()
        return
      }

      const target = EDIT_ROLE_TARGETS.get(role)

      if (target) {
        window?.get_focus()?.activate_action(target.widgetAction, null)
      }
    }

    function registerAction(
      node: NormalizedActionable,
      generation: number,
      names: string[],
    ): string {
      const name = `xplat-menu-${instance}-${generation}-${node.id}`
      let action: Gio.SimpleAction

      if (node.kind === 'checkbox') {
        // Stateful so GMenu renders a checkmark; the 'activate' handler
        // reports the intent without touching state — `update()` owns it.
        action = Gio.SimpleAction.new_stateful(name, null, GLib.Variant.new_boolean(node.value))
      } else {
        action = Gio.SimpleAction.new(name, null)
      }

      action.connect('activate', () => {
        if (!dispatch(node.id, generation)) {
          return
        }

        if (node.kind === 'role') {
          roleBehavior(node.role)
        }
      })

      action.set_enabled(node.kind === 'role' ? true : !node.disabled)
      app.add_action(action)
      names.push(name)

      const accel =
        node.kind === 'role'
          ? WINDOW_ROLE_ACCELERATORS[node.role]
          : node.accelerator
            ? toGtk(node.accelerator)
            : undefined

      if (accel) {
        app.set_accels_for_action(`app.${name}`, [accel])
      }

      return name
    }

    function buildMenu(
      items: readonly NormalizedEntry[],
      generation: number,
      names: string[],
    ): Gio.Menu {
      const menu = new Gio.Menu()
      // Separators become GMenu sections — normalized trees already collapse
      // leading/trailing/repeated separators.
      const sections: Gio.Menu[] = [new Gio.Menu()]

      for (const node of items) {
        if (node.kind === 'separator') {
          sections.push(new Gio.Menu())
          continue
        }

        const section = sections[sections.length - 1]!

        if (node.kind === 'submenu') {
          section.append_submenu(escapeLabel(node.label), buildMenu(node.items, generation, names))
          continue
        }

        const name = registerAction(node, generation, names)
        const target = node.kind === 'role' ? EDIT_ROLE_TARGETS.get(node.role) : undefined

        if (target) {
          const item = Gio.MenuItem.new(escapeLabel(node.label), `app.${name}`)

          item.set_attribute_value('accel', GLib.Variant.new_string(target.accel))
          section.append_item(item)
        } else {
          section.append(escapeLabel(node.label), `app.${name}`)
        }
      }

      for (const section of sections) {
        menu.append_section(null, section)
      }

      return menu
    }

    function build(current: NormalizedAppMenu): { menu: Gio.Menu; names: string[] } {
      const names: string[] = []
      const menubar = new Gio.Menu()

      for (const submenu of current.menus) {
        menubar.append_submenu(
          escapeLabel(submenu.label),
          buildMenu(submenu.items, current.generation, names),
        )
      }

      return { menu: menubar, names }
    }

    function retire(old: { names: string[] }): void {
      for (const name of old.names) {
        app.set_accels_for_action(`app.${name}`, [])
        app.remove_action(name)
      }
    }

    let current: { menu: Gio.Menu; names: string[] } | null = build(tree)

    app.set_menubar(current.menu)

    const native: NativeAppMenu = {
      update(next) {
        const old = current!
        const built = build(next)

        app.set_menubar(built.menu)
        current = built
        retire(old)
      },
      dispose() {
        if (!current) {
          return
        }

        const old = current

        current = null
        // Restore the pre-install menubar only when ours is still installed.
        if (app.get_menubar() === old.menu) {
          app.set_menubar(previous)
        }

        retire(old)
      },
    }

    return native
  },
}
