import type { NativeModifier, NativeModifierValue } from '../../props'

type StyleValues = Extract<NativeModifier, { type: 'style' }>['values']

const style = (values: StyleValues): NativeModifier => ({ type: 'style', values })

/** Serializable modifier factories for the platform-authentic UI subpaths. */
export const modifier: {
	/** Background-color modifier. */
	background: (color: string) => NativeModifier
	/** Corner-radius modifier. */
	cornerRadius: (radius: number) => NativeModifier
	/** Opacity modifier. */
	opacity: (value: number) => NativeModifier
	/** Uniform padding modifier — number for px, string for shorthand. */
	padding: (value: number | string) => NativeModifier
	/** Fixed frame-size modifier. */
	frame: (width: number | string, height: number | string) => NativeModifier
	/** Arbitrary style-bag modifier — escape hatch for unwrapped keys. */
	style: (values: StyleValues) => NativeModifier
	/** Raw native-property modifier — escape hatch outside the style bag. */
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
