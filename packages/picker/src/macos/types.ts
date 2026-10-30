/** One AppKit picker option. */
export interface AppKitPickerOption {
	/** Unique stable selection ID. Empty IDs and repeated titles are allowed. */
	id: string
	/** Option/item display text. */
	title: string
	/** Disables interaction. */
	disabled?: boolean
}

/** macOS picker props (NSPopUpButton). */
export interface AppKitPickerProps {
	/** Record ownership key; changing it reseeds uncontrolled selection. */
	id?: string
	/** Class list applied to the element. */
	className?: any
	/** Inline style (string CSS or object). */
	style?: any
	/** Field label text. */
	label: string
	/** Empty choices disable the control. IDs must be unique strings. */
	options: readonly AppKitPickerOption[]
	/** Controlled ID; must match an option when choices are nonempty.
	 * Use onSelectionChange to accept a user choice. */
	selection?: string
	/** Initial uncontrolled ID, retained while choices are empty. An absent or
	 * missing ID selects the first enabled option silently. Later defaults do
	 * not reset this record; removing its selected ID uses the same fallback. */
	defaultSelection?: string
	/** User choices only; programmatic changes, stale and disabled actions do not emit. */
	onSelectionChange?: (selection: string) => void
	/** Disables interaction. */
	disabled?: boolean
	/** Defaults to the visible label. */
	accessibilityLabel?: string
}
