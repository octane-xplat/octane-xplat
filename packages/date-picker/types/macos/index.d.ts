import type { UniversalComponent } from 'octane/universal'

export type AppKitDatePickerComponents = 'date' | 'time' | 'dateAndTime'

export type AppKitDatePickerStyle = 'textField' | 'graphical'

export interface AppKitDatePickerProps {
	id?: string
	className?: any
	style?: any
	components?: AppKitDatePickerComponents
	pickerStyle?: AppKitDatePickerStyle
	selection?: Date
	defaultSelection?: Date
	minimumDate?: Date
	maximumDate?: Date
	disabled?: boolean
	accessibilityLabel?: string
	onSelectionChange?: (date: Date) => void
}

export declare const AppKitDatePicker: UniversalComponent<AppKitDatePickerProps>
