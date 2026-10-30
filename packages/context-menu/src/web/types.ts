/** How the menu opens (right-click/long-press variants). */
export type ContextMenuActivation = 'longPress' | 'singlePress'

/** One menu entry or separator. */
export interface ContextMenuItem {
	/** Element id passed through to the host element. */
	id: string
	/** Item display text. */
	title: string
	/** Marks the action destructive (red styling where supported). */
	destructive?: boolean
	/** Greys the item; not selectable. */
	disabled?: boolean
	/** Render as a separator instead of an item. */
	divider?: boolean
}

/** Web context-menu props (composed web menu). */
export interface ContextMenuProps {
	/** Element id passed through to the host element. */
	id?: string
	/** Class list applied to the element. */
	className?: any
	/** Inline style (string CSS or object). */
	style?: any
	/** 'longPress' maps to right-click (contextmenu); 'singlePress' to click. */
	activation?: ContextMenuActivation
	/** Menu entries in display order. */
	items?: readonly ContextMenuItem[]
	/** Content that hosts the context menu (long-press/right-click). */
	trigger: () => any
	/** Fires with the selected item id. */
	onItemSelected?: (id: string) => void
	/** Spoken name for assistive tech. */
	accessibilityLabel?: string
}
