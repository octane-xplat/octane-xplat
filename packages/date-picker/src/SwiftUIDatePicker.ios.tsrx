/** @jsxImportSource @octane-xplat/jsx */
import { registerElement } from '@nativescript-community/octane'
import type { Attributes } from '@octane-xplat/jsx/intrinsics'
import { SwiftUI, UIDataDriver, registerSwiftUI } from '@nativescript/swift-ui'
import { useState } from 'octane'
import type { SwiftUIDatePickerProps } from './ios/types'

declare const XplatDatePickerProvider: any

declare module '@octane-xplat/jsx/intrinsics' {
	interface NativeElements<TElement> {
		xplatiosdatepicker: Attributes<
			TElement,
			{
				swiftId?: string
				data?: Record<string, unknown>
				onSwiftUIEvent?: (event: { data?: unknown }) => void
			}
		>
	}
}

registerElement('xplatiosdatepicker', SwiftUI)
registerSwiftUI(
	'xplat-swiftui-datepicker',
	(owner: any) => new UIDataDriver(new XplatDatePickerProvider(), owner),
)

/** Renders a SwiftUI DatePicker through NativeScript's SwiftUI bridge. */
export function SwiftUIDatePicker(props: SwiftUIDatePickerProps): unknown @{
	const controlled = props.selection !== undefined
	const [internalSelection, setInternalSelection] = useState<Date | undefined>(
		props.defaultSelection,
	)

	const selection = controlled ? props.selection! : internalSelection

	<xplatiosdatepicker
		id={props.id}
		className={props.className}
		style={props.style}
		swiftId="xplat-swiftui-datepicker"
		data={{
			title: props.title,
			selection: selection?.getTime(),
			range: {
				start: props.minimumDate?.getTime(),
				end: props.maximumDate?.getTime(),
			},
			displayedComponents: props.displayedComponents ?? ['date'],
			pickerStyle: props.pickerStyle ?? 'automatic',
			disabled: props.disabled ?? false,
		}}
		onSwiftUIEvent={(event: any) => {
			const millis = event.data?.date
			if (typeof millis !== 'number') {
				return
			}

			const next = new Date(millis)
			if (!controlled) {
				setInternalSelection(next)
			}

			props.onSelectionChange?.(next)
		}}
	/>
}
