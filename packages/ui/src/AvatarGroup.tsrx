/** @jsxImportSource @nativescript-community/octane */
import { mergeStyle, styleRecord } from './style-merge'
import type { AvatarGroupProps, AvatarGroupOverflowProps } from './props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from './escape-props'
import { toChildArray, mapChildren } from './child-array'
import { Avatar } from './Avatar'

/** AvatarGroup — row of overlapping avatars. `max` collapses the rest into
 *  a `+N` avatar. Overlap is one-third of `size`, applied per-item so it
 *  works identically without relying on sibling CSS selectors. */
export function AvatarGroup(props: AvatarGroupProps) @{
	const size = props.size ?? 32
	const children = typeof props.children === 'function' ? [] : toChildArray(props.children)
	const shown = props.max != null ? children.slice(0, props.max) : children
	const overflow = children.length - shown.length
	const itemStyle = (i: number) => (i === 0 ? undefined : { marginLeft: -size / 3 })

	<masonview
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		className={cx('vx-avatar-group', props.className)}
		style={mergeStyle({ display: 'flex' }, props.style)}
	>
		{typeof props.children === 'function'
			? props.children
			: mapChildren(shown, (child: any, i: number) => (
					<masonview
						className="vx-avatar-group-item"
						style={mergeStyle({ display: 'flex' }, itemStyle(i))}
					>
						{child}
					</masonview>
				))}
		{overflow > 0 ? (
			<masonview
				className="vx-avatar-group-item"
				style={mergeStyle({ display: 'flex' }, itemStyle(shown.length))}
			>
				<Avatar fallback={`+${overflow}`} size={size} />
			</masonview>
		) : null}
	</masonview>
}

/** AvatarGroupOverflow — the `+N` counter part (Astryx). */
export function AvatarGroupOverflow(props: AvatarGroupOverflowProps) @{
	const size = typeof props.size === 'number' ? props.size : 32

	<masonview
		id={props.id}
		className={cx('vx-avatar-overflow', props.className)}
		style={mergeStyle(
			{ width: size, height: size, borderRadius: size / 2 },
			styleRecord(props.style),
		)}
	>
		<label text={typeof props.label === 'string' ? props.label : `+${props.count ?? 0}`} />
	</masonview>
}
