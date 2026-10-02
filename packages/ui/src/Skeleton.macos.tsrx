/** @jsxImportSource @octane-xplat/macos-renderer */
import type { SkeletonProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";

/** Skeleton — placeholder block while content loads. Sizing via
 *  `width`/`height` or the app's `vx-skeleton` styling. */
export function Skeleton(props: SkeletonProps) @{
	<flexboxlayout
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		className={cx('vx-skeleton', props.className)}
		style={{ ...props.style, width: props.width, height: props.height }}
	/>
}
