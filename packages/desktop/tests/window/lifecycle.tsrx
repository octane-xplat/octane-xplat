// @jsxImportSource @octane-xplat/jsx
import {
  app,
  windows,
  type DesktopBeforeQuitEvent,
  type DesktopRectangle,
  type DesktopWindow,
  type DesktopWindowCloseEvent,
} from '@octane-xplat/desktop'
import { useLayoutEffect } from 'octane'

let contentMounts = 0
let contentUnmounts = 0

export function Inspector() {
  useLayoutEffect(() => {
    contentMounts++
    return () => {
      contentUnmounts++
    }
  }, [])

  return null
}

function check(condition: unknown, label: string): asserts condition {
  if (!condition) {
    throw new Error(label)
  }
}

export async function verifyWindowLifecycle(readWindow: () => {
  requestClose(): void
  title(): string
  visible(): boolean
}, verifyDialog?: (owner: DesktopWindow) => Promise<void>) {
  check(windows.supported, 'secondary windows are supported')
  let current: DesktopWindow | undefined
  const openInspector = () => {
    if (current && !current.isClosed) {
      current.show()
    } else {
      current = windows.open({ title: 'Inspector', data: { screen: 'inspector' } })
    }
    return current
  }

  const inspector = openInspector()
  const native = readWindow()

  check(contentMounts === 1, 'secondary root mounted')
  check(!inspector.isClosed, 'new window is open')
  check(inspector.isVisible() && native.visible(), 'new window is shown')
  check(openInspector() === inspector, 'Open Inspector twice returns the same handle')

  let hiddenCloseRequests = 0
  const onHiddenClose = () => hiddenCloseRequests++
  inspector.on('close', onHiddenClose)
  inspector.hide()
  check(!inspector.isVisible() && !native.visible(), 'hide changed native visibility')
  inspector.focus()
  check(!inspector.isVisible() && !native.visible(), 'focus left a hidden window hidden')
  check(openInspector() === inspector, 'Open Inspector shows the same hidden window')
  inspector.focus()
  check(inspector.isVisible() && native.visible(), 'show restored the existing window')
  check(
    !inspector.isClosed && contentMounts === 1 && contentUnmounts === 0 && hiddenCloseRequests === 0,
    'hide and show preserve content and skip close handlers',
  )
  inspector.off('close', onHiddenClose)

  await verifyDialog?.(inspector)

  inspector.setTitle('Updated inspector')
  check(native.title() === 'Updated inspector', 'title reached the native window')

  let requests = 0
  const veto = (event: { preventDefault(): void }) => {
    requests++
    event.preventDefault()
  }
  let closedEvents = 0

  inspector.on('close', veto).on('closed', () => {
    check(inspector.isClosed && contentUnmounts === 1, 'closed follows root disposal')
    closedEvents++
  })

  inspector.close()
  check(!inspector.isClosed && requests === 1, 'programmatic close honors veto')
  native.requestClose()
  check(!inspector.isClosed && Number(requests) === 2, 'native close honors veto')
  check(contentUnmounts === 0, 'veto leaves root mounted')

  inspector.off('close', veto).close()
  await inspector.closed
  check(inspector.isClosed && Number(contentUnmounts) === 1, 'accepted close unmounts once')
  check(closedEvents === 1, 'accepted close publishes closed')
  check(!inspector.supportsBounds, 'closed window has no bounds capability')
  check(!inspector.isVisible(), 'closed window is not visible')

  for (const action of ['show', 'hide', 'focus', 'minimize', 'restore'] as const) {
    let refused = false
    try {
      inspector[action]()
    } catch {
      refused = true
    }
    check(refused, `${action} refuses a closed window`)
  }

  const forced = openInspector()
  check(forced !== inspector, 'Open Inspector creates a fresh window after close')
  forced.on('close', veto)
  forced.destroy()
  await forced.closed
  check(forced.isClosed && Number(contentUnmounts) === 2, 'destroy unmounts a second window')
  check(Number(requests) === 2, 'destroy skips close listeners')

  console.log('DESKTOP_WINDOW_OK')
}

export function beforeAppStarts(): Promise<void> {
  check(app.supported && !app.isReady(), 'host lifecycle installed before startup')
  return app.whenReady()
}

function expectUnavailable(run: () => unknown, feature: string) {
  let error: unknown
  try {
    run()
  } catch (caught) {
    error = caught
  }
  check(
    error instanceof Error && error.name === 'UnavailabilityError' && error.message.includes(feature),
    `${feature} reports UnavailabilityError`,
  )
}

/** Native-side knobs a fixture supplies so the shared checks can wait on the
 *  host's event loop and trigger a real native close request on the main window. */
export interface WindowStateHarness {
  /** Resolve after `milliseconds` on the host's UI loop. */
  wait(milliseconds: number): Promise<void>
  /** Deliver a native close request (AppKit performClose, GTK window.close). */
  requestNativeClose(): void
  /** The host reports and changes outer-frame bounds (false on GTK). */
  supportsBounds: boolean
  /** Points of rounding slack when comparing restored bounds — AppKit
   *  frame conversion can round a fractional point, Windows is exact. */
  boundsTolerance?: number
  /** The window manager honors maximize requests (false under Xvfb). */
  maximizes: boolean
  /** The host reports minimized state (false on GTK). */
  reportsMinimized: boolean
  /** Whether this environment can activate the app at all — headless harnesses
   *  (the Devin agent session, a window-manager-less Xvfb) cannot produce a
   *  focused window, so the focus checks are skipped with a marker instead. */
  canFocus?(): boolean
  /** Optional native diagnostic appended to focus-check failures. */
  focusDetails?(): string
}

export async function verifyAppWindowState(harness: WindowStateHarness) {
  const { wait } = harness

  async function until(probe: () => boolean, label: string) {
    for (let attempt = 0; attempt < 60; attempt++) {
      if (probe()) {
        return
      }
      await wait(50)
    }
    const detail = harness.focusDetails?.()
    check(false, detail ? `${label} (${detail})` : label)
  }

  const main = windows.getAllWindows()[0]
  check(main && !main.isClosed, 'getAllWindows lists the live main window first')
  check(windows.getAllWindows()[0] === main, 'the main-window handle is stable')

  const tolerance = harness.boundsTolerance ?? 0
  const boundsEqual = (a: DesktopRectangle, b: DesktopRectangle) =>
    Math.abs(a.x - b.x) <= tolerance &&
    Math.abs(a.y - b.y) <= tolerance &&
    Math.abs(a.width - b.width) <= tolerance &&
    Math.abs(a.height - b.height) <= tolerance

  const probe = windows.open({ title: 'State probe' })
  try {
    const listed = windows.getAllWindows()
    check(
      listed[listed.length - 1] === probe && listed[0] === main,
      'getAllWindows appends opened windows after the main window',
    )

    if (harness.canFocus?.() ?? true) {
      probe.focus()
      await until(
        () => windows.getFocusedWindow() === probe,
        'getFocusedWindow returns the focused secondary window',
      )
      main.focus()
      await until(
        () => windows.getFocusedWindow() === main,
        'getFocusedWindow returns the focused main window',
      )
    } else {
      console.log('DESKTOP_STATE_FOCUS_UNVERIFIED')
    }

    // State transitions run on the main window itself and again on a fresh
    // secondary — the probe covers the same code path for created windows.
    async function verifyMaximize(target: DesktopWindow, label: string) {
      let maximizedEvents = 0
      let unmaximizedEvents = 0
      target
        .on('maximize', () => maximizedEvents++)
        .on('unmaximize', () => unmaximizedEvents++)

      if (harness.maximizes) {
        const before = harness.supportsBounds ? target.getBounds() : undefined
        check(!target.isMaximized(), `${label} starts unmaximized`)
        target.maximize()
        await until(() => target.isMaximized(), `${label} maximize() updates isMaximized`)
        check(maximizedEvents === 1, `${label} maximize event fires on the transition`)
        target.unmaximize()
        await until(() => !target.isMaximized(), `${label} unmaximize() updates isMaximized`)
        check(
          maximizedEvents === 1 && unmaximizedEvents === 1,
          `${label} unmaximize fires on the transition`,
        )
        if (before) {
          await until(
            () => boundsEqual(target.getBounds(), before),
            `${label} unmaximize restores the recorded frame`,
          )
        }
      } else {
        // No window manager to honor the request — exercise the calls and the
        // notify-based observation without asserting a state change.
        target.maximize()
        target.unmaximize()
        await wait(200)
      }
    }

    await verifyMaximize(main, 'the main window')
    await verifyMaximize(probe, 'the window')

    if (harness.reportsMinimized) {
      check(!probe.isMinimized(), 'the window starts unminimized')
      probe.minimize()
      await until(() => probe.isMinimized(), 'minimize() updates isMinimized')
      probe.restore()
      await until(() => !probe.isMinimized(), 'restore() updates isMinimized')
    } else {
      expectUnavailable(() => probe.isMinimized(), 'DesktopWindow.isMinimized')
    }
  } finally {
    probe.destroy()
    await probe.closed
  }
  check(!windows.getAllWindows().includes(probe), 'getAllWindows drops closed windows')

  let vetoes = 0
  const veto = (event: { preventDefault(): void }) => {
    vetoes++
    event.preventDefault()
  }
  main.on('close', veto)
  main.close()
  check(!main.isClosed && vetoes === 1, 'main-window close() honors the close veto')
  harness.requestNativeClose()
  check(!main.isClosed && vetoes === 2, 'main-window native close honors the close veto')
  app.quit()
  check(!main.isClosed && vetoes === 3 && app.isReady(), 'the main-window veto cancels app.quit()')
  main.off('close', veto)

  let moves = 0
  let resizes = 0
  if (harness.supportsBounds) {
    check(main.supportsBounds, 'the main window advertises bounds support')
    main.on('move', () => moves++)
    main.on('resize', () => resizes++)

    const bounds = main.getBounds()
    main.setBounds({ x: bounds.x + 24, y: bounds.y + 12, width: bounds.width + 40, height: bounds.height + 16 })
    await until(() => moves > 0 && resizes > 0, 'programmatic setBounds emits move and resize')
    main.setBounds(bounds)
    await until(
      () => boundsEqual(main.getBounds(), bounds),
      'setBounds restores the original, smaller frame',
    )
  } else {
    check(!main.supportsBounds, 'a bounds-less host reports supportsBounds false')
    expectUnavailable(() => main.on('move', () => {}), 'DesktopWindow.move')
    expectUnavailable(() => main.on('resize', () => {}), 'DesktopWindow.resize')
    expectUnavailable(() => main.getBounds(), 'DesktopWindow.getBounds')
  }

  console.log('DESKTOP_STATE_OK')
}

export async function verifyAppLifecycle(requestNativeQuit: () => void) {
  check(app.isReady(), 'ready after host startup')
  const unmountsBefore = contentUnmounts
  const main = windows.getAllWindows()[0]
  check(main && !main.isClosed, 'the main window is listed before quit')
  const first = windows.open({ title: 'First editor' })
  const second = windows.open({ title: 'Second editor' })
  let closeRequests = 0
  first.on('close', () => {
    closeRequests++
  })

  const cancelQuit = (event: DesktopBeforeQuitEvent) => {
    app.quit() // Reentrant requests must not dispatch a second event.
    event.preventDefault()
  }

  app.on('before-quit', cancelQuit)
  requestNativeQuit()
  check(!first.isClosed && !second.isClosed && closeRequests === 0, 'before-quit runs before window guards')
  app.off('before-quit', cancelQuit)

  const cancelClose = (event: DesktopWindowCloseEvent) => event.preventDefault()
  second.on('close', cancelClose)
  app.quit()
  check(!first.isClosed && !second.isClosed && Number(closeRequests) === 1, 'window veto keeps both editors open')
  second.off('close', cancelClose)

  let closed = 0
  for (const window of [first, second]) {
    window.on('closed', () => closed++)
  }

  app.quit()

  let refusedNewWindow = false
  try {
    windows.open({ title: 'Too late to open' })
  } catch {
    refusedNewWindow = true
  }
  check(refusedNewWindow, 'approved quit refuses new windows')

  await Promise.all([first.closed, second.closed, main.closed])
  check(first.isClosed && second.isClosed && closed === 2, 'approved quit closed both editors')
  check(main.isClosed && windows.getAllWindows().length === 0, 'approved quit closed the main window')
  check(
    Number(closeRequests) === 2 && Number(contentUnmounts) === unmountsBefore + 2,
    'quit unmounts without dispatching close twice',
  )
  console.log('DESKTOP_APP_QUIT_OK')
}
