/** @jsxImportSource @octane-xplat/jsx */
import { useMemo } from 'octane'
import { useOwnedContent } from './use-owned-content.macos.tsrx'
import { openBottomSheetWithOwner } from './bottom-sheet-service.macos'
import type { ImperativeBottomSheetReturn, OpenBottomSheet } from './props'

/** Imperative sheet handles whose content belongs to the rendered element's providers. */
export function useImperativeBottomSheet(): ImperativeBottomSheetReturn {
	const content = useOwnedContent()
	const open: OpenBottomSheet = useMemo(
		() => (component, params, options) =>
			openBottomSheetWithOwner(content.owner, component, params, options),
		[content.owner],
	)

	return { open, element: content.element }
}
