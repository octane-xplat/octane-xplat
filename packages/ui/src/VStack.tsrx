/** @jsxImportSource @nativescript-community/octane */
import type { VStackProps } from './props';
import { Stack } from './Stack';

/** Vertical flow stack — `Stack` with `direction="vertical"`.
 *  `vAlign` is the main axis (justify-content), `hAlign` the cross axis. */
export function VStack(props: VStackProps) @{
	return <Stack
		{...props}
		direction="vertical"
		hAlign={props.hAlign ?? props.align}
		vAlign={props.vAlign ?? props.justify}
	/>;
}
