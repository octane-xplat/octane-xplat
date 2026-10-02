import { openBottomSheet as openSheetUI, closeBottomSheet } from '@octane-xplat/ui'
import { SheetPanel } from '../SheetPanel.tsrx'

export { closeBottomSheet }
export function bottomSheetHost(): null {
	return null
}

export function openBottomSheet(
	Component: unknown = SheetPanel,
	props: Record<string, unknown> = {},
): void {
	openSheetUI(Component, props).catch((error: Error) => {
		console.log('[probe] sheet unsupported: ' + error.message)
	})
}
