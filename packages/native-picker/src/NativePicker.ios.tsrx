/** @jsxImportSource @nativescript-community/octane */
import { registerElement } from '@nativescript-community/octane'
import type { Attributes } from '@nativescript-community/octane/intrinsics'
import { SwiftUI, UIDataDriver, registerSwiftUI } from '@nativescript/swift-ui'
import { useState } from 'octane'
import type { NativePickerProps } from './types'

declare const XplatPickerProvider: any

declare module '@nativescript-community/octane/intrinsics' {
	interface NativeScriptElements {
		xplatiospicker: Attributes<typeof SwiftUI>
	}
}

registerElement('xplatiospicker', SwiftUI)
registerSwiftUI('xplat-native-picker', (owner: any) =>
	new UIDataDriver(new XplatPickerProvider(), owner),
)

/** Renders a menu-style SwiftUI Picker through NativeScript's SwiftUI bridge. */
export function NativePicker(props: NativePickerProps) @{
	const controlled = props.value !== undefined
	const [internalValue, setInternalValue] = useState(props.defaultValue ?? props.options[0]?.value ?? '')
	const value = controlled ? props.value! : internalValue
	const update = (nextValue: string) => {
		if (!controlled) setInternalValue(nextValue)
		props.onValueChange?.(nextValue)
	}

	<xplatiospicker
		id={props.id}
		className={props.className}
		style={props.style}
		swiftId="xplat-native-picker"
		data={{
			label: props.label,
			accessibilityLabel: props.accessibilityLabel ?? props.label,
			options: props.options.map((option) => ({ ...option })),
			value,
			disabled: props.disabled ?? false,
		}}
		onSwiftUIEvent={(event: any) => {
			const nextValue = event.data?.value
			if (typeof nextValue === 'string') update(nextValue)
		}}
	/>;
}
