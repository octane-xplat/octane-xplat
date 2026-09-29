export type SwiftUIDatePickerStyle = 'automatic' | 'compact' | 'graphical' | 'wheel'

export type SwiftUIDatePickerComponent = 'date' | 'hourAndMinute'

export interface SwiftUIDatePickerProps {
	id?: string
	className?: any
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
	disabled?: boolean
	accessibilityLabel?: string
	onSelectionChange?: (date: Date) => void
}
