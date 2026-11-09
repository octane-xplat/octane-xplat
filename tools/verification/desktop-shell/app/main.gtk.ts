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
