/** @jsxImportSource @octane-xplat/jsx/dom */
import type { SkeletonProps } from '../../props'
import { styleRecord } from '../../internal/layout/style-merge'
import { applyEscapeProps } from '../overlays/escape-props'

const radiusVar: Record<string, string> = {
	square: 'var(--radius-none, 0)',
	rounded: 'var(--radius-element, 6px)',
	circle: 'var(--radius-full, 9999px)',
}

/** Skeleton — placeholder block while content loads (Astryx `Skeleton`).
 *  `radius` picks the corner shape; `index` staggers the shimmer delay per
 *  sibling; `width`/`height` accept dips or CSS lengths. */
export function Skeleton(props: SkeletonProps) @{
	<div
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		aria-busy="true"
		className={['vx-skeleton', props.className]}
		style={{
			...styleRecord(props.style),
			width: props.width,
			height: props.height,
			borderRadius: props.radius ? radiusVar[props.radius] : undefined,
			animationDelay: props.index != null ? `${props.index * 80}ms` : undefined,
		}}
	/>
}
