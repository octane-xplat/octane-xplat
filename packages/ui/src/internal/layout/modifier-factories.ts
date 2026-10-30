import type { NativeModifier, NativeModifierValue } from '../../props'

type StyleValues = Extract<NativeModifier, { type: 'style' }>['values']

const style = (values: StyleValues): NativeModifier => ({ type: 'style', values })

/** Serializable modifier factories for the platform-authentic UI subpaths. */
export const modifier: {
	background: (color: string) => NativeModifier
	cornerRadius: (radius: number) => NativeModifier
	opacity: (value: number) => NativeModifier
	padding: (value: number | string) => NativeModifier
	frame: (width: number | string, height: number | string) => NativeModifier
	style: (values: StyleValues) => NativeModifier
	nativeProperty: (name: string, value: NativeModifierValue) => NativeModifier
} = {
	background: (color: string): NativeModifier => style({ backgroundColor: color }),
	cornerRadius: (radius: number): NativeModifier => style({ borderRadius: radius }),
	opacity: (value: number): NativeModifier => style({ opacity: value }),
	padding: (value: number | string): NativeModifier => style({ padding: value }),
	frame: (width: number | string, height: number | string): NativeModifier =>
		style({ width, height }),
	style,
	nativeProperty: (name: string, value: NativeModifierValue): NativeModifier => ({
		type: 'property',
		name,
		value,
	}),
}
