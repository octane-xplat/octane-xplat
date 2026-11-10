import { Application, Page } from '@nativescript/core'
import { renderNativeScriptApp } from '@nativescript-community/octane'
import { storage } from '@octane-xplat/platform'
import { openWindow } from '@octane-xplat/ui'
import { appMenu } from '@octane-xplat/app-menu'
import { createTray, keepAppResident, type Tray } from '@octane-xplat/tray'
import { createGlobalShortcuts, type GlobalShortcuts } from '@octane-xplat/global-shortcuts'
import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
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
import { APP_VERSION, STATUS_SUFFIX } from './version'

// Windows entry for the desktop-shell journey. The packaged NativeScript
// WinUI host has no app-host package like runMacOSApp/runGtkApp: the entry
// mounts through renderNativeScriptApp and supplies secondary-window content
// through Application.setWindowContentResolver, which openWindow() requests
// reach on this host.

type Root = ReturnType<typeof renderNativeScriptApp>

const roots = new Set<Root>()

function mountPage(component: unknown): Page {
  const page = new Page()

  page.actionBarHidden = true
  roots.add(renderNativeScriptApp(page, component as never))
  return page
}

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
  marker(`INSPECTOR_OPENED id=w${inspectorCount$.getSnapshot()}`)

  void handle.closed.then(() => {
    inspectorOpen$.set(false)
    setInspectorHandle(null)
    marker('INSPECTOR_CLOSED')
  })
}

Application.setWindowContentResolver((request: { isPrimary?: boolean; data?: unknown }) => {
  if ((request.data as { window?: string } | undefined)?.window === 'inspector') {
    return mountPage(Inspector)
  }

  return undefined
})

let tray: Tray | null = null
let shortcuts: GlobalShortcuts | null = null
let menuHandle: { dispose(): void } | null = null
let residency: { release(): void } | null = null
let cleanedUp = false

function cleanup() {
  if (cleanedUp) {
    return
  }

  cleanedUp = true
  menuHandle?.dispose()
  shortcuts?.dispose()
  tray?.destroy()
  residency?.release()
  marker(
    `CLEANUP menu=${menuHandle ? 1 : 0} shortcuts=${shortcuts ? 1 : 0}` +
      ` tray=${tray ? 1 : 0} residency=${residency ? 1 : 0}`,
  )

  for (const root of roots) {
    root.unmount()
  }

  roots.clear()
}

Application.on(Application.exitEvent, cleanup)

// NativeWindow.close() refuses the primary window on this host, and the
// platform exposes no app-quit API, so quit closes the native WinUI window the
// way the title-bar close button does; core then raises `exit` once the last
// window is gone.
function nativeWindow(): { Close(): void; Activate(): void } | undefined {
  return (Application.primaryWindow as { windows?: { window?: { Close(): void; Activate(): void } } } | undefined)
    ?.windows?.window
}

function quit() {
  marker('QUIT_REQUESTED')
  inspectorHandle?.close()
  nativeWindow()?.Close()
}

async function setUpShell() {
  statusSuffix$.set(STATUS_SUFFIX)
  marker(`VERSION ${APP_VERSION}`)

  menuHandle = appMenu.supported
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
            // Windows-only second path to the Inspector: Windows 11 keeps a
            // new notification icon in the overflow flyout, where the runner
            // cannot aim OS input, so window lifecycle steps open it here.
            {
              type: 'action' as const,
              key: 'open-inspector',
              label: 'Open Inspector',
              onSelect: () => openInspector(),
            },
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

  try {
    residency = keepAppResident({ hideWindowsOnClose: false })
  } catch (error) {
    marker(`RESIDENT_ERROR ${error instanceof Error ? error.message : String(error)}`)
  }

  try {
    tray = await createTray({
      id: 'desktop-shell-journey',
      icon: { type: 'named', name: 'info' },
      title: 'Desktop Shell Journey',
      menu: TRAY_MENU.map((item) => ({ ...item, onSelect: () => openInspector() })),
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
        nativeWindow()?.Activate()
        marker('HOTKEY_FOCUS')
      },
    })

    marker(
      result.ok
        ? `HOTKEY_REGISTERED ${id} ${result.shortcut.trigger}`
        : `HOTKEY_ERROR ${id} ${result.error.code}`,
    )
  }

  // Windows storage loads its JSON snapshot asynchronously; this read runs
  // after the awaits above, and the runner records the read time so a race
  // is visible rather than hidden.
  const restored = storage.getString(STORAGE_KEY)

  if (restored) {
    name$.set(restored)
    marker(`RESTORED name=${restored}`)
  } else {
    marker('RESTORED none')
  }

  marker('READY')
}

const entry = {
  create() {
    const page = mountPage(App)

    setTimeout(() => {
      void setUpShell().catch((error) => marker(`SETUP_ERROR ${String(error)}`))
    }, 0)
    return page
  },
}

if (Application.started) {
  Application.resetRootView(entry)
} else {
  Application.run(entry)
}
