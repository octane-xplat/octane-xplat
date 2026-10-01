export type ContextMenuActivation = 'longPress' | 'singlePress'

export interface ContextMenuItem {
	id: string
	title: string
	destructive?: boolean
	disabled?: boolean
	divider?: boolean
}

export interface ContextMenuProps {
	id?: string
	className?: any
	style?: any
	activation?: ContextMenuActivation
	items?: readonly ContextMenuItem[]
	trigger: () => any
	onItemSelected?: (id: string) => void
	accessibilityLabel?: string
}

export declare function ContextMenu(props: ContextMenuProps): unknown
