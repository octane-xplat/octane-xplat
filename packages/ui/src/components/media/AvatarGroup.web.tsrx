/** @jsxImportSource @octane-xplat/jsx/dom */
import { descriptorChildren } from 'octane'
import type { AvatarGroupProps, AvatarGroupOverflowProps } from '../../props'
import { applyEscapeProps } from '../overlays/escape-props'
import { isChildrenBlock } from 'octane'
import { toChildArray, mapChildren } from '../../internal/rendering/child-array'
import { Avatar, AvatarStatusDot } from './Avatar.web.tsrx'
import type { JSX } from 'octane/jsx-runtime'

/** AvatarGroupOverflow — the `+N` counter part (Astryx). `label` overrides
 *  the rendered text. */
export function AvatarGroupOverflow(props: AvatarGroupOverflowProps): JSX.Element @{
	const size =
		typeof props.size === 'number'
			? props.size
			: (({ xsm: 16, sm: 24, md: 32, lg: 40, xl: 48 } as Record<string, number>)[
					props.size ?? 'md'
				] ?? 32)

	<div
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		className={['vx-avatar-overflow', props.className]}
		style={{
			width: size,
			height: size,
			borderRadius: size / 2,
			...((props.style as object) ?? {}),
		}}
	>
		{props.label ?? `+${props.count ?? 0}`}
	</div>
}

/** AvatarGroup — row of overlapping avatars. `max` collapses the rest into
 *  a `+N` avatar; an explicit `AvatarGroupOverflow` child renders instead
 *  when supplied. Overlap is one-third of `size`. */
function AvatarGroupImpl(props: AvatarGroupProps): JSX.Element @{
	const size = props.size ?? 32
	const children = isChildrenBlock(props.children) ? [] : toChildArray(props.children)
	const hasOverflowChild = children.some((c: any) => c?.type === AvatarGroupOverflow)
	const shown =
		props.max != null
			? children.filter((c: any) => c?.type !== AvatarGroupOverflow).slice(0, props.max)
			: children

	const overflow = children.length - shown.length
	const itemStyle = (i: number) => (i === 0 ? undefined : { marginLeft: -size / 3 })

	<div
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		className={['vx-avatar-group', props.className]}
		style={props.style}
	>
		{isChildrenBlock(props.children)
			? props.children
			: mapChildren(shown, (child: any, i: number) => (
					<div className="vx-avatar-group-item" style={itemStyle(i)}>
						{child}
					</div>
				))}
		{overflow > 0 && !hasOverflowChild ? (
			<div className="vx-avatar-group-item" style={itemStyle(shown.length)}>
				<AvatarGroupOverflow count={overflow} size={size} />
			</div>
		) : null}
	</div>
}

/** Ask Octane to preserve inspectable child descriptors for collection operations. */
export const AvatarGroup: typeof AvatarGroupImpl = descriptorChildren(AvatarGroupImpl)
