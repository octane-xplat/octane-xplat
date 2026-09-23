/** @jsxImportSource @nativescript-community/octane */
import type { RowProps } from "./props";
export function Row(props: RowProps) @{
	<flexboxlayout flexDirection="row" className={props.className} style={props.style}>
		{props.children}
	</flexboxlayout>
}
