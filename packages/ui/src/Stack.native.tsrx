/** @jsxImportSource @nativescript-community/octane */
import type { StackProps } from './props';
import { cx } from './cx';
import { applyEscapeProps } from './escape-props';

export function Stack(props: StackProps) @{
	<gridlayout id={props.id} ref={(view: any) => applyEscapeProps(view, props)} rows="*" columns="*" className={cx('vx-stack', props.className)} style={props.style}>
		{props.children}
	</gridlayout>
}
