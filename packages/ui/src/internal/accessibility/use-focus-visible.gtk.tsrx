import { useSyncExternalStore } from 'octane'
import type { FocusInputModality, UseFocusVisibleResult } from './use-focus-visible.tsrx'

export type { FocusInputModality, UseFocusVisibleResult } from './use-focus-visible.tsrx'

/**
 * GTK leaf — real input-modality tracking. GTK has no `:focus-visible`
 * selector, so the renderer watches the same boundaries the web leaf
 * listens to on the DOM window: a capture-phase key press without
 * ctrl/alt/meta modifiers reports keyboard modality, a pointer press
 * reports pointer, and window deactivation returns to unknown. The
 * renderer owns the watch (`__octaneGtkHost`); this leaf subscribes.
 */

const host = () => (globalThis as any).__octaneGtkHost

const read = (): FocusInputModality => host()?.getInputModality?.() ?? 'unknown'

const subscribe = (notify: () => void) => host()?.onInputModalityChange?.(notify) ?? (() => {})

/**
 * Global focus-modality tracking — React Aria's useFocusVisible. Reports
 * keyboard, pointer, or unknown modality plus whether a ring should show.
 * `isSupported` is true: the modality watch is real X11 input evidence,
 * not a fixed stub.
 */
export function useFocusVisible(): UseFocusVisibleResult {
	const inputModality = useSyncExternalStore(subscribe, read)
	return { isFocusVisible: inputModality === 'keyboard', inputModality, isSupported: true }
}

/** Non-hook read for render paths that already subscribe elsewhere. */
export function isFocusVisible(): boolean {
	return read() === 'keyboard'
}
