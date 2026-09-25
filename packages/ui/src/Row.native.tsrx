/** @jsxImportSource @nativescript-community/octane */
import type { RowProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";
import { glassClassOf, glassConfigOf } from './glass';
import { layoutChildProps } from './layout-child.native';
export function Row(props: RowProps) @{
	<flexboxlayout id={props.id} ref={(v: any) => applyEscapeProps(v, props)} flexDirection="row" iosGlassEffect={glassConfigOf(props.glass)} className={cx(glassClassOf(props.glass), props.className)} style={props.style} {...layoutChildProps(props)}>
		{props.children}
	</flexboxlayout>
}
