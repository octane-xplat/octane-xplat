/** @jsxImportSource @octane-xplat/macos-renderer */
import type { MeterProps } from './props'

export function Meter(props: MeterProps) @{
	<label id={props.id} className={props.className} accessibilityRole="progressbar">
		{String(props.value ?? 0) + ' / ' + String(props.max ?? 100)}
	</label>
}
