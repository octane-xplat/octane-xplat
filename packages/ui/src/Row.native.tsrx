/** @jsxImportSource @nativescript-community/octane */
import type { RowProps } from "./props";
import { cx } from "./cx";
export function Row(props: RowProps) @{
	<flexboxlayout flexDirection="row" className={cx(props.className)} style={props.style}>
		{props.children}
	</flexboxlayout>
}
