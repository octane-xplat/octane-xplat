/** @jsxImportSource @nativescript-community/octane */
import { mergeStyle } from './style-merge'
import type { BadgeProps } from "./props";
import { cx } from "@octane-xplat/lib";
import { applyEscapeProps } from "./escape-props";

/** Badge — inline label chip. Pure composition; `vx-badge` supplies only the
 *  inline-flex row so apps own all visual styling. */
export function Badge(props: BadgeProps) @{
	<masonview ref={(v: any) => applyEscapeProps(v, props)} id={props.id} className={cx('vx-badge', props.className)} style={mergeStyle({display: "flex"}, props.style as any)}>
		{props.children}
	</masonview>
}
