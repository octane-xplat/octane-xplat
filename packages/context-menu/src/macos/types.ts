/** One row of serialized menu content carried over the bridge. */
export interface AppKitContextMenuItem {
	/** Stable id reported to `onItemSelected`; unique within this menu. */
	id: string
	/** Item display text. */
	title: string
	/** No AppKit destructive role — kept in the contract for parity; the
	 *  item renders as a normal menu row. */
	destructive?: boolean
	/** Greys the item; not selectable. */
	disabled?: boolean
	/** Render a divider before this item. */
	divider?: boolean
}

/** macOS context-menu props (NSMenu). */
export interface AppKitContextMenuProps {
	/** Native view identifier. Changing it retires this record's menu session. */
	id?: string
	/** Class list applied to the element. */
	className?: any
	/** Inline style (string CSS or object). */
	style?: any
	/** Menu entries in display order. */
	items?: readonly AppKitContextMenuItem[]
	/** Render fn producing the trigger element — rendered inline; the NSMenu
	 *  attaches to the host's backing NSView. */
	trigger: () => any
	/** Current enabled item selections; retired/replaced menu actions are ignored. */
	onItemSelected?: (id: string) => void
	/** Spoken name for assistive tech. */
	accessibilityLabel?: string
}
