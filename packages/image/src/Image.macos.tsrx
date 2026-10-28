/** @jsxImportSource @octane-xplat/macos-renderer */
import { useMemo } from 'octane'
import type { ImageProps } from './props'
import { hashToPngBase64 } from './hash-image'

/** `blurhash:`/`thumbhash:` decode to a data: PNG (./hash-image — the ui
 *  package's copy); `data:`/`res://`/`~/`/file paths pass through to the
 *  AppKit host. Remote placeholder URLs are dropped per the shared contract —
 *  a placeholder that must fetch first is pointless. */
function appKitPlaceholder(placeholder: string): string | undefined {
	const png = hashToPngBase64(placeholder)
	if (png) {
		return `data:image/png;base64,${png}`
	}

	if (/^https?:\/\//i.test(placeholder)) {
		return undefined
	}

	return placeholder
}

/** Image — the AppKit host's <image>. The engine leaf has no macOS backend
 *  (Glide/SDWebImage are iOS/Android), so this mirrors the core AppKit path:
 *  local src grammar, remote http(s) fetches, first array entry for
 *  multi-source, contentFit → style.objectFit ('cover' degrades to scale-down
 *  — AppKit has no cover scaling mode); contentPosition is unimplemented here.
 *  `placeholder` paints into the same view while a load is pending, same as
 *  core. Other engine props are ignored — no cache engine exists on this
 *  target. */
export function Image(props: ImageProps) @{
	const src = (Array.isArray(props.src) ? props.src[0]?.uri : props.src) ?? ''
	const placeholder = useMemo(
		() => (props.placeholder ? appKitPlaceholder(props.placeholder) : undefined),
		[props.placeholder],
	)

	const style = {
		objectFit: props.contentFit ?? 'cover',
		...(typeof props.style === 'object' ? props.style : null),
	}

	<image
		id={props.id}
		src={src}
		placeholder={placeholder}
		className={props.className}
		{style}
		accessibilityLabel={props.alt ?? ''}
	/>
}
