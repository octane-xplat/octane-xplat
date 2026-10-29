/** @jsxImportSource @octane-xplat/jsx */
import type { SkeletonProps } from '../../props'
import { mergeStyle, styleRecord } from '../../internal/layout/style-merge'
import { cx } from '@octane-xplat/lib'

/** Skeleton — placeholder block; `radius` resolves to dips on native. */
export function Skeleton(props: SkeletonProps) @{
	const radius =
		props.radius === 'circle'
			? 9999
			: props.radius === 'rounded'
				? 6
				: props.radius === 'square'
					? 0
					: undefined

	<masonview
		id={props.id}
		className={cx('vx-skeleton', props.className)}
		style={mergeStyle(
			{ width: props.width, height: props.height, borderRadius: radius },
			styleRecord(props.style),
		)}
	/>
}
