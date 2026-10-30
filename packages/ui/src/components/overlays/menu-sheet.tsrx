/** @jsxImportSource @octane-xplat/jsx */
import type { MoreMenuPresentation } from '../../props'
import { BottomSheet } from './BottomSheet'
import { MenuProvider } from './menu-context'
import { MenuData } from './MenuParts'
import { mergeStyle } from '../../internal/layout/style-merge'

/** iOS/Android resolve 'adaptive' to the sheet — the platform is already a
 *  compact coarse-pointer surface. macOS overrides via its own menu leafs. */
export function useMenuSheet(presentation: MoreMenuPresentation | undefined): boolean {
	return presentation === 'bottom-sheet' || presentation === 'adaptive'
}

/** Menu rows presented inside a BottomSheet instead of an anchored popover. */
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
