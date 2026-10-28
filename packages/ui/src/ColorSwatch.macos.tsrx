/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle, styleRecord } from './style-merge'
import type { ColorSwatchProps } from './props'
import { cx } from '@octane-xplat/lib'
import { nativeAccessibilityRole } from './escape-props'
import { normalizeHex } from './color'

/** Small color chip. */
export function ColorSwatch(props: ColorSwatchProps) @{
	const size = props.size ?? 24
	const color = normalizeHex(props.color) ?? '#000000'

	<masonview
		id={props.id}
		className={cx('vx-color-swatch', props.className)}
		style={mergeStyle(
			{
				display: 'flex',
				width: size,
				height: size,
				borderRadius: 4,
				borderWidth: 1,
				borderColor: 'rgba(0,0,0,0.15)',
				backgroundColor: color,
			},
			styleRecord(props.style),
		)}
		accessibilityRole={nativeAccessibilityRole('image')}
		accessibilityLabel={props.accessibilityLabel ?? color}
	/>
}
