export type MaterialContextMenuActivation = 'longPress' | 'singlePress'

/** One row of serialized menu content carried over the bridge. */
export interface MaterialContextMenuItem {
	/** Stable id reported to `onItemSelected`. */
	id: string
	title: string
	destructive?: boolean
	disabled?: boolean
	/** Render a divider before this item. */
	divider?: boolean
}

export interface MaterialContextMenuProps {
	id?: string
	className?: any
	style?: any
	/** Activation gesture. @default 'longPress' */
	activation?: MaterialContextMenuActivation
	items?: readonly MaterialContextMenuItem[]
	/** Render fn producing the trigger subtree — hosted inside the menu's
	 *  anchor via AndroidView. */
	trigger: () => any
	onItemSelected?: (id: string) => void
	accessibilityLabel?: string
}
