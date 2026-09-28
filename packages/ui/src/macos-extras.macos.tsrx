/** @jsxImportSource @xplat/macos/renderer */
import type { HeadingProps, IconProps, MeterProps } from './props'
import { cx } from './cx'

export function Meter(props: MeterProps) @{
	<label id={props.id} className={props.className} accessibilityRole="progressbar">{String(props.value ?? 0) + ' / ' + String(props.max ?? 100)}</label>
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

export function Icon(props: IconProps) @{
	<label className={props.className} style={props.style} accessibilityLabel={props.accessibilityLabel ?? props.name}>{props.name}</label>
}
