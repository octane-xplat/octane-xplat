import type { UniversalComponent } from 'octane/universal'

export type SwiftUIDatePickerStyle = 'automatic' | 'compact' | 'graphical' | 'wheel'

export type SwiftUIDatePickerComponent = 'date' | 'hourAndMinute'

export interface SwiftUIDatePickerProps {
	id?: string
	className?: any
	style?: any
	title?: string
	selection?: Date
	defaultSelection?: Date
	minimumDate?: Date
	maximumDate?: Date
	displayedComponents?: readonly SwiftUIDatePickerComponent[]
	pickerStyle?: SwiftUIDatePickerStyle
	disabled?: boolean
	accessibilityLabel?: string
	onSelectionChange?: (date: Date) => void
}

export declare const SwiftUIDatePicker: UniversalComponent<SwiftUIDatePickerProps>
