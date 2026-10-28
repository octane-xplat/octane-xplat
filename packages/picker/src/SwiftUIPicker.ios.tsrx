/** @jsxImportSource @octane-xplat/jsx */
import { registerElement } from '@nativescript-community/octane'
import type { Attributes } from '@octane-xplat/jsx/intrinsics'
import { SwiftUI, UIDataDriver, registerSwiftUI } from '@nativescript/swift-ui'
import { useState } from 'octane'
import type { SwiftUIPickerProps } from './ios/types'

declare const XplatPickerProvider: any

declare module '@octane-xplat/jsx/intrinsics' {
	interface NativeElements<TElement> {
		xplatiospicker: Attributes<
			TElement,
			{
				swiftId?: string
				data?: Record<string, unknown>
				onSwiftUIEvent?: (event: { data?: unknown }) => void
			}
		>
	}
}

registerElement('xplatiospicker', SwiftUI)
registerSwiftUI(
	'xplat-swiftui-picker',
	(owner: any) => new UIDataDriver(new XplatPickerProvider(), owner),
)

/** Renders a menu-style SwiftUI Picker through NativeScript's SwiftUI bridge. */
export function SwiftUIPicker(props: SwiftUIPickerProps) @{
	const controlled = props.selection !== undefined
	const [internalSelection, setInternalSelection] = useState(
		props.defaultSelection ?? props.options[0]?.id ?? '',
	)

	// Uncontrolled with a blank internal selection displays the first option
	// once options arrive — matching the other leaves' auto-select-first.
	const selection = controlled
		? props.selection!
		: internalSelection || (props.options[0]?.id ?? '')

	const update = (nextSelection: string) => {
		if (!controlled) {
			setInternalSelection(nextSelection)
		}

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
			if (typeof nextSelection === 'string') {
				update(nextSelection)
			}
		}}
	/>
}
