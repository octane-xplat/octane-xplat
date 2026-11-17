import { projection, call, u32, i32, ptr, bufferAddress } from '../windows-interop.js'
import { TrayError } from '../tray/errors.js'

import { createAppLifecycle } from './lifecycle.js'
import type { AppResidency, DesktopApp } from './types.js'

export type * from './types.js'

const pidBuf = new ArrayBuffer(8)
const pidView = new DataView(pidBuf)

function appWindows(): number[] {
  const pid = Number(call('kernel32.dll', 'GetCurrentProcessId', 'u32'))
  const pidA = bufferAddress(pidBuf)
  const hwnds: number[] = []
  let hwnd = Number(call('user32.dll', 'GetTopWindow', 'pointer', ptr(0)))
  let guard = 0

  while (hwnd && guard++ < 512) {
    call('user32.dll', 'GetWindowThreadProcessId', 'u32', ptr(hwnd), ptr(pidA))
    if (pidView.getUint32(0, true) === pid) {
      hwnds.push(hwnd)
    }

    hwnd = Number(call('user32.dll', 'GetWindow', 'pointer', ptr(hwnd), u32(2)))
  }

  return hwnds
}

const anyAppWindowVisible = () =>
  appWindows().some((hwnd) => call('user32.dll', 'IsWindowVisible', 'bool', ptr(hwnd)))

function requireWin32() {
  const { NSWinRT: nsrt } = projection()

  if (!nsrt?.win32?.call || !nsrt.interop?.pointerFromBuffer) {
    throw new TrayError(
      'unsupported-runtime',
      'the Windows host does not expose the Win32 FFI needed for tray and window helpers',
    )
  }
}

/** Reveal and focus the app's windows; `false` when no app window exists to show. */
export function showAppWindows(): boolean {
  requireWin32()

  const hwnds = appWindows()

  for (const hwnd of hwnds) {
    call('user32.dll', 'ShowWindow', 'bool', ptr(hwnd), i32(5)) // SW_SHOW
  }

  if (hwnds.length > 0) {
    call('user32.dll', 'SetForegroundWindow', 'bool', ptr(hwnds[0]))
  }

  return hwnds.length > 0
}

/** Hide the app's visible windows. */
export function hideAppWindows(): void {
  requireWin32()
  for (const hwnd of appWindows()) {
    call('user32.dll', 'ShowWindow', 'bool', ptr(hwnd), i32(0)) // SW_HIDE
  }
}

/** Toggle window visibility; returns the visibility after toggling. */
export function toggleAppWindows(): boolean {
  if (areAppWindowsVisible()) {
    hideAppWindows()
    return false
  }

  return showAppWindows()
}

/** Whether any app window is currently visible. */
export function areAppWindowsVisible(): boolean {
  requireWin32()
  return anyAppWindowVisible()
}

/** Keep the app running without visible windows until the returned residency releases. */
export function keepAppResident(_options?: { hideWindowsOnClose?: boolean }): AppResidency {
  requireWin32()
  // The packaged Windows host keeps the process alive while JS runs; there is
  // no last-window-close lifetime to intercept from JS. The returned handle is
  // an inert hold so callers can keep uniform resident semantics.
  return { release() {} }
}

/** Native application readiness and quit. */
export const app: DesktopApp = createAppLifecycle()
