import type { UniversalComponent } from 'octane/universal'

export interface NativePickerOption {
	value: string
	label: string
	disabled?: boolean
}

export interface NativePickerProps {
	id?: string
	className?: any
	style?: any
	label: string
	options: readonly NativePickerOption[]
	value?: string
	defaultValue?: string
	onValueChange?: (value: string) => void
	disabled?: boolean
	accessibilityLabel?: string
}

export declare const NativePicker: UniversalComponent<NativePickerProps>
