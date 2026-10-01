export type MaterialContextMenuActivation = 'longPress' | 'singlePress'

export interface MaterialContextMenuItem {
	id: string
	title: string
	destructive?: boolean
	disabled?: boolean
	divider?: boolean
}

export interface MaterialContextMenuProps {
	id?: string
	className?: any
	style?: any
	activation?: MaterialContextMenuActivation
	items?: readonly MaterialContextMenuItem[]
	trigger: () => any
	onItemSelected?: (id: string) => void
	accessibilityLabel?: string
}

export declare function MaterialContextMenu(props: MaterialContextMenuProps): unknown
