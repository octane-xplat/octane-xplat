/** @jsxImportSource @octane-xplat/jsx/dom */
import { useEffect, useState } from 'octane'
import type { MoreMenuPresentation } from './props'
import { BottomSheet } from './BottomSheet.web.tsrx'
import { MenuProvider } from './menu-context'
import { MenuData } from './MenuParts.web.tsrx'

/** Resolve `presentation` for this host: 'adaptive' tracks a compact
 *  coarse-pointer media query (same predicate as MoreMenu). */
export function useMenuSheet(presentation: MoreMenuPresentation | undefined): boolean {
	const [adaptive, setAdaptive] = useState(false)
	useEffect(() => {
		if (presentation !== 'adaptive') {
			setAdaptive(false)
			return
		}

		const query = window.matchMedia('(max-width: 768px) and (pointer: coarse)')
		const update = () => setAdaptive(query.matches)
		update()
		query.addEventListener?.('change', update)
		return () => query.removeEventListener?.('change', update)
	}, [presentation])

	return presentation === 'bottom-sheet' || (presentation === 'adaptive' && adaptive)
}

/** Menu rows presented inside a BottomSheet instead of an anchored popover.
 *  Data-mode rows reuse `MenuData` under a `MenuProvider` so `closeMenu`
 *  resolves to the sheet's dismissal. */
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
		<div className="vx-menu-sheet-list">
			<MenuProvider value={{ closeMenu: close, menuSize: 'md' }}>
				<MenuData items={props.items} />
				{props.children}
			</MenuProvider>
		</div>
	</BottomSheet>
}
