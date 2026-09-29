/** @jsxImportSource @nativescript-community/octane */
import { registerElement } from '@nativescript-community/octane'
import type { Attributes } from '@nativescript-community/octane/intrinsics'
import { SwiftUI, UIDataDriver, registerSwiftUI } from '@nativescript/swift-ui'
import { useState } from 'octane'
import type { SwiftUIPickerProps } from './ios/types'

declare const XplatPickerProvider: any

declare module '@nativescript-community/octane/intrinsics' {
	interface NativeScriptElements {
		xplatiospicker: Attributes<typeof SwiftUI>
	}
}

registerElement('xplatiospicker', SwiftUI)
registerSwiftUI('xplat-swiftui-picker', (owner: any) =>
	new UIDataDriver(new XplatPickerProvider(), owner),
)

/** Renders a menu-style SwiftUI Picker through NativeScript's SwiftUI bridge. */
export function SwiftUIPicker(props: SwiftUIPickerProps) @{
	const controlled = props.selection !== undefined
	const [internalSelection, setInternalSelection] = useState(props.defaultSelection ?? props.options[0]?.id ?? '')
	const selection = controlled ? props.selection! : internalSelection
	const update = (nextSelection: string) => {
		if (!controlled) setInternalSelection(nextSelection)
		props.onSelectionChange?.(nextSelection)
	}

	<xplatiospicker
		id={props.id}
		className={props.className}
		style={props.style}
		swiftId="xplat-swiftui-picker"
		data={{
			label: props.label,
			accessibilityLabel: props.accessibilityLabel ?? props.label,
			options: props.options.map((option) => ({
				value: option.id,
				label: option.title,
				disabled: option.disabled ?? false,
			})),
			value: selection,
			disabled: props.disabled ?? false,
		}}
		onSwiftUIEvent={(event: any) => {
			const nextSelection = event.data?.value
			if (typeof nextSelection === 'string') update(nextSelection)
		}}
	/>;
}
