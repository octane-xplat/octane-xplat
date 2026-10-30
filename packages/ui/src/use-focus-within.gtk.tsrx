import { useFocusWithin as useFocusWithinShared } from './use-focus-within.tsrx'
import type { UseFocusWithinOptions, UseFocusWithinResult } from './use-focus-within.tsrx'

export type { UseFocusWithinOptions, UseFocusWithinResult } from './use-focus-within.tsrx'

/**
 * GTK leaf — real subtree tracking. The renderer binds `onFocus`/`onBlur`
 * to `Gtk.EventControllerFocus` enter/leave, which have true boundary
 * semantics on containers: `enter` fires once when focus crosses into
 * the element's subtree, `leave` once when it exits, with no toggles
 * while focus moves between descendants (verified against GTK 4.14).
 * The shared leaf's single-element approximation still drives the
 * callbacks; only the capability flag differs.
 */
export function useFocusWithin(options: UseFocusWithinOptions = {}): UseFocusWithinResult {
	return { ...useFocusWithinShared(options), isSubtreeTrackingSupported: true }
}
