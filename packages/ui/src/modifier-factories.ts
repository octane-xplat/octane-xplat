import type { NativeModifier, NativeModifierValue } from './props'

type StyleValues = Extract<NativeModifier, { type: 'style' }>['values']

const style = (values: StyleValues): NativeModifier => ({ type: 'style', values })

/** Serializable modifier factories for the platform-authentic UI subpaths. */
export const modifier = {
	background: (color: string) => style({ backgroundColor: color }),
	cornerRadius: (radius: number) => style({ borderRadius: radius }),
	opacity: (value: number) => style({ opacity: value }),
	padding: (value: number | string) => style({ padding: value }),
	frame: (width: number | string, height: number | string) => style({ width, height }),
	style,
	nativeProperty: (name: string, value: NativeModifierValue): NativeModifier => ({
		type: 'property',
		name,
		value,
	}),
}
