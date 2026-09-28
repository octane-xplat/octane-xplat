/** @jsxImportSource @xplat/macos/renderer */
import type { HeadingProps, IconProps, MeterProps } from './props'

export function Meter(props: MeterProps) @{
	<label id={props.id} className={props.className} accessibilityRole="progressbar">{String(props.value ?? 0) + ' / ' + String(props.max ?? 100)}</label>
}

export function Heading(props: HeadingProps) @{
	<label id={props.id} className={props.className} style={props.style} accessibilityRole="heading">{props.children}</label>
}

export function Icon(props: IconProps) @{
	<label className={props.className} style={props.style} accessibilityLabel={props.accessibilityLabel ?? props.name}>{props.name}</label>
}
