/** @jsxImportSource @octane-xplat/jsx */
import Gdk from 'gi://Gdk?version=4.0'
import type { MoreMenuPresentation } from './props'
import { BottomSheet } from './BottomSheet'
import { MenuProvider } from './menu-context'
import { MenuData } from './MenuParts'
import { mergeStyle } from './style-merge'

/** True when any seat exposes a touch device — the GTK 'adaptive' coarse-
 *  pointer signal (desktop X11/Wayland sessions report pointer/tablet
 *  only, so 'adaptive' resolves to the anchored popover there). */
function hasCoarsePointer(): boolean {
	try {
		const display = Gdk.Display.get_default?.()
		const seats = display?.list_seats?.() ?? []
		for (const seat of seats) {
			const capabilities = seat.get_capabilities?.() ?? 0
			// eslint-disable-next-line no-bitwise
			if ((capabilities & Gdk.SeatCapability.TOUCH) !== 0) {
				return true
			}
		}
	} catch { }
	return false
}

// menu-sheet — GTK leaf. Explicit 'bottom-sheet' presents the menu in a
// real BottomSheet; 'adaptive' resolves to the sheet only on coarse-pointer
// (touch) seats and to the popover on fine-pointer desktops (props.ts:
// sheet on coarse/touch, popover on fine).
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
}) @{
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
