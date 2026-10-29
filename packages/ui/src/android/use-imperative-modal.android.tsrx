/** @jsxImportSource @octane-xplat/jsx */
import { useMemo } from 'octane'
import { useOwnedContent } from '../components/overlays/use-owned-content'
import { openModalWithOwner } from './openModal.android'
import type { ImperativeModalReturn, OpenModal } from '../props'

/** Platform modal handles whose content inherits the rendered element's providers. */
export function useImperativeModal(): ImperativeModalReturn {
	const content = useOwnedContent()
	const open: OpenModal = useMemo(
		() => (component, params, options) =>
			openModalWithOwner(content.owner, component, params, options),
		[content.owner],
	)

	return { open, element: content.element }
}
