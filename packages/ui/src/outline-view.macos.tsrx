/** @jsxImportSource @octane-xplat/macos-renderer */
// macOS keeps the same hook name for platform import stability, but the
// current AppKit bridge does not expose readable Heading semantics.
import type { OutlineFromViewCapabilities, OutlineItem } from './props'

/** The current AppKit bridge does not preserve native Heading role/level
 *  metadata in a form view-tree discovery can read. Use portable item data.
 *
 * @example
 * ```ts
 * const { isSupported, mode } = getOutlineFromViewCapabilities()
 * // macOS: { isSupported: false, mode: 'unsupported' }
 * ```
 */
export function getOutlineFromViewCapabilities(): OutlineFromViewCapabilities {
	return { isSupported: false, mode: 'unsupported' }
}

/** `useOutlineFromView` — retained for platform import compatibility, but
 *  returns no items until the AppKit bridge exposes Heading metadata. Check
 *  `getOutlineFromViewCapabilities()` and use portable document data or
 *  explicit items while `isSupported` is false. */
export function useOutlineFromView(_containerRef?: unknown): OutlineItem[] {
	return []
}
