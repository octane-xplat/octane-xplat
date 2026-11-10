import { runGtkApp, setWindowContentResolver } from '@octane-xplat/linux-gtk/host'
import { storage } from '@octane-xplat/platform'
import { openWindow } from '@octane-xplat/ui'
import { appMenu } from '@octane-xplat/app-menu'
import { createTray, keepAppResident, type Tray } from '@octane-xplat/tray'
import { createGlobalShortcuts, type GlobalShortcuts } from '@octane-xplat/global-shortcuts'
import App from './App.tsrx'
import Inspector from './Inspector.tsrx'
import {
  HOTKEY,
  HOTKEY_CONFLICT,
  HOTKEY_RESERVED,
  MENU_ITEMS,
  STORAGE_KEY,
  TRAY_MENU,
  inspectorCount$,
  inspectorHandle,
  inspectorOpen$,
  lastError$,
  marker,
  menuCount$,
  name$,
  setInspectorHandle,
  statusSuffix$,
} from './journey'
import { STATUS_SUFFIX } from './version'

const APP_ID = 'org.octane.xplat.shell-journey'

function openInspector() {
  if (inspectorHandle && !inspectorHandle.isClosed) {
    return
  }

  const handle = openWindow({
    data: { window: 'inspector' },
    title: 'Inspector',
    size: { width: 320, height: 160 },
  })

  if (!handle) {
    lastError$.set('openWindow returned null')
    marker('INSPECTOR_OPEN_FAIL')
    return
  }

  setInspectorHandle(handle as any)
  inspectorCount$.set(inspectorCount$.getSnapshot() + 1)
  inspectorOpen$.set(true)
  marker(`INSPECTOR_OPENED id=w${inspectorCount$.getSnapshot()}`)

  void handle.closed.then(() => {
    inspectorOpen$.set(false)
    setInspectorHandle(null)
    marker('INSPECTOR_CLOSED')
  })
}

setWindowContentResolver((data: unknown) => {
  if ((data as { window?: string } | undefined)?.window === 'inspector') {
    return Inspector
  }
})

let tray: Tray | null = null
let shortcuts: GlobalShortcuts | null = null

runGtkApp(
  {
    applicationId: APP_ID,
    title: 'Desktop Shell Journey',
    defaultWidth: 420,
    defaultHeight: 240,
  },
  ({ app, root, window }) => {
    root.render(App as any, {})
    statusSuffix$.set(STATUS_SUFFIX)

    // Input diagnostics for the journey runner behind DESKTOP_SHELL_DIAG=1:
    // real widget bounds in window coords + surface transform, and Tab
    // traversal visibility. Read-back markers only — no behavior change.
    const DIAG =
      (globalThis as any).imports?.gi?.GLib?.getenv?.('DESKTOP_SHELL_DIAG') === '1' ||
      (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
        ?.DESKTOP_SHELL_DIAG === '1'
    const findWidget = (node: any, name: string): any | null => {
      if (!node) return null
      if (node.get_name?.() === name) return node
      let c = node.get_first_child?.()
      while (c) {
        const hit = findWidget(c, name)
        if (hit) return hit
        c = c.get_next_sibling?.()
      }
      return null
    }
    const bounds = (id: string) => {
      if (!DIAG) return
      try {
        const w = findWidget(window, id)
        if (!w) return marker(`BOUNDS ${id} missing`)
        const [ok, rect] = w.compute_bounds(window)
        const t = window.get_native?.().get_surface_transform?.()
        const g = ok ? `${rect.origin.x},${rect.origin.y} ${rect.size.width}x${rect.size.height}` : 'no-bounds'
        marker(`BOUNDS ${id} ${g} xf=${t?.x ?? '?'},${t?.y ?? '?'}`)
      } catch (error) {
        marker(`BOUNDS ${id} error ${error}`)
      }
    }
    if (DIAG) {
      const GObject = (globalThis as any).imports?.gi?.GObject
      window.connect?.('notify::focus-widget', () => {
        const fw = (window as any).get_focus?.()
        if (!fw) {
          marker(`FOCUS none (root.get_focus()=null)`)
          return
        }
        const name = fw.get_name?.() || ''
        const gtype = GObject?.type_name?.(fw) ?? 'widget'
        marker(`FOCUS ${name || gtype}${name ? ' ' + gtype : ''}`)
      })
      // Exposed for the runner: dump the submit button's ancestor chain with
      // the flags GTK's traversal actually checks.
      ;(globalThis as any).__journeyFocusChain = () => {
        const b = findWidget(window, 'journey-submit')
        if (!b) return marker('CHAIN missing')
        const parts: string[] = []
        for (let w = b; w; w = w.get_parent?.()) {
          parts.push(
            `${GObject?.type_name?.(w) ?? '?'}|f=${w.get_focusable?.() ? 1 : 0}|c=${w.get_can_focus?.() ? 1 : 0}|s=${w.is_sensitive?.() ? 1 : 0}|t=${w.get_can_target?.() ? 1 : 0}|v=${w.get_visible?.() ? 1 : 0}|m=${w.get_mapped?.() ? 1 : 0}`,
          )
        }
        marker(`CHAIN ${parts.join(' > ')}`)
      }
      ;(globalThis as any).__journeyFocusChain()

      // BOUNDS for widgets in secondary windows (the Inspector's own Close
      // button) — searched across all toplevels, emitted once per window.
      const Gtk = (globalThis as any).imports?.gi?.Gtk
      const GLib = (globalThis as any).imports?.gi?.GLib
      const seen = new Map<string, any>()
      GLib?.timeout_add?.(GLib.PRIORITY_DEFAULT, 500, () => {
        const tl = Gtk?.Window?.get_toplevels?.()
        const n = tl?.get_n_items?.() ?? 0
        for (const id of ['inspector-close']) {
          let found: any = null
          for (let i = 0; i < n; i++) {
            found = findWidget(tl.get_item(i), id)
            if (found) break
          }
          if (found && !seen.has(id)) {
            seen.set(id, found)
            const root = found.get_root?.()
            const [ok, rect] = root ? found.compute_bounds(root) : [false, null]
            marker(
              ok
                ? `BOUNDS ${id} ${rect.origin.x},${rect.origin.y} ${rect.size.width}x${rect.size.height}`
                : `BOUNDS ${id} no-bounds`,
            )
          } else if (!found && seen.has(id)) {
            seen.delete(id)
          }
        }
        return true
      })
    }
    const restored = storage.getString(STORAGE_KEY)

    if (restored) {
      name$.set(restored)
      marker(`RESTORED name=${restored}`)
    }

    const quit = () => {
      marker('QUIT_REQUESTED')
      app.quit()
    }

    const menuHandle = appMenu.supported
      ? appMenu.install(
          MENU_ITEMS.map((menu) => ({
            ...menu,
            items: [
              ...menu.items.map((item) => ({
                ...item,
                onSelect: () => {
                  const count = menuCount$.getSnapshot() + 1

                  menuCount$.set(count)
                  marker(`MENU action=${item.key} count=${count}`)
                },
              })),
              {
                type: 'action' as const,
                key: 'quit',
                label: 'Quit',
                accelerator: 'Mod+Q',
                onSelect: quit,
              },
            ],
          })),
        )
      : null

    if (!menuHandle) {
      marker('MENU_UNSUPPORTED')
    }

    let residency: { release(): void } | null = null

    try {
      residency = keepAppResident({ hideWindowsOnClose: false })
    } catch (error) {
      marker(
        `RESIDENT_ERROR ${error instanceof Error && 'code' in error ? String((error as { code: string }).code) : String(error)}`,
      )
    }

    let menuDisposed = false
    let shortcutsDisposed = false
    let trayDestroyed = false
    let residencyReleased = false

    void (async () => {
      try {
        tray = await createTray({
          id: 'desktop-shell-journey',
          icon: { type: 'named', name: 'star.fill' },
          title: 'J',
          menu: TRAY_MENU.map((item) => ({
            ...item,
            onSelect: () => openInspector(),
          })),
        })
        marker('TRAY_OK')
      } catch (error) {
        marker(`TRAY_ERROR ${error instanceof Error ? error.message : String(error)}`)
      }

      shortcuts = createGlobalShortcuts({ appId: APP_ID })

      for (const [id, accelerator] of [
        ['focus-app', HOTKEY],
        ['conflict-probe', HOTKEY_CONFLICT],
        ['reserved-probe', HOTKEY_RESERVED],
      ] as const) {
        const result = await shortcuts.register({
          id,
          accelerator,
          description: `desktop-shell ${id}`,
          onPress: () => {
            window.present()
            marker(`HOTKEY_FOCUS active=${window.is_active ? 'true' : 'false'}`)
          },
        })

        if (result.ok) {
          marker(`HOTKEY_REGISTERED ${id} ${result.shortcut.trigger}`)
        } else {
          lastError$.set(`${id}: ${result.error.code}`)
          marker(`HOTKEY_ERROR ${id} ${result.error.code}`)
        }
      }

      marker('READY')
      bounds('journey-name')
      bounds('journey-submit')
      if (DIAG) {
        let painted = false
        window.get_frame_clock?.().connect?.('after-paint', () => {
          if (painted) return
          painted = true
          bounds('journey-name')
          bounds('journey-submit')
        })
      }

      // DESKTOP_SHELL_DIAG_OPEN=timeout opens the Inspector from a GLib
      // timeout instead of inside the dbusmenu Event handler — bisects the
      // BadDrawable crash between the D-Bus-callback context and openWindow.
      if (
        (globalThis as any).imports?.gi?.GLib?.getenv?.('DESKTOP_SHELL_DIAG_OPEN') === 'timeout'
      ) {
        const GLib = (globalThis as any).imports.gi.GLib
        GLib.timeout_add(GLib.PRIORITY_DEFAULT, 3000, () => {
          openInspector()
          return false
        })
      }
    })()

    return () => {
      // Mount cleanup: dispose menu/shortcuts/tray/residency exactly once on
      // Gtk.Application shutdown — same contract as runMacOSApp's cleanup.
      if (menuHandle && !menuDisposed) {
        menuDisposed = true
        menuHandle.dispose()
      }
      if (shortcuts && !shortcutsDisposed) {
        shortcutsDisposed = true
        shortcuts.dispose()
      }
      if (tray && !trayDestroyed) {
        trayDestroyed = true
        tray.destroy()
      }
      if (residency && !residencyReleased) {
        residencyReleased = true
        residency.release()
      }
      marker(
        `CLEANUP menu=${menuDisposed ? 1 : 0} shortcuts=${shortcutsDisposed ? 1 : 0}` +
          ` tray=${trayDestroyed ? 1 : 0} residency=${residencyReleased ? 1 : 0}`,
      )
    }
  },
)
