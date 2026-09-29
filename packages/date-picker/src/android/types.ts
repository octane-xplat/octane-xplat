export type MaterialDatePickerVariant = 'picker' | 'input'

export type MaterialDatePickerComponents = 'date' | 'hourAndMinute' | 'dateAndTime'

/**
 * Color overrides for the Material 3 picker elements. Every field is a CSS
 * hex string (`#rgb`, `#rrggbb`, or `#aarrggbb`); unset fields use the
 * Material 3 theme defaults.
 */
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
	/** Date the picker starts on. The picker keeps its own selection after mount. */
	initialDate?: Date
	/** Calendar grid or text-field input. @default 'picker' */
	variant?: MaterialDatePickerVariant
	/**
	 * `'date'` renders the M3 DatePicker, `'hourAndMinute'` the M3 TimePicker.
	 * `'dateAndTime'` renders the date picker (combined input is not supported).
	 * @default 'date'
	 */
	displayedComponents?: MaterialDatePickerComponents
	/** Show the picker/input mode toggle. @default true */
	showVariantToggle?: boolean
	/** 24-hour dial for the time picker. @default true */
	is24Hour?: boolean
	/** Accent applied to a subset of elements when `elementColors` is unset. */
	color?: string
	elementColors?: MaterialDatePickerElementColors
	/** Bounds the selectable date range; also derives the calendar year range. */
	selectableDates?: { start?: Date; end?: Date }
	accessibilityLabel?: string
	/**
	 * Called with the selected timestamp (null when the selection clears). The
	 * DatePicker emits the chosen UTC day; the TimePicker emits the chosen
	 * hour/minute on the initial date's day.
	 */
	onDateSelected?: (date: Date | null) => void
}
