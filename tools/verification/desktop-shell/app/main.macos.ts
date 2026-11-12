import 'octane/signals'
import '@nativescript/macos-node-api'
import { runMacOSApp, setWindowContentResolver } from '@octane-xplat/macos-appkit/host'
import {
  NSApplication,
  NSProcessInfo,
  NSProtocolFromString,
  NSView,
  NativeClass,
  interop,
} from '@octane-xplat/platform/macos'

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
  ({ app, root, window }) => {
    root.render(App as any, {})
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

      const env = NSProcessInfo.processInfo?.environment

      if (String(env?.objectForKey?.('DESKTOP_SHELL_SELFTEST') ?? '') === '1') {
        void runSelftest(app, window)
      }
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

// Native-dispatch self-check for hosts where OS input is untrusted (skymac
// SSH): with DESKTOP_SHELL_SELFTEST=1 the app exercises the same integration
// seams a real input path hits — first-responder chain, NSMenu item actions,
// tray menu actions, window close, terminate — and reports SELFTEST markers.
// It performs no CGEvent/AX reads and changes nothing without the env var.

function findById(view: any, id: string, depth = 0): any {
  if (!view || depth > 8) {
    return null
  }

  if (String(view.accessibilityIdentifier ?? '') === id) {
    return view
  }

  const kids = view.subviews
  const n = kids?.count ?? kids?.length ?? 0

  for (let i = 0; i < n; i++) {
    const hit = findById(kids?.objectAtIndex ? kids.objectAtIndex(i) : kids?.[i], id, depth + 1)

    if (hit) {
      return hit
    }
  }

  return null
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function runSelftest(app: any, window: any) {
  await sleep(800)

  const content = window?.contentView
  const nameField = findById(content, 'journey-name')
  const submit = findById(content, 'journey-submit')
  const status = findById(content, 'journey-status')

  marker(
    `SELFTEST roles submit=${submit?.valueForKey?.('accessibilityRole')}` +
      ` status=${status?.valueForKey?.('accessibilityRole')}`,
  )

  // Class/identity discrimination: the ObjC class name tells whether the live
  // view is a JS-subclass instance (bridged/registered name) or a native view;
  // a second traversal tests whether wrappers are memoized per native object.
  const submit2 = findById(content, 'journey-submit')
  const chain: string[] = []

  for (let c: any = submit; c && chain.length < 8; c = c.superclass) {
    chain.push(String(c.className ?? c.name ?? c))
  }

  marker(
    `SELFTEST cls=${String(submit?.className ?? submit?.class?.() ?? '?')} ` +
      `ctor=${submit?.constructor?.name} same=${submit === submit2} ` +
      `eq=${submit?.isEqual?.(submit2)} chain=${chain.join('<')} ` +
      `xplatSel=${submit?.respondsToSelector?.('xplatAccessibleHost')} ` +
      `kvcRole=${submit?.valueForKey?.('accessibilityRole')}`,
  )

  // Dispatch discrimination: the imported NSView may be a lazy _bind Proxy
  // when this module evaluates; classes extending it register anonymous ObjC
  // classes with a bogus superclass and no JS dispatch. Compare the three
  // shapes side by side.
  try {
    const gNSView = (globalThis as any).NSView

    marker(`SELFTEST importedEqGlobal=${NSView === gNSView} gNSViewIsFn=${typeof gNSView}`)

    class P1 extends NSView {
      // @ts-ignore ObjC accessor methods satisfy the generated @property member.
      accessibilityRole() {
        return 'AXButton'
      }
      static ObjCExposedMethods = {
        xplatProbeMarker: { params: [], returns: interop.types.bool },
      }
      static {
        NativeClass(this)
      }
    }

    class P2 extends (globalThis as any).NSView {
      // @ts-ignore ObjC accessor methods satisfy the generated @property member.
      accessibilityRole() {
        return 'AXButton'
      }
      static ObjCExposedMethods = {
        xplatProbeMarker: { params: [], returns: interop.types.bool },
      }
      static {
        NativeClass(this)
      }
    }

    const makeP3Base = () =>
      class extends (globalThis as any).NSView {
        // @ts-ignore ObjC accessor methods satisfy the generated @property member.
        accessibilityRole() {
          return 'AXButton'
        }
        static ObjCExposedMethods = {
          xplatProbeMarker: { params: [], returns: interop.types.bool },
        }
        static ObjCProtocols = [NSProtocolFromString?.('NSAccessibilityButton')].filter(Boolean)
        static {
          NativeClass(this)
        }
      }

    const P3 = class extends makeP3Base() {
      static {
        NativeClass(this)
      }
    }

    for (const [label, C] of [
      ['P1', P1],
      ['P2', P2],
      ['P3', P3],
    ] as const) {
      const v: any = (C as any).alloc().init()

      marker(
        `SELFTEST ${label} cls=${String(v.className)} ` +
          `kvcRole=${v.valueForKey?.('accessibilityRole')} ` +
          `probeSel=${v.respondsToSelector?.('xplatProbeMarker')} ` +
          `jsRole=${v.accessibilityRole?.()}`,
      )
    }
  } catch (e) {
    marker(`SELFTEST probes fail ${String(e)}`)
  }

  // Tab path: native first-responder chain, minus the keyboard event.
  window.makeFirstResponder(nameField)
  window.selectNextKeyView(null)

  const fr = window.firstResponder

  marker(`SELFTEST focus=${fr?.accessibilityIdentifier ?? 'none'}`)

  // AXPress path: ObjC dispatch of accessibilityPerformPress.
  marker(`SELFTEST pressSel=${submit?.respondsToSelector?.('accessibilityPerformPress')}`)
  try {
    submit?.performSelector?.('accessibilityPerformPress')
    await sleep(300)
    marker('SELFTEST pressDispatched=true')
  } catch (e) {
    marker(`SELFTEST pressDispatched=false ${String(e)}`)
  }

  // App-menu path: invoke each menu item via NSMenu, as a real click would.
  try {
    const mainMenu = NSApplication.sharedApplication.mainMenu

    for (let i = 0; i < (mainMenu?.itemArray?.count ?? 0); i++) {
      const top = mainMenu.itemArray.objectAtIndex(i)
      const sub = top?.submenu

      if (!sub) {
        continue
      }

      for (let j = 0; j < (sub.itemArray?.count ?? 0); j++) {
        const it = sub.itemArray.objectAtIndex(j)

        if (String(it?.title) === 'Increment Counter') {
          sub.performActionForItemAtIndex(j)
          await sleep(200)
          sub.performActionForItemAtIndex(j)
          await sleep(200)
          marker('SELFTEST menu=invoked')
        }
      }
    }
  } catch (e) {
    marker(`SELFTEST menu=fail ${String(e)}`)
  }

  // Tray path: invoke the status item's menu like a real status-bar click.
  try {
    const item = (tray as any)?.item ?? (tray as any)?.statusItem
    const menu = item?.menu

    for (let j = 0; j < (menu?.itemArray?.count ?? 0); j++) {
      const it = menu.itemArray.objectAtIndex(j)

      if (String(it?.title) === 'Open Inspector') {
        menu.performActionForItemAtIndex(j)
        marker('SELFTEST tray=invoked')
      }
    }
  } catch (e) {
    marker(`SELFTEST tray=fail ${String(e)}`)
  }

  await sleep(600)

  // Window lifecycle: close the inspector with performClose:, reopen via the
  // tray menu, then press the inspector's close button.
  try {
    const wins: any = NSApplication.sharedApplication.windows

    for (let i = 0; i < (wins?.count ?? 0); i++) {
      const w = wins?.objectAtIndex?.(i)

      if (String(w?.title) === 'Inspector') {
        w.performClose?.(w)
        marker('SELFTEST lifecycle=closed')
      }
    }

    await sleep(500)

    const item2 = (tray as any)?.item ?? (tray as any)?.statusItem
    const menu2 = item2?.menu

    for (let j = 0; j < (menu2?.itemArray?.count ?? 0); j++) {
      if (String(menu2.itemArray.objectAtIndex(j)?.title) === 'Open Inspector') {
        menu2.performActionForItemAtIndex(j)
      }
    }

    await sleep(600)

    const wins2: any = NSApplication.sharedApplication.windows

    for (let i = 0; i < (wins2?.count ?? 0); i++) {
      const w = wins2?.objectAtIndex?.(i)

      if (String(w?.title) === 'Inspector') {
        const closeBtn = findById(w.contentView, 'inspector-close')

        closeBtn?.performSelector?.('accessibilityPerformPress')
        marker('SELFTEST lifecycle=reclosed')
      }
    }
  } catch (e) {
    marker(`SELFTEST lifecycle=fail ${String(e)}`)
  }

  await sleep(400)

  marker('SELFTEST quit=terminating')
  NSApplication.sharedApplication.terminate(null)
}
