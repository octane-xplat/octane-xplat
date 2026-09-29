import type { UniversalComponent } from 'octane/universal'

export interface SwiftUIPickerOption {
	id: string
	title: string
	disabled?: boolean
}

export interface SwiftUIPickerProps {
	id?: string
	className?: any
	style?: any
	label: string
	options: readonly SwiftUIPickerOption[]
	selection?: string
	defaultSelection?: string
	onSelectionChange?: (selection: string) => void
	disabled?: boolean
	accessibilityLabel?: string
}

export declare const SwiftUIPicker: UniversalComponent<SwiftUIPickerProps>
