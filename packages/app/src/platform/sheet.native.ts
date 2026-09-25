import { openSheet as openSheetUI } from '@octane-xplat/ui'
import { SheetPanel } from '../SheetPanel.tsrx'

// thin harness wrapper — the in-window sheet service lives in
// @octane-xplat/ui (sheet-service.native.ts); this keeps the probe's
// SheetPanel default and [probe] logging for the sweep timeline.
export { closeSheet, sheetHost } from '@octane-xplat/ui'

/** Bottom-anchored sheet: dedicated sub-root on the current RootLayout.
 *  Content is parameterized — callers pass any component (e.g. a demo
 *  render fn); defaults to the SheetPanel probe panel. */
export function openSheet(Component: unknown = SheetPanel, props: Record<string, unknown> = {}) {
	openSheetUI(Component as any, props).then(
		() => console.log('[probe] sheet close'),
		(e: Error) => console.log('[probe] sheet FAILED: ' + e.message),
	)

	console.log('[probe] sheet open')
}
