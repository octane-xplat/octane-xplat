/** @jsxImportSource @nativescript-community/octane */
import type { SpacerProps } from './props';
import { cx } from '@octane-xplat/lib';
import { applyEscapeProps } from './escape-props';

/**
 * Flexible empty region that grows to fill spare space in a `Stack`/`HStack`/`VStack`. Import from `@octane-xplat/ui`.
 *
 * @see StackProps.
 */
export function Spacer(props: SpacerProps) @{
	<stacklayout id={props.id} ref={(view: any) => applyEscapeProps(view, props)} flexGrow={1} className={cx('vx-spacer', props.className)} style={props.style as any} />
}
