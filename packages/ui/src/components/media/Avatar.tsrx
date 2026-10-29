/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle, styleRecord } from '../../internal/layout/style-merge'
import type { AvatarProps, AvatarSize, AvatarStatusDotProps, AvatarStatusDotVariant } from '../../props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from '../overlays/escape-props'
import { Image } from './Image'

/** Avatar — circular image with a text fallback when `src` is absent.
 *  `size` sets the square + border-radius inline so the circle is identical
 *  across targets. */
const namedSizes: Record<string, number> = { xsm: 16, sm: 24, md: 32, lg: 40, xl: 48 }
const px = (s: AvatarSize | undefined) =>
	s == null ? 32 : typeof s === 'number' ? s : (namedSizes[s] ?? 32)

const initials = (name: string) => {
	const p = name.trim().split(/\s+/)
	return ((p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase()
}

/** AvatarStatusDot — status dot overlay part (Astryx). */
export function AvatarStatusDot(props: AvatarStatusDotProps) @{
	<masonview
		id={props.id}
		className={cx(
			'vx-avatar-status',
			`vx-statusdot--${props.variant ?? 'neutral'}`,
			props.className,
		)}
		style={props.style}
		accessibilityLabel={props.label ?? props.variant ?? 'status'}
	/>
}

export function Avatar(props: AvatarProps) @{
	const size = px(props.size)
	const box = { width: size, height: size, borderRadius: size / 2 }
	const label = props.alt ?? props.name
	const fb = props.fallback ?? (props.name ? initials(props.name) : '')

	<masonview
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		className={cx('vx-avatar', props.className)}
		style={mergeStyle({ display: 'flex' }, { ...styleRecord(props.style), ...box })}
		accessibilityLabel={label}
	>
		{props.src ? (
			<Image
				className="vx-avatar-img"
				src={props.src}
				alt={label}
				style={{ width: size, height: size, borderRadius: size / 2 }}
			/>
		) : (
			<label className="vx-avatar-fallback" text={fb} />
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
	</masonview>
}
