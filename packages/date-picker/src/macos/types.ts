export type AppKitDatePickerComponents = 'date' | 'time' | 'dateAndTime'

export type AppKitDatePickerStyle = 'textField' | 'graphical'

export interface AppKitDatePickerProps {
	id?: string
	className?: any
	style?: any
	/** Which element groups the NSDatePicker shows. @default 'date' */
	components?: AppKitDatePickerComponents
	/** 'graphical' embeds the inline calendar (date mode only). @default 'textField' */
	pickerStyle?: AppKitDatePickerStyle
	/** Controlled selection. Pair with `onSelectionChange`. */
	selection?: Date
	/** Initial selection when `selection` is not provided. */
	defaultSelection?: Date
	/** Earliest selectable date. */
	minimumDate?: Date
	/** Latest selectable date. */
	maximumDate?: Date
	disabled?: boolean
	accessibilityLabel?: string
	onSelectionChange?: (date: Date) => void
}
