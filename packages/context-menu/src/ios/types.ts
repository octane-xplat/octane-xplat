/** One row of serialized menu content carried over the bridge. */
export interface SwiftUIContextMenuItem {
	/** Stable id reported to `onItemSelected`. */
	id: string
	/** Item display text. */
	title: string
	/** Renders the item with .destructive role. */
	destructive?: boolean
	/** Greys the item; not selectable. */
	disabled?: boolean
	/** Render a divider before this item. */
	divider?: boolean
}

/** iOS context-menu props (SwiftUI contextMenu). */
export interface SwiftUIContextMenuProps {
	/** Element id passed through to the host element. */
	id?: string
	/** Class list applied to the element. */
	className?: any
	/** Inline style (string CSS or object). */
	style?: any
	/** Menu entries in display order. */
	items?: readonly SwiftUIContextMenuItem[]
	/** Render fn producing the activation element — hosted inside the
	 *  SwiftUI tree via the plugin's NativeScriptView-by-id factory. */
	trigger: () => any
	/** Optional preview shown while the menu opens (iOS 16+). */
	preview?: () => any
	/** Fires with the selected item id. */
	onItemSelected?: (id: string) => void
	/** Spoken name for assistive tech. */
	accessibilityLabel?: string
}
