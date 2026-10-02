// Shared mapping from the Astryx text axes (type/size/color/weight, used by
// Timestamp and Timer) to the vx-type-*/vx-size-*/vx-color-*/vx-weight-*
// classes in chrome.css. Classes keep the values themeable — native labels
// resolve them through the shared stylesheet the same way web elements do.
import type { TextColor, TextSize, TextType, TextWeight } from './props'

const VALID_TYPES = new Set([
	'body',
	'large',
	'label',
	'supporting',
	'code',
	'display-1',
	'display-2',
	'display-3',
	'inherit',
])

const VALID_SIZES = new Set([
	'4xs',
	'3xs',
	'2xs',
	'xsm',
	'sm',
	'base',
	'lg',
	'xl',
	'2xl',
	'3xl',
	'4xl',
])

const VALID_COLORS = new Set([
	'primary',
	'secondary',
	'disabled',
	'placeholder',
	'accent',
	'inherit',
])
const VALID_WEIGHTS = new Set(['normal', 'medium', 'semibold', 'bold'])

/** Class list for the type/color/weight axes; null when nothing applies. */
export function textRoleClasses(props: {
	type?: TextType
	size?: TextSize
	color?: TextColor
	weight?: TextWeight
}): string[] {
	const out: string[] = []
	if (props.type && VALID_TYPES.has(props.type)) {
		out.push(`vx-type-${props.type}`)
	}

	if (props.size && VALID_SIZES.has(props.size)) {
		out.push(`vx-size-${props.size}`)
	}

	if (props.color && VALID_COLORS.has(props.color)) {
		out.push(`vx-color-${props.color}`)
	}

	if (props.weight && VALID_WEIGHTS.has(props.weight)) {
		out.push(`vx-weight-${props.weight}`)
	}

	return out
}
