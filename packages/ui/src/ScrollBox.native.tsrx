/** @jsxImportSource @nativescript-community/octane */
import { View } from './View.native.tsrx';
import type { ScrollBoxProps } from './props';

/** Inline native content shell. A nested ListView owns its own scrolling. */
export function ScrollBox(props: ScrollBoxProps) @{
	<View {...props}>{props.children}</View>
}
