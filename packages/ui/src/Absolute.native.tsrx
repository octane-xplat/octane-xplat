/** @jsxImportSource @nativescript-community/octane */
import type { AbsoluteProps } from './props';
import { cx } from './cx';
import { applyEscapeProps } from './escape-props';

export function Absolute(props: AbsoluteProps) @{
	<absolutelayout id={props.id} ref={(view: any) => applyEscapeProps(view, props)} className={cx('vx-absolute', props.className)} style={props.style}>
		{props.children}
	</absolutelayout>
}
