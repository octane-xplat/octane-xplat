/** @jsxImportSource @nativescript-community/octane */
import type { RowProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";
import { layoutChildProps } from './layout-child.native';
import { usePan } from './pan.native.tsrx';
export function Row(props: RowProps) @{
	<flexboxlayout id={props.id} ref={(v: any) => { if (v) { applyEscapeProps(v, props); props.bind?.(v); } }} flexDirection="row" className={cx(props.className)} style={props.style} {...layoutChildProps(props)} onPan={usePan(props.onPan)} onSwipe={props.onSwipe}>
		{props.children}
	</flexboxlayout>
}
