export interface SwiftUIContextMenuItem {
	id: string
	title: string
	destructive?: boolean
	disabled?: boolean
	divider?: boolean
}

export interface SwiftUIContextMenuProps {
	id?: string
	className?: any
	style?: any
	items?: readonly SwiftUIContextMenuItem[]
	trigger: () => any
	preview?: () => any
	onItemSelected?: (id: string) => void
	accessibilityLabel?: string
}

export declare function SwiftUIContextMenu(props: SwiftUIContextMenuProps): unknown
