import { useSyncExternalStore } from 'octane'
import { createAppKitFocusVisibleSource } from './focus-visible-source.macos'
import type { UseFocusVisibleResult } from './use-focus-visible.tsrx'
import { appKitHost } from './host-bridge'

export type { FocusInputModality, UseFocusVisibleResult } from './use-focus-visible.tsrx'

const modality = createAppKitFocusVisibleSource(
	() => globalThis,
	(notify) => appKitHost()?.observeHardwareKeys?.(notify) ?? (() => {}),
)
const hot = (import.meta as ImportMeta & { hot?: { dispose(callback: () => void): void } }).hot
hot?.dispose(() => modality.dispose())

/** Observe AppKit keyboard/mouse modality. Each reader subscribes; the last
 * hook unmount releases native observation unless a global read retained it.
 * This reports input modality, not whether a particular view is focused. */
export function useFocusVisible(): UseFocusVisibleResult {
	return { ...useSyncExternalStore(modality.subscribe, modality.getSnapshot) }
}

/** Read global AppKit modality, retaining observation for this module's lifetime.
 * Render readers should use useFocusVisible to subscribe to subsequent changes. */
export function isFocusVisible(): boolean {
	return modality.isFocusVisible()
}
