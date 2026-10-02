import { openBottomSheet as openSheetUI } from '@octane-xplat/ui'
import { SheetPanel } from '../SheetPanel.tsrx'

// thin harness wrapper — the in-window sheet service lives in
// @octane-xplat/ui (sheet-service.ts); this keeps the probe's
// BottomSheetPanel default and [probe] logging for the sweep timeline.
export { closeBottomSheet } from '@octane-xplat/ui'
export { bottomSheetHost } from '@octane-xplat/ui/native'

/** Bottom-anchored sheet: dedicated sub-root on the current RootLayout.
 *  Content is parameterized — callers pass any component (e.g. a demo
 *  render fn); defaults to the SheetPanel probe panel. */
export function openBottomSheet(Component: unknown = SheetPanel, props: Record<string, unknown> = {}) {
	openSheetUI(Component as any, props).then(
		() => console.log('[probe] sheet close'),
		(e: Error) => console.log('[probe] sheet FAILED: ' + e.message),
	)

	console.log('[probe] sheet open')
}
