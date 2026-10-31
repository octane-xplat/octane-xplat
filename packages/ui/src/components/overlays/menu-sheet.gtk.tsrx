/** @jsxImportSource @octane-xplat/jsx */
import type { MoreMenuPresentation } from '../../props'
import { hasCoarsePointer } from '../forms/coarse-pointer'
import { BottomSheet } from './BottomSheet'
import { MenuProvider } from './menu-context'
import { MenuData } from './MenuParts'
import { mergeStyle } from '../../internal/layout/style-merge'

// menu-sheet — GTK leaf. Explicit 'bottom-sheet' presents the menu in a
// real BottomSheet; 'adaptive' resolves to the sheet only on coarse-pointer
// (touch) seats and to the popover on fine-pointer desktops (props.ts:
// sheet on coarse/touch, popover on fine). The seat check lives in
// ./coarse-pointer.gtk — shared with the date-input surfaces.
export function useMenuSheet(presentation: MoreMenuPresentation | undefined): boolean {
	return presentation === 'bottom-sheet' || (presentation === 'adaptive' && hasCoarsePointer())
}

/** Menu rows presented inside a BottomSheet — identical markup to the
 *  shared leaf; the sheet is the GTK overlay-layer host. */
export function MenuSheet(props: {
	open: boolean
	onOpenChange: (open: boolean) => void
	label?: string
	items?: any
	children?: any
}): unknown @{
	const close = () => props.onOpenChange(false)

	<BottomSheet
		isOpen={props.open}
		onOpenChange={props.onOpenChange}
		label={props.label ?? 'Menu'}
		height="hug"
		className="vx-menu-sheet"
	>
		<masonview className="vx-menu-sheet-list" style={mergeStyle({ display: 'flex' })}>
			<MenuProvider value={{ closeMenu: close, menuSize: 'md' }}>
				<MenuData items={props.items} />
				{props.children}
			</MenuProvider>
		</masonview>
	</BottomSheet>
}
