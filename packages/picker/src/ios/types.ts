/** One SwiftUI picker option. */
export interface SwiftUIPickerOption {
	/** Element id passed through to the host element. */
	id: string
	/** Option/item display text. */
	title: string
	/** Disables interaction. */
	disabled?: boolean
}

/** iOS picker props (SwiftUI Picker). */
export interface SwiftUIPickerProps {
	/** Element id passed through to the host element. */
	id?: string
	/** Class list applied to the element. */
	className?: any
	/** Inline style (string CSS or object). */
	style?: any
	/** Field label text. */
	label: string
	/** Selectable options. */
	options: readonly SwiftUIPickerOption[]
	/** Controlled selected option id. */
	selection?: string
	/** Initial uncontrolled selected id. */
	defaultSelection?: string
	/** Fires when the user picks an option. */
	onSelectionChange?: (selection: string) => void
	/** Disables interaction. */
	disabled?: boolean
	/** Spoken name for assistive tech. */
	accessibilityLabel?: string
}
