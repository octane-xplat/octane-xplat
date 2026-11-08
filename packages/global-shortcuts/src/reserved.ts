import type { Accelerator, AcceleratorPlatform } from './types.js'

/**
 * Accelerators the OS reserves before any API call can succeed. Checked in
 * the registry ahead of `backend.bind`; a backend may add dynamic entries
 * (macOS `CopySymbolicHotKeys`) through the `reserved` hook.
 */
export function staticallyReserved(
  platform: AcceleratorPlatform,
  accelerator: Accelerator,
): string | null {
  const { ctrl, alt, shift, meta, code } = accelerator
  if (platform === 'mac') {
    if (meta && !ctrl && !alt && !shift && code === 'Tab') {
      return 'Meta+Tab switches applications on macOS and cannot be registered.'
    }

    if (meta && shift && !ctrl && !alt && code === 'Tab') {
      return 'Shift+Meta+Tab switches applications on macOS and cannot be registered.'
    }

    if (meta && alt && !ctrl && !shift && code === 'Escape') {
      return 'Alt+Meta+Escape opens Force Quit on macOS and cannot be registered.'
    }

    if (meta && ctrl && !alt && !shift && code === 'KeyQ') {
      return 'Ctrl+Meta+KeyQ locks the screen on macOS and cannot be registered.'
    }

    return null
  }
  if (platform === 'windows') {
    if (ctrl && alt && !meta && code === 'Delete') {
      return 'Ctrl+Alt+Delete is handled by Windows and cannot be registered.'
    }

    if (meta && !ctrl && !alt && !shift && code === 'KeyL') {
      return 'Meta+KeyL locks the screen on Windows and cannot be registered.'
    }

    if (code === 'F12') {
      return 'F12 is reserved for the Windows debugger and cannot be registered.'
    }

    return null
  }
  return null
}
