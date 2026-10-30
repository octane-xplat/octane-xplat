/** Date-picker presentation variant. */
export type MaterialDatePickerVariant = 'picker' | 'input'

/** Per-part Material color slots. */
export type MaterialDatePickerComponents = 'date' | 'hourAndMinute' | 'dateAndTime'

/**
 * Color overrides for the Material 3 picker elements. Every field is a CSS
 * hex string (`#rgb`, `#rrggbb`, or `#aarrggbb`); unset fields use the
 * Material 3 theme defaults.
 */
export interface MaterialDatePickerElementColors {
	/** Part color override (any platform color string). */

	containerColor?: string
	/** Part color override (any platform color string). */

	titleContentColor?: string
	/** Part color override (any platform color string). */

	headlineContentColor?: string
	/** Part color override (any platform color string). */

	weekdayContentColor?: string
	/** Part color override (any platform color string). */

	subheadContentColor?: string
	/** Part color override (any platform color string). */

	navigationContentColor?: string
	/** Part color override (any platform color string). */

	yearContentColor?: string
	/** Part color override (any platform color string). */

	disabledYearContentColor?: string
	/** Part color override (any platform color string). */

	currentYearContentColor?: string
	/** Part color override (any platform color string). */

	selectedYearContentColor?: string
	/** Part color override (any platform color string). */

	disabledSelectedYearContentColor?: string
	/** Part color override (any platform color string). */

	selectedYearContainerColor?: string
	/** Part color override (any platform color string). */

	disabledSelectedYearContainerColor?: string
	/** Part color override (any platform color string). */

	dayContentColor?: string
	/** Part color override (any platform color string). */

	disabledDayContentColor?: string
	/** Part color override (any platform color string). */

	selectedDayContentColor?: string
	/** Part color override (any platform color string). */

	disabledSelectedDayContentColor?: string
	/** Part color override (any platform color string). */

	selectedDayContainerColor?: string
	/** Part color override (any platform color string). */

	disabledSelectedDayContainerColor?: string
	/** Part color override (any platform color string). */

	todayContentColor?: string
	/** Part color override (any platform color string). */

	todayDateBorderColor?: string
	/** Part color override (any platform color string). */

	dayInSelectionRangeContentColor?: string
	/** Part color override (any platform color string). */

	dayInSelectionRangeContainerColor?: string
	/** Part color override (any platform color string). */

	dividerColor?: string
	/** Part color override (any platform color string). */

	clockDialColor?: string
	/** Part color override (any platform color string). */

	clockDialSelectedContentColor?: string
	/** Part color override (any platform color string). */

	clockDialUnselectedContentColor?: string
	/** Part color override (any platform color string). */

	selectorColor?: string
	/** Part color override (any platform color string). */

	periodSelectorBorderColor?: string
	/** Part color override (any platform color string). */

	periodSelectorSelectedContainerColor?: string
	/** Part color override (any platform color string). */

	periodSelectorUnselectedContainerColor?: string
	/** Part color override (any platform color string). */

	periodSelectorSelectedContentColor?: string
	/** Part color override (any platform color string). */

	periodSelectorUnselectedContentColor?: string
	/** Part color override (any platform color string). */

	timeSelectorSelectedContainerColor?: string
	/** Part color override (any platform color string). */

	timeSelectorUnselectedContainerColor?: string
	/** Part color override (any platform color string). */

	timeSelectorSelectedContentColor?: string
	/** Part color override (any platform color string). */

	timeSelectorUnselectedContentColor?: string
}

/** Android date-picker props (Material3 date picker). */
export interface MaterialDatePickerProps {
	/** Element id passed through to the host element. */
	id?: string
	/** Class list applied to the picker element. */
	className?: any
	/** Inline style (string CSS or object). */
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
	/** Part color override (any platform color string). */

	color?: string
	/** Part color override (any platform color string). */

	elementColors?: MaterialDatePickerElementColors
	/** Bounds the selectable date range; also derives the calendar year range. */
	selectableDates?: { start?: Date; end?: Date }
	/** Spoken name for assistive tech. */
	accessibilityLabel?: string
	/**
	 * Called with the selected timestamp (null when the selection clears). The
	 * DatePicker emits the chosen UTC day; the TimePicker emits the chosen
	 * hour/minute on the initial date's day.
	 */
	onDateSelected?: (date: Date | null) => void
}
