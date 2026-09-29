import type { UniversalComponent } from 'octane/universal'

export type MaterialDatePickerVariant = 'picker' | 'input'

export type MaterialDatePickerComponents = 'date' | 'hourAndMinute' | 'dateAndTime'

export interface MaterialDatePickerElementColors {
	containerColor?: string
	titleContentColor?: string
	headlineContentColor?: string
	weekdayContentColor?: string
	subheadContentColor?: string
	navigationContentColor?: string
	yearContentColor?: string
	disabledYearContentColor?: string
	currentYearContentColor?: string
	selectedYearContentColor?: string
	disabledSelectedYearContentColor?: string
	selectedYearContainerColor?: string
	disabledSelectedYearContainerColor?: string
	dayContentColor?: string
	disabledDayContentColor?: string
	selectedDayContentColor?: string
	disabledSelectedDayContentColor?: string
	selectedDayContainerColor?: string
	disabledSelectedDayContainerColor?: string
	todayContentColor?: string
	todayDateBorderColor?: string
	dayInSelectionRangeContentColor?: string
	dayInSelectionRangeContainerColor?: string
	dividerColor?: string
	clockDialColor?: string
	clockDialSelectedContentColor?: string
	clockDialUnselectedContentColor?: string
	selectorColor?: string
	periodSelectorBorderColor?: string
	periodSelectorSelectedContainerColor?: string
	periodSelectorUnselectedContainerColor?: string
	periodSelectorSelectedContentColor?: string
	periodSelectorUnselectedContentColor?: string
	timeSelectorSelectedContainerColor?: string
	timeSelectorUnselectedContainerColor?: string
	timeSelectorSelectedContentColor?: string
	timeSelectorUnselectedContentColor?: string
}

export interface MaterialDatePickerProps {
	id?: string
	className?: any
	style?: any
	initialDate?: Date
	variant?: MaterialDatePickerVariant
	displayedComponents?: MaterialDatePickerComponents
	showVariantToggle?: boolean
	is24Hour?: boolean
	color?: string
	elementColors?: MaterialDatePickerElementColors
	selectableDates?: { start?: Date; end?: Date }
	accessibilityLabel?: string
	onDateSelected?: (date: Date | null) => void
}

export declare const MaterialDatePicker: UniversalComponent<MaterialDatePickerProps>
