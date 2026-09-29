/** @jsxImportSource @nativescript-community/octane */
import { registerElement } from '@nativescript-community/octane'
import type { Attributes } from '@nativescript-community/octane/intrinsics'
import { ComposeDataDriver, JetpackCompose, registerJetpackCompose } from '@nativescript/jetpack-compose'
import type { MaterialDatePickerProps } from './android/types'

declare const com: any

declare module '@nativescript-community/octane/intrinsics' {
	interface NativeScriptElements {
		xplatandroiddatepicker: Attributes<typeof JetpackCompose>
	}
}

registerElement('xplatandroiddatepicker', JetpackCompose)
registerJetpackCompose('xplat-material-datepicker', (owner: any) =>
	new ComposeDataDriver(new com.octanexplat.datepicker.XplatDatePickerProvider(), owner),
)

/** Renders a Material 3 DatePicker/TimePicker through the NativeScript Jetpack Compose bridge. */
export function MaterialDatePicker(props: MaterialDatePickerProps) @{
	const data = {
		initialDate: props.initialDate?.getTime() ?? null,
		variant: props.variant ?? 'picker',
		displayedComponents: props.displayedComponents ?? 'date',
		// The bridge's dataSerialize throws on booleans; send numbers.
		showVariantToggle: (props.showVariantToggle ?? true) ? 1 : 0,
		is24Hour: (props.is24Hour ?? true) ? 1 : 0,
		color: props.color,
		elementColors: props.elementColors,
		selectableDates: {
			start: props.selectableDates?.start?.getTime() ?? null,
			end: props.selectableDates?.end?.getTime() ?? null,
		},
	}

	<xplatandroiddatepicker
		id={props.id}
		className={props.className}
		style={props.style}
		accessibilityLabel={props.accessibilityLabel}
		composeId="xplat-material-datepicker"
		data={data}
		onComposeEvent={(event: any) => {
			const millis = event.data?.date
			props.onDateSelected?.(typeof millis === 'number' ? new Date(millis) : null)
		}}
	/>;
}
