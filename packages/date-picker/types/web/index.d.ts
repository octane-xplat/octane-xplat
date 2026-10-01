export type DateInputType = 'date' | 'time' | 'datetime-local'

export interface DateInputProps {
	id?: string
	className?: any
	style?: any
	label?: string
	type?: DateInputType
	value?: string
	defaultValue?: string
	min?: string
	max?: string
	disabled?: boolean
	accessibilityLabel?: string
	onChange?: (value: string) => void
}

export declare function DateInput(props: DateInputProps): unknown
