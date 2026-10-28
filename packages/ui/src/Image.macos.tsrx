/** @jsxImportSource @octane-xplat/jsx */
import { useMemo, useState } from 'octane'
import { mergeStyle } from './style-merge'
import { layoutChildProps } from './layout-child'
import { cx } from '@octane-xplat/lib'
import { appKitImageSource } from './svg-image.macos'
import { hashToPngBase64 } from './hash-image'
import type { ImageProps } from './props'
import { bestImageSource, objectPositionCSSValue, resolveContentPosition } from './image-content'

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
		/** Private AppKit engine request option, outside the public UI Image props. */
		imageCachePolicy?: 'memory-disk' | 'none'
		placeholder?: string
		onImageGeometryChanged?: (geometry: { width: number; height: number; scale: number }) => void
	}
}

export function Image(props: ImageProps) @{
	// The optional image engine passes this private field through JSX spreads;
	// keep the shared public ImageProps contract unchanged.
	const cachePolicy = '__appKitImageCachePolicy' in props && props.__appKitImageCachePolicy === 'none' ? 'none' : 'memory-disk'
	const [geometry, setGeometry] = useState({ width: 0, height: 0, scale: 1 })
	const sources = Array.isArray(props.src) ? props.src : null
	const srcString = (sources
		? bestImageSource(sources, geometry.width, geometry.height, geometry.scale)?.uri
		: props.src as string) ?? ''
	const onGeometry = useMemo(() => (next: typeof geometry) => setGeometry((previous) =>
		previous.width === next.width && previous.height === next.height && previous.scale === next.scale
			? previous : next), [])
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
		imageCachePolicy={cachePolicy}
		placeholder={placeholder}
		onImageGeometryChanged={sources ? onGeometry : undefined}
		className={cx(props.className)}
		{...layoutChildProps(props, style)}
		accessibilityLabel={props.alt ?? ''}
	/>
}

// Private capability handshake: older UI leaves must not silently drop bypass.
Object.defineProperty(Image, '__xplatAppKitImagePolicy', { value: true })
