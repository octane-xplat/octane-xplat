/** @jsxImportSource @xplat/macos/renderer */
import type { VStackProps } from './props'
import { Stack } from './layout.macos.tsrx'

/** Vertical flow stack — `Stack` with `direction="vertical"`. */
export function VStack(props: VStackProps) @{
	return <Stack
		{...props}
		direction="vertical"
		hAlign={props.hAlign ?? props.align}
		vAlign={props.vAlign ?? props.justify}
	/>
}
