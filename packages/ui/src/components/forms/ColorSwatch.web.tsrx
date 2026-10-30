/** @jsxImportSource @octane-xplat/jsx/dom */
import type { ColorSwatchProps } from '../../props'
import { normalizeHex } from '../../theme/color'

import type { JSX } from 'octane/jsx-runtime'
/** Small color chip. */
export function ColorSwatch(props: ColorSwatchProps): JSX.Element {
	const size = props.size ?? 24
	const color = normalizeHex(props.color) ?? '#000000'
	return (
		<div
			id={props.id}
			data-testid={props.testID}
			role="img"
			aria-label={props.accessibilityLabel ?? color}
			className={['vx-color-swatch', props.className]}
			style={{ width: size, height: size, backgroundColor: color }}
		/>
	)
}
