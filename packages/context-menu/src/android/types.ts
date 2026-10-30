/** How the menu opens on Android. */
export type MaterialContextMenuActivation = 'longPress' | 'singlePress'

/** One row of serialized menu content carried over the bridge. */
export interface MaterialContextMenuItem {
	/** Stable id reported to `onItemSelected`. */
	id: string
	/** Item display text. */
	title: string
	/** Marks the action destructive (red styling where supported). */
	destructive?: boolean
	/** Greys the item; not selectable. */
	disabled?: boolean
	/** Render a divider before this item. */
	divider?: boolean
}

/** Android context-menu props. */
export interface MaterialContextMenuProps {
	/** Element id passed through to the host element. */
	id?: string
	/** Class list applied to the element. */
	className?: any
	/** Inline style (string CSS or object). */
	style?: any
	/** Activation gesture. @default 'longPress' */
	activation?: MaterialContextMenuActivation
	/** Menu entries in display order. */
	items?: readonly MaterialContextMenuItem[]
	/** Render fn producing the trigger subtree — portaled from the declaring
	 *  Octane tree into the menu's AndroidView anchor. */
	trigger: () => any
	/** Fires with the selected item id. */
	onItemSelected?: (id: string) => void
	/** Spoken name for assistive tech. */
	accessibilityLabel?: string
}
