/** An option accepted by NativePicker. Values identify options and must be unique. */
export interface NativePickerOption {
	value: string
	label: string
	disabled?: boolean
}

/** Props shared by the web, SwiftUI, and Jetpack Compose implementations. */
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
