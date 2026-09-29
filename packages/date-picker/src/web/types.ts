export type DateInputType = 'date' | 'time' | 'datetime-local'

export interface DateInputProps {
	id?: string
	className?: any
	style?: any
	label?: string
	/** The `<input>` type. @default 'date' */
	type?: DateInputType
	/** Controlled value: `YYYY-MM-DD`, `HH:MM`, or `YYYY-MM-DDTHH:MM`. */
	value?: string
	defaultValue?: string
	/** Earliest allowed value, in the same format as `value`. */
	min?: string
	/** Latest allowed value, in the same format as `value`. */
	max?: string
	disabled?: boolean
	accessibilityLabel?: string
	onChange?: (value: string) => void
}
