/** @jsxImportSource @octane-xplat/macos-renderer */
import { useMemo } from 'octane'
import { styleRecord } from './style-merge'
import { appKitImageSource } from './svg-image.macos'
import { hashToPngBase64 } from './hash-image'
import type { ImageProps } from './props'

/** `blurhash:`/`thumbhash:` decode to a data: PNG (./hash-image — the same
 *  decode the other leaves run); `data:`/`res://`/`~/`/file paths pass through
 *  to the AppKit host. Remote placeholder URLs are dropped per the shared
 *  contract — a placeholder that must fetch first is pointless. */
function appKitPlaceholder(placeholder: string): string | undefined {
	const png = hashToPngBase64(placeholder)
	if (png) {
		return `data:image/png;base64,${png}`
	}

	if (/^https?:\/\//i.test(placeholder)) {
		return undefined
	}

	return appKitImageSource(placeholder)
}

export function Image(props: ImageProps) @{
	const srcString = (Array.isArray(props.src) ? props.src[0]?.uri : props.src) ?? ''
	const src = useMemo(() => appKitImageSource(srcString), [srcString])
	const svg = src.startsWith('data:image/svg+xml')
	// The host paints the placeholder into the same view while a remote src
	// fetches (or a local decode is pending) and leaves it standing on failure.
	const placeholder = useMemo(
		() => (props.placeholder && !svg ? appKitPlaceholder(props.placeholder) : undefined),
		[props.placeholder, svg],
	)

	// contentFit → style.objectFit (the renderer maps contain/scale-down/
	// fill/none; 'cover' degrades to scale-down — AppKit has no cover
	// scaling mode). contentPosition is unimplemented on this leaf.
	// `decoding` is ignored — AppKit image decodes are synchronous, and remote
	// fetches take no decode-mode hint.
	const style = {
		objectFit: props.contentFit ?? 'cover',
		...styleRecord(props.style),
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
