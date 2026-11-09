import '@nativescript/macos-node-api'
import { runMacOSApp, setWindowContentResolver } from '@octane-xplat/macos-appkit/host'
import { NSApplication } from '@octane-xplat/platform/macos'
import { storage } from '@octane-xplat/platform'
import { openWindow } from '@octane-xplat/ui'
import { appMenu } from '@octane-xplat/app-menu'
import { createTray, keepAppResident, type Tray } from '@octane-xplat/tray'
import {
  createGlobalShortcuts,
  type GlobalShortcuts,
} from '@octane-xplat/global-shortcuts'
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

  setInspectorHandle(handle)
  inspectorCount$.set(inspectorCount$.getSnapshot() + 1)
  inspectorOpen$.set(true)
  marker(`INSPECTOR_OPENED id=${handle.id}`)

  void handle.closed.then(() => {
    inspectorOpen$.set(false)
    setInspectorHandle(null)
    marker('INSPECTOR_CLOSED')
  })
}

setWindowContentResolver((data) => {
  if ((data as { window?: string } | undefined)?.window === 'inspector') {
    return Inspector
  }
})

let tray: Tray | null = null
let shortcuts: GlobalShortcuts | null = null

runMacOSApp(
  {
    title: 'Desktop Shell Journey',
    size: { width: 420, height: 240 },
    terminateAfterLastWindowClosed: false,
  },
  ({ app, root }) => {
    root.render(App as Parameters<typeof root.render>[0])
    statusSuffix$.set(STATUS_SUFFIX)
    const restored = storage.getString(STORAGE_KEY)

    if (restored) {
      name$.set(restored)
      marker(`RESTORED name=${restored}`)
    }

    const menuHandle = appMenu.supported
      ? appMenu.install(
          MENU_ITEMS.map((menu) => ({
            ...menu,
            items: menu.items.map((item) => ({
              ...item,
              onSelect: () => {
                const count = menuCount$.getSnapshot() + 1

                menuCount$.set(count)
                marker(`MENU action=${item.key} count=${count}`)
              },
            })),
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

      shortcuts = createGlobalShortcuts()

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
            app.activateIgnoringOtherApps(true)
            marker(`HOTKEY_FOCUS active=${NSApplication.sharedApplication.isActive}`)
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
      if (!menuDisposed && menuHandle) {
        menuDisposed = true
        menuHandle.dispose()
      }
      if (!shortcutsDisposed && shortcuts) {
        shortcutsDisposed = true
        void shortcuts.dispose()
      }
      if (!trayDestroyed && tray) {
        trayDestroyed = true
        tray.destroy()
      }
      if (!residencyReleased && residency) {
        residencyReleased = true
        residency.release()
      }
      marker(
        `CLEANUP menu=${menuDisposed ? 1 : 0} shortcuts=${shortcutsDisposed ? 1 : 0} tray=${trayDestroyed ? 1 : 0} residency=${residencyReleased ? 1 : 0}`,
      )
    }
  },
)


