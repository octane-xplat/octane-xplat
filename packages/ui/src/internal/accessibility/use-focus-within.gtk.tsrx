import { useFocusWithinState } from './focus-within-state.tsrx'
import type { UseFocusWithinOptions, UseFocusWithinResult } from './focus-within-state.tsrx'

export type { UseFocusWithinOptions, UseFocusWithinResult } from './use-focus-within.tsrx'

/**
 * GTK leaf — imports the shared state module directly; importing
 * `use-focus-within.tsrx` here would self-resolve to this file under
 * platform-variant bundling and recurse (same split as the macOS leaf).
 * — real subtree tracking. The renderer binds `onFocus`/`onBlur`
 * to `Gtk.EventControllerFocus` enter/leave, which have true boundary
 * semantics on containers: `enter` fires once when focus crosses into
 * the element's subtree, `leave` once when it exits, with no toggles
 * while focus moves between descendants (verified against GTK 4.14).
 * The shared leaf's single-element approximation still drives the
 * callbacks; only the capability flag differs.
 */
export function useFocusWithin(options: UseFocusWithinOptions = {}): UseFocusWithinResult {
  return { ...useFocusWithinState(options), isSubtreeTrackingSupported: true }
}
