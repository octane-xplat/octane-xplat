/** @jsxImportSource @nativescript-community/octane */
import type { SpacerProps } from './props';
import { cx } from './cx';
import { applyEscapeProps } from './escape-props';

export function Spacer(props: SpacerProps) @{
	<stacklayout ref={(view: any) => applyEscapeProps(view, props)} flexGrow={1} className={cx('vx-spacer', props.className)} style={props.style} />
}
