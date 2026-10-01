/** @jsxImportSource @nativescript-community/octane */
import type { HStackProps } from './props';
import { Stack } from './Stack';

/** Horizontal flow stack — `Stack` with `direction="horizontal"`.
 *  `hAlign` is the main axis (justify-content), `vAlign` the cross axis. */
export function HStack(props: HStackProps) @{
	return <Stack
		{...props}
		direction="horizontal"
		hAlign={props.hAlign ?? props.justify}
		vAlign={props.vAlign ?? props.align}
	/>;
}
