/** @jsxImportSource @octane-xplat/macos-renderer */
import type { BadgeProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";

/** Badge — inline label chip. Pure composition; `vx-badge` supplies only the
 *  inline-flex row so apps own all visual styling. */
export function Badge(props: BadgeProps) @{
	<flexboxlayout ref={(v: any) => applyEscapeProps(v, props)} id={props.id} className={cx('vx-badge', props.className)} style={props.style}>
		{props.children}
	</flexboxlayout>
}
