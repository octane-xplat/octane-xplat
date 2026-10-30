/** One select option. */
export interface SelectOption {
	/** Controlled selected value. */
	value: string
	/** Field label text. */
	label: string
	/** Disables interaction. */
	disabled?: boolean
}

/** Web select props (native <select>). */
export interface SelectProps {
	/** Element id passed through to the host element. */
	id?: string
	/** Class list applied to the element. */
	className?: any
	/** Inline style (string CSS or object). */
	style?: any
	/** Field label text. */
	label: string
	/** Selectable options. */
	options: readonly SelectOption[]
	/** Controlled selected value. */
	value?: string
	/** Initial uncontrolled selection. */
	defaultValue?: string
	/** Fires when the user picks a value. */
	onChange?: (value: string) => void
	/** Disables interaction. */
	disabled?: boolean
	/** Spoken name for assistive tech. */
	accessibilityLabel?: string
}
