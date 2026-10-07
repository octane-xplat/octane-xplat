/** @jsxImportSource @octane-xplat/macos-renderer */
import type { ImageProps } from './props'

/** Image — the AppKit host's <image>. The engine leaf has no macOS backend
 *  (Glide/SDWebImage are iOS/Android), so this mirrors the core AppKit path:
 *  local src grammar, first array entry for multi-source, contentFit →
 *  style.objectFit ('cover' degrades to scale-down — AppKit has no cover
 *  scaling mode); contentPosition is unimplemented here. Engine props are
 *  ignored — no cache engine exists on this target. */
export function Image(props: ImageProps) @{
	const src = (Array.isArray(props.src) ? props.src[0]?.uri : props.src) ?? ''
	const style = {
		objectFit: props.contentFit ?? 'cover',
		...props.style,
	}

	<image
		id={props.id}
		src={src}
		className={props.className}
		{style}
		accessibilityLabel={props.alt ?? ''}
	/>
}
