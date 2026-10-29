export interface AppKitPickerOption {
	/** Unique stable selection ID. Empty IDs and repeated titles are allowed. */
	id: string
	title: string
	disabled?: boolean
}

export interface AppKitPickerProps {
	/** Record ownership key; changing it reseeds uncontrolled selection. */
	id?: string
	className?: any
	style?: any
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
	disabled?: boolean
	/** Defaults to the visible label. */
	accessibilityLabel?: string
}

export declare function AppKitPicker(props: AppKitPickerProps): unknown

export interface SelectOption {
	value: string
	label: string
	disabled?: boolean
}

export interface SelectProps {
	id?: string
	className?: any
	style?: any
	label: string
	options: readonly SelectOption[]
	value?: string
	defaultValue?: string
	onChange?: (value: string) => void
	disabled?: boolean
	accessibilityLabel?: string
}

export declare function Select(props: SelectProps): unknown
