/** @jsxImportSource @nativescript-community/octane */
import { registerElement } from '@nativescript-community/octane'
import type { Attributes } from '@nativescript-community/octane/intrinsics'
import { ComposeDataDriver, JetpackCompose, registerJetpackCompose } from '@nativescript/jetpack-compose'
import { useState } from 'octane'
import type { MaterialDropdownProps } from './android/types'

declare const com: any

declare module '@nativescript-community/octane/intrinsics' {
	interface NativeScriptElements {
		xplatandroidpicker: Attributes<typeof JetpackCompose>
	}
}

registerElement('xplatandroidpicker', JetpackCompose)
registerJetpackCompose('xplat-material-dropdown', (owner: any) =>
	new ComposeDataDriver(new com.octanexplat.nativepicker.XplatPickerProvider(), owner),
)

/** Renders a Material 3 dropdown through the NativeScript Jetpack Compose bridge. */
export function MaterialDropdown(props: MaterialDropdownProps) @{
	const controlled = props.selectedKey !== undefined
	const [internalKey, setInternalKey] = useState(props.defaultSelectedKey ?? props.items[0]?.key ?? '')
	const selectedKey = controlled ? props.selectedKey! : internalKey
	const data = {
		label: props.label,
		accessibilityLabel: props.accessibilityLabel ?? props.label,
		options: props.items.map((item) => ({
			value: item.key,
			label: item.text,
			disabled: item.enabled === false ? 1 : 0,
		})),
		value: selectedKey,
		disabled: props.enabled === false ? 1 : 0,
	}
	const update = (nextKey: string) => {
		if (!controlled) setInternalKey(nextKey)
		props.onSelectedKeyChange?.(nextKey)
	}

	<xplatandroidpicker
		id={props.id}
		className={props.className}
		style={props.style}
		composeId="xplat-material-dropdown"
		data={data}
		onComposeEvent={(event: any) => {
			if (typeof event.data === 'string') update(event.data)
		}}
	/>;
}
