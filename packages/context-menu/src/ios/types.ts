/** One row of serialized menu content carried over the bridge. */
export interface SwiftUIContextMenuItem {
	/** Stable id reported to `onItemSelected`. */
	id: string
	title: string
	/** Renders the item with .destructive role. */
	destructive?: boolean
	disabled?: boolean
	/** Render a divider before this item. */
	divider?: boolean
}

export interface SwiftUIContextMenuProps {
	id?: string
	className?: any
	style?: any
	items?: readonly SwiftUIContextMenuItem[]
	/** Render fn producing the activation element — hosted inside the
	 *  SwiftUI tree via the plugin's NativeScriptView-by-id factory. */
	trigger: () => any
	/** Optional preview shown while the menu opens (iOS 16+). */
	preview?: () => any
	onItemSelected?: (id: string) => void
	accessibilityLabel?: string
}
