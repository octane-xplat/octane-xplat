/** @jsxImportSource @octane-xplat/macos-renderer */
import type { HStackProps } from './props'
import { Stack } from './layout.macos.tsrx'

/** Horizontal flow stack — `Stack` with `direction="horizontal"`. */
export function HStack(props: HStackProps) @{
	return <Stack
		{...props}
		direction="horizontal"
		hAlign={props.hAlign ?? props.justify}
		vAlign={props.vAlign ?? props.align}
	/>
}
