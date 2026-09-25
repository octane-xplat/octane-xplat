import { openSheet as openSheetUI } from '@octane-xplat/ui'
import { SheetPanel } from '../SheetPanel.tsrx'

export { closeSheet } from '@octane-xplat/ui'

/** Bottom-anchored sheet — the real ui service (portal layer, own root). */
export function openSheet(Component: unknown = SheetPanel, props: Record<string, unknown> = {}) {
	openSheetUI(Component as any, props).then(
		() => console.log('[probe] sheet close'),
		(e: Error) => console.log('[probe] sheet FAILED: ' + e.message),
	)
	console.log('[probe] sheet open')
}
