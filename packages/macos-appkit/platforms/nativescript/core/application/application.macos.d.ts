import type { View } from '@nativescript/core'
import type { AppKitWindow } from '../../../../src/host-windowing'

/** Start Core using the same AppKit window factory as a desktop host. */
export function startNativeScriptApplication(
  createRoot: () => View,
  createWindow: () => AppKitWindow,
): void
