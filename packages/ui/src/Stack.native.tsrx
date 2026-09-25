/** @jsxImportSource @nativescript-community/octane */
import type { StackProps } from './props';
import { cx } from './cx';
import { applyEscapeProps } from './escape-props';
import { glassClassOf, glassConfigOf } from './glass';

export function Stack(props: StackProps) @{
	<gridlayout id={props.id} ref={(view: any) => applyEscapeProps(view, props)} rows="*" columns="*" iosGlassEffect={glassConfigOf(props.glass)} className={cx('vx-stack', glassClassOf(props.glass), props.className)} style={props.style}>
		{props.children}
	</gridlayout>
}
