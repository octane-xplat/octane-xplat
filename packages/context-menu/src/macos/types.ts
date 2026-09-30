/** One row of serialized menu content carried over the bridge. */
export interface AppKitContextMenuItem {
	/** Stable id reported to `onItemSelected`. */
	id: string
	title: string
	/** No AppKit destructive role — kept in the contract for parity; the
	 *  item renders as a normal menu row. */
	destructive?: boolean
	disabled?: boolean
	/** Render a divider before this item. */
	divider?: boolean
}

export interface AppKitContextMenuProps {
	id?: string
	className?: any
	style?: any
	items?: readonly AppKitContextMenuItem[]
	/** Render fn producing the trigger element — rendered inline; the NSMenu
	 *  attaches to the host's backing NSView. */
	trigger: () => any
	onItemSelected?: (id: string) => void
	accessibilityLabel?: string
}
