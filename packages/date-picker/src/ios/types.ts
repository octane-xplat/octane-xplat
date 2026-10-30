/** SwiftUI date-picker style. */
export type SwiftUIDatePickerStyle = 'automatic' | 'compact' | 'graphical' | 'wheel'

/** SwiftUI picker component selector. */
export type SwiftUIDatePickerComponent = 'date' | 'hourAndMinute'

/** iOS date-picker props (SwiftUI DatePicker). */
export interface SwiftUIDatePickerProps {
	/** Element id passed through to the host element. */
	id?: string
	/** Class list applied to the picker element. */
	className?: any
	/** Inline style (string CSS or object). */
	style?: any
	/** Label shown next to the picker. When omitted, the label is hidden. */
	title?: string
	/** Controlled selection. Pair with `onSelectionChange`. */
	selection?: Date
	/** Initial selection when `selection` is not provided. */
	defaultSelection?: Date
	/** Earliest selectable date. */
	minimumDate?: Date
	/** Latest selectable date. */
	maximumDate?: Date
	/** Which components the picker displays. @default ['date'] */
	displayedComponents?: readonly SwiftUIDatePickerComponent[]
	/** SwiftUI presentation style. `graphical` renders an inline calendar. @default 'automatic' */
	pickerStyle?: SwiftUIDatePickerStyle
	/** Disables interaction with the picker. */
	disabled?: boolean
	/** Spoken name for assistive tech. */
	accessibilityLabel?: string
	/** Called when the user picks a new date; programmatic `selection` updates do not emit. */
	onSelectionChange?: (date: Date) => void
}
