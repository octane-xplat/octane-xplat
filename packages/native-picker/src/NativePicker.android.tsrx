/** @jsxImportSource @nativescript-community/octane */
import { registerElement } from '@nativescript-community/octane'
import type { Attributes } from '@nativescript-community/octane/intrinsics'
import { ComposeDataDriver, JetpackCompose, registerJetpackCompose } from '@nativescript/jetpack-compose'
import { useState } from 'octane'
import type { NativePickerProps } from './types'

declare const com: any

declare module '@nativescript-community/octane/intrinsics' {
	interface NativeScriptElements {
		xplatandroidpicker: Attributes<typeof JetpackCompose>
	}
}

registerElement('xplatandroidpicker', JetpackCompose)
registerJetpackCompose('xplat-native-picker', (owner: any) =>
	new ComposeDataDriver(new com.octanexplat.nativepicker.XplatPickerProvider(), owner),
)

/** Renders a Material dropdown through the NativeScript Jetpack Compose bridge. */
export function NativePicker(props: NativePickerProps) @{
	const controlled = props.value !== undefined
	const [internalValue, setInternalValue] = useState(props.defaultValue ?? props.options[0]?.value ?? '')
	const value = controlled ? props.value! : internalValue
	const data = {
		label: props.label,
		accessibilityLabel: props.accessibilityLabel ?? props.label,
		options: props.options.map((option) => ({
			value: option.value,
			label: option.label,
			disabled: option.disabled ? 1 : 0,
		})),
		value,
		disabled: props.disabled ? 1 : 0,
	}
	const update = (nextValue: string) => {
		if (!controlled) setInternalValue(nextValue)
		props.onValueChange?.(nextValue)
	}

	<xplatandroidpicker
		id={props.id}
		className={props.className}
		style={props.style}
		composeId="xplat-native-picker"
		data={data}
		onComposeEvent={(event: any) => {
			if (typeof event.data === 'string') update(event.data)
		}}
	/>;
}
