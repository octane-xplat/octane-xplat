export interface MaterialDropdownItem {
	key: string
	text: string
	enabled?: boolean
}

export interface MaterialDropdownProps {
	id?: string
	className?: any
	style?: any
	label: string
	items: readonly MaterialDropdownItem[]
	selectedKey?: string
	defaultSelectedKey?: string
	onSelectedKeyChange?: (key: string) => void
	enabled?: boolean
	accessibilityLabel?: string
}
