/** @jsxImportSource @nativescript-community/octane */
import { mergeStyle } from './style-merge'
import type { SpacerProps } from './props';
import { cx } from '@octane-xplat/lib';
import { applyEscapeProps } from './escape-props';

/**
 * Flexible empty region that grows to fill spare space in a `Stack`/`HStack`/`VStack`. Import from `@octane-xplat/ui`.
 *
 * @see StackProps.
 */
export function Spacer(props: SpacerProps) @{
	<masonview id={props.id} ref={(view: any) => applyEscapeProps(view, props)} className={cx('vx-spacer', props.className)} style={mergeStyle({flexDirection: "column", flexGrow: 1}, mergeStyle({display: "flex"}, props.style as any))}/>
}
