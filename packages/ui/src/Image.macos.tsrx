/** @jsxImportSource @octane-xplat/jsx */
import { useMemo } from 'octane'
import { mergeStyle } from './style-merge'
import { layoutChildProps } from './layout-child'
import { cx } from '@octane-xplat/lib'
import { appKitImageSource } from './svg-image.macos'
import { hashToPngBase64 } from './hash-image'
import type { ImageProps } from './props'
import { objectPositionCSSValue, resolveContentPosition } from './image-content'

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

// The AppKit host paints a placeholder in the same image view while loading.
declare module '@octane-xplat/jsx/intrinsics' {
	interface ImageProps {
		placeholder?: string
	}
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

	// The AppKit image view normalizes fit and position while keeping native
	// intrinsic measurement/accessibility. Percentages use the free space.
	// `decoding` is ignored — AppKit image decodes are synchronous, and remote
	// fetches take no decode-mode hint.
	const style = mergeStyle({
		objectFit: props.contentFit ?? 'cover',
		...(props.contentPosition !== undefined
			? { objectPosition: objectPositionCSSValue(resolveContentPosition(props.contentPosition)) } : {}),
	}, props.style)

	<image
		id={props.id}
		src={src}
		placeholder={placeholder}
		className={cx(props.className)}
		{...layoutChildProps(props, style)}
		accessibilityLabel={props.alt ?? ''}
	/>
}
