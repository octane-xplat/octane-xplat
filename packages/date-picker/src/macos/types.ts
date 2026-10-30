/** AppKit picker component slots. */
export type AppKitDatePickerComponents = 'date' | 'time' | 'dateAndTime'

/** macOS date-picker style. */
export type AppKitDatePickerStyle = 'textField' | 'graphical'

/** macOS date-picker props (NSDatePicker). */
export interface AppKitDatePickerProps {
	/** Element id passed through to the host element. */
	id?: string
	/** Class list applied to the picker element. */
	className?: any
	/** Inline style (string CSS or object). */
	style?: any
	/** Which element groups the NSDatePicker shows. @default 'date' */
	components?: AppKitDatePickerComponents
	/** 'graphical' embeds the inline calendar (date mode only). @default 'textField' */
	pickerStyle?: AppKitDatePickerStyle
	/** Controlled selection. Pair with `onSelectionChange`. */
	selection?: Date
	/** Initial uncontrolled seed. Later defaults do not reset the mounted picker. */
	defaultSelection?: Date
	/** Earliest selectable date. */
	minimumDate?: Date
	/** Latest selectable date. */
	maximumDate?: Date
	/** Disables interaction with the picker. */
	disabled?: boolean
	/** Spoken name for assistive tech. */
	accessibilityLabel?: string
	/** User selection changes; programmatic updates and retired controls do not emit. */
	onSelectionChange?: (date: Date) => void
}
