/** One Material dropdown item. */
export interface MaterialDropdownItem {
	/** Item key reported back on selection. */
	key: string
	/** Item display text. */
	text: string
	/** Disables interaction when false. */
	enabled?: boolean
}

/** Android dropdown props (Material menu). */
export interface MaterialDropdownProps {
	/** Element id passed through to the host element. */
	id?: string
	/** Class list applied to the element. */
	className?: any
	/** Inline style (string CSS or object). */
	style?: any
	/** Field label text. */
	label: string
	/** Selectable items. */
	items: readonly MaterialDropdownItem[]
	/** Controlled selected item key. */
	selectedKey?: string
	/** Initial uncontrolled key. */
	defaultSelectedKey?: string
	/** Fires when the user picks an item. */
	onSelectedKeyChange?: (key: string) => void
	/** Disables interaction when false. */
	enabled?: boolean
	/** Spoken name for assistive tech. */
	accessibilityLabel?: string
}
