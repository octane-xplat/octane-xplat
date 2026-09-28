import { openSheet as openSheetUI, closeSheet } from '@octane-xplat/ui'
import { SheetPanel } from '../SheetPanel.tsrx'

export { closeSheet }
export function sheetHost(): null { return null }

export function openSheet(Component: unknown = SheetPanel, props: Record<string, unknown> = {}): void {
	openSheetUI(Component, props).catch((error: Error) => {
		console.log('[probe] sheet unsupported: ' + error.message)
	})
}
