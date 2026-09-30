import type { UniversalComponent } from 'octane/universal'

export interface AppKitContextMenuItem {
	id: string
	title: string
	destructive?: boolean
	disabled?: boolean
	divider?: boolean
}

export interface AppKitContextMenuProps {
	id?: string
	className?: any
	style?: any
	items?: readonly AppKitContextMenuItem[]
	trigger: () => any
	onItemSelected?: (id: string) => void
	accessibilityLabel?: string
}

export declare const AppKitContextMenu: UniversalComponent<AppKitContextMenuProps>
