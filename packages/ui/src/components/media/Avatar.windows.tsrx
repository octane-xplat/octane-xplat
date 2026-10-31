/** @jsxImportSource @octane-xplat/jsx */
import type { View as NativeView } from '@nativescript/core'
import { mergeStyle, styleRecord } from '../../internal/layout/style-merge'
import type {
	AvatarProps,
	AvatarSize,
	AvatarStatusDotProps,
	AvatarStatusDotVariant,
} from '../../props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from '../overlays/escape-props'
import { Image } from './Image'

const namedSizes: Record<string, number> = { xsm: 16, sm: 24, md: 32, lg: 40, xl: 48 }
// A source-less WinUI Image peer has no automation bounds. A transparent RGBA
// pixel supplies the frame while the initials remain the visible content.
const transparentImage =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgAAIAAAUAAXpeqz8AAAAASUVORK5CYII='
const px = (size: AvatarSize | undefined) =>
	size == null ? 32 : typeof size === 'number' ? size : (namedSizes[size] ?? 32)

function initials(name: string): string {
	const parts = name.trim().split(/\s+/)
	return (
		(parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')
	).toUpperCase()
}

/** Status dot positioned on the avatar's end edge. */
export function AvatarStatusDot(props: AvatarStatusDotProps): unknown @{
	<masonview
		id={props.id}
		className={cx(
			'vx-avatar-status',
			`vx-statusdot--${props.variant ?? 'neutral'}`,
			props.className,
		)}
		style={mergeStyle({ position: 'absolute', right: -1, bottom: -1 }, props.style)}
		accessibilityLabel={props.label ?? props.variant ?? 'status'}
	/>
}

/** Circular Windows image with named initials when no source is supplied. */
export function Avatar(props: AvatarProps): unknown @{
	const size = px(props.size)
	const box = { width: size, height: size, borderRadius: size / 2 }
	const label = props.alt ?? props.name
	const fallback = props.fallback ?? (props.name ? initials(props.name) : '')

	<masonview
		ref={(view: NativeView | null) => applyEscapeProps(view, props)}
		id={props.id}
		className={cx('vx-avatar', props.className)}
		style={mergeStyle(
			{ display: 'flex', position: 'relative' },
			{ ...styleRecord(props.style), ...box },
		)}
	>
		// A named transparent image supplies the same Image peer for the initials fallback.
		// The label remains visible and separately readable; it cannot resize the circle.
		<Image
			className="vx-avatar-img"
			src={props.src || transparentImage}
			alt={label}
			style={{ ...box, position: 'absolute', left: 0, top: 0 }}
		/>
		@if (!props.src) {
			<label
				className="vx-avatar-fallback"
				text={fallback}
				style={{ fontSize: size * 0.4, maxWidth: size }}
			/>
		}
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
