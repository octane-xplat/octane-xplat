/** @jsxImportSource @nativescript-community/octane */
import type { AbsoluteProps } from './props';
import { cx } from './cx';
import { applyEscapeProps } from './escape-props';
import { glassClassOf, glassConfigOf } from './glass';

export function Absolute(props: AbsoluteProps) @{
	<absolutelayout id={props.id} ref={(view: any) => applyEscapeProps(view, props)} iosGlassEffect={glassConfigOf(props.glass)} className={cx('vx-absolute', glassClassOf(props.glass), props.className)} style={props.style}>
		{props.children}
	</absolutelayout>
}
