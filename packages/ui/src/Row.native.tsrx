/** @jsxImportSource @nativescript-community/octane */
import type { RowProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";
export function Row(props: RowProps) @{
	<flexboxlayout ref={(v: any) => applyEscapeProps(v, props)} flexDirection="row" className={cx(props.className)} style={props.style}>
		{props.children}
	</flexboxlayout>
}
