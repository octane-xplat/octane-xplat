export interface SelectOption {
	value: string
	label: string
	disabled?: boolean
}

export interface SelectProps {
	id?: string
	className?: any
	style?: any
	label: string
	options: readonly SelectOption[]
	value?: string
	defaultValue?: string
	onChange?: (value: string) => void
	disabled?: boolean
	accessibilityLabel?: string
}

export declare function Select(props: SelectProps): unknown
