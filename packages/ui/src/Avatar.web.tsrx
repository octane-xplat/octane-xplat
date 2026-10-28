/** @jsxImportSource @octane-xplat/jsx/dom */
import type { AvatarProps, AvatarSize, AvatarStatusDotProps, AvatarStatusDotVariant } from './props'
import { styleRecord } from './style-merge'
import { applyEscapeProps } from './escape-props'

const namedSizes: Record<string, number> = { xsm: 16, sm: 24, md: 32, lg: 40, xl: 48 }

function sizePx(size: AvatarSize | undefined): number {
	if (size == null) {
		return 32
	}

	return typeof size === 'number' ? size : (namedSizes[size] ?? 32)
}

function initials(name: string): string {
	const parts = name.trim().split(/\s+/)
	return (parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')
}

/** AvatarStatusDot — status dot overlay part for `Avatar` (Astryx). */
export function AvatarStatusDot(props: AvatarStatusDotProps) @{
	<span
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		className={['vx-avatar-status', `vx-statusdot--${props.variant ?? 'neutral'}`, props.className]}
		style={props.style}
		role="img"
		aria-label={props.label ?? props.variant ?? 'status'}
	/>
}

/** Avatar — circular image with a text fallback when `src` is absent
 *  (Astryx `Avatar`). `name` derives initials + the accessible name;
 *  `status` mounts an `AvatarStatusDot` on the end edge. */
export function Avatar(props: AvatarProps) @{
	const size = sizePx(props.size)
	const box = { width: size, height: size, borderRadius: size / 2 }
	const label = props.alt ?? props.name

	<div
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		className={['vx-avatar', props.className]}
		style={{ ...styleRecord(props.style), ...box }}
		role="img"
		aria-label={label}
	>
		{props.src ? (
			<img
				className="vx-avatar-img"
				src={props.src}
				alt={label}
				style={{ width: size, height: size, borderRadius: size / 2 }}
			/>
		) : (
			<span className="vx-avatar-fallback">
				{props.fallback ?? (props.name ? initials(props.name).toUpperCase() : '')}
			</span>
		)}
		{props.status ? (
			typeof props.status === 'string' ? (
				<AvatarStatusDot
					variant={props.status as AvatarStatusDotVariant}
					label={props.name ? `${props.name} is ${props.status}` : undefined}
				/>
			) : (
				props.status
			)
		) : null}
	</div>
}
