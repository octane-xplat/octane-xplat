import 'octane/signals'
import { Application, Page } from '@nativescript/core'
import { renderNativeScriptApp } from '@octane-xplat/nativescript-octane'
import { storage } from '@octane-xplat/platform'
import {
  app,
  appMenu,
  createTray,
  keepAppResident,
  windows,
  type Tray,
  createGlobalShortcuts,
  type GlobalShortcuts,
} from '@octane-xplat/desktop'
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
  marker,
  menuCount$,
  name$,
  openInspector,
  statusSuffix$,
} from './journey'

import { APP_VERSION, STATUS_SUFFIX } from './version'

// Windows entry for the desktop-shell journey. The packaged NativeScript
// WinUI host has no app-host package like runMacOSApp/runGtkApp: the entry
// mounts through renderNativeScriptApp and supplies secondary-window content
// through Application.setWindowContentResolver.

type Root = ReturnType<typeof renderNativeScriptApp>

const roots = new Set<Root>()

function mountPage(component: unknown, secondary = false): Page {
  const page = new Page()

  page.actionBarHidden = true
  const root = renderNativeScriptApp(page, component as never)
  roots.add(root)
  if (secondary) {
    const unmount = () => {
      page.off('unloaded', unmount)
      if (roots.delete(root)) {
        root.unmount()
      }
    }
    page.on('unloaded', unmount)
  }
  return page
}

Application.setWindowContentResolver((request: { isPrimary?: boolean; data?: unknown }) => {
  if ((request.data as { window?: string } | undefined)?.window === 'inspector') {
    return mountPage(Inspector, true)
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

function nativeWindow(): { Activate(): void } | undefined {
  return (
    Application.primaryWindow as { windows?: { window?: { Activate(): void } } } | undefined
  )?.windows?.window
}

function quit() {
  marker('QUIT_REQUESTED')
  app.quit()
}

const mainVeto = (event: { preventDefault(): void }) => {
  event.preventDefault()
  marker('MAIN_CLOSE_VETOED')
}

function armMainVeto() {
  windows.getAllWindows()[0]?.on('close', mainVeto)
  marker('MAIN_VETO_ARMED')
}

function disarmMainVeto() {
  windows.getAllWindows()[0]?.off('close', mainVeto)
  marker('MAIN_VETO_DISARMED')
}

function fail(label: string): never {
  throw new Error(label)
}

async function waitFor(probe: () => boolean, label: string) {
  for (let attempt = 0; attempt < 60; attempt++) {
    if (probe()) {
      return
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 50))
  }
  fail(label)
}

/** Window-state self-test on the public API: getAllWindows/getFocusedWindow,
 *  move/resize/maximize events, maximize/minimize state, and the main-window
 *  close veto on close() and app.quit(). Runs before READY so the driver can
 *  assert the WINDOW_STATE_OK marker. */
async function verifyWindowState() {
  const main = windows.getAllWindows()[0]
  if (!main || main.isClosed) fail('getAllWindows has no live main window')
  if (windows.getAllWindows()[0] !== main) fail('the main-window handle is not stable')
  if (!main.supportsBounds) fail('WinUI main window lacks bounds support')

  const inspector = windows.open({ data: { window: 'inspector' }, title: 'State Inspector' })
  try {
    const listed = windows.getAllWindows()
    if (listed[0] !== main || listed[listed.length - 1] !== inspector) {
      fail('getAllWindows ordering is not main-first')
    }

    inspector.focus()
    await waitFor(() => windows.getFocusedWindow() === inspector, 'focused Inspector not reported')
    main.focus()
    await waitFor(() => windows.getFocusedWindow() === main, 'focused main window not reported')
  } finally {
    inspector.destroy()
    await inspector.closed
  }
  if (windows.getAllWindows().includes(inspector)) fail('getAllWindows kept a closed window')

  let vetoes = 0
  const veto = (event: { preventDefault(): void }) => {
    vetoes++
    event.preventDefault()
  }
  main.on('close', veto)
  main.close()
  if (main.isClosed || vetoes !== 1) fail('main-window close() ignored the veto')
  app.quit()
  if (main.isClosed || vetoes !== 2 || !app.isReady()) fail('main-window veto did not cancel app.quit()')
  main.off('close', veto)

  let moves = 0
  let resizes = 0
  let maximizedEvents = 0
  let unmaximizedEvents = 0
  main
    .on('move', () => moves++)
    .on('resize', () => resizes++)
    .on('maximize', () => maximizedEvents++)
    .on('unmaximize', () => unmaximizedEvents++)

  const bounds = main.getBounds()
  main.setBounds({ x: bounds.x + 24, y: bounds.y + 12, width: bounds.width + 40, height: bounds.height + 16 })
  await waitFor(() => moves > 0 && resizes > 0, 'setBounds emitted no move/resize')
  main.setBounds(bounds)

  main.maximize()
  await waitFor(() => main.isMaximized(), 'maximize did not update isMaximized')
  if (maximizedEvents !== 1) fail(`expected one maximize event, got ${maximizedEvents}`)
  main.unmaximize()
  await waitFor(() => !main.isMaximized(), 'unmaximize did not update isMaximized')
  if (unmaximizedEvents !== 1) fail(`expected one unmaximize event, got ${unmaximizedEvents}`)

  main.minimize()
  await waitFor(() => main.isMinimized(), 'minimize did not update isMinimized')
  main.restore()
  await waitFor(() => !main.isMinimized(), 'restore did not update isMinimized')
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
              key: 'arm-veto',
              label: 'Arm Main Veto',
              onSelect: armMainVeto,
            },
            {
              type: 'action' as const,
              key: 'disarm-veto',
              label: 'Disarm Main Veto',
              onSelect: disarmMainVeto,
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

  try {
    await verifyWindowState()
    marker('WINDOW_STATE_OK')
  } catch (error) {
    marker(`WINDOW_STATE_FAIL ${error instanceof Error ? error.message : String(error)}`)
  }

  marker('READY')
}

const entry = {
  create() {
    const page = mountPage(App)

    void app.whenReady().then(setUpShell).catch((error) => marker(`SETUP_ERROR ${String(error)}`))

    return page
  },
}

if (Application.started) {
  Application.resetRootView(entry)
} else {
  Application.run(entry)
}
