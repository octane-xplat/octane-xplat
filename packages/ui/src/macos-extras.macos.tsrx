/** @jsxImportSource @xplat/macos/renderer */
import type { HeadingProps, MeterProps } from './props'
import { cx } from './cx'

export function Meter(props: MeterProps) @{
	const size = props.size ?? 24
	const strokeWidth = Math.max(0, Math.min(props.strokeWidth ?? 3, size))

	// Track ring via layer chrome; the progress arc itself needs a stroked
	// CAShapeLayer — not bridged yet, so the ring renders unfilled.
	<flexboxlayout
		id={props.id}
		className={cx('vx-meter', props.className)}
		style={{
			width: size,
			height: size,
			borderWidth: strokeWidth,
			borderColor: props.trackColor ?? '#e1ecf7',
			borderRadius: size / 2,
			...props.style,
		}}
		accessible={true}
		accessibilityRole="progressbar"
		accessibilityValue={String(props.value ?? 0) + ' of ' + String(props.max ?? 100)}
	>
		{props.children}
	</flexboxlayout>
}

export function Heading(props: HeadingProps) @{
	const level = props.level ?? 2

	<label
		id={props.id}
		className={cx('vx-heading', `vx-h${level}`, props.className)}
		style={props.style}
		accessibilityRole="heading"
	>
		{props.children}
	</label>
}

