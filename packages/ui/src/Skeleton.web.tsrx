import type { SkeletonProps } from "./props";
import { styleRecord } from './style-merge'
import { applyEscapeProps } from "./escape-props";

/** Skeleton — placeholder block while content loads. Sizing via
 *  `width`/`height` or the app's `vx-skeleton` styling; pulse animation is
 *  an app-level choice (no shared keyframes — unstyled contract). */
export function Skeleton(props: SkeletonProps) @{
	<div
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		aria-busy="true"
		className={['vx-skeleton', props.className]}
		style={{ ...styleRecord(props.style), width: props.width, height: props.height }}
	/>
}
