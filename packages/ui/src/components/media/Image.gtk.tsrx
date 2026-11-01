/** @jsxImportSource @octane-xplat/jsx */
import { useMemo } from 'octane'
import { styleRecord } from '../../internal/layout/style-merge'
import { hashToPngBase64 } from './hash-image'
import type { ImageProps } from '../../props'

/** `blurhash:`/`thumbhash:` decode to a data: PNG (./hash-image); `data:`,
 *  `res://`, `~/`, file paths and remote URLs pass through to the GTK
 *  image host, which loads them in the renderer (Gdk.Texture/GdkPixbuf +
 *  Soup for remote). Remote placeholder URLs are dropped per the shared
 *  contract — a placeholder that must fetch first is pointless. */
function gtkPlaceholder(placeholder: string): string | undefined {
	const png = hashToPngBase64(placeholder)
	if (png) {
		return `data:image/png;base64,${png}`
	}
	if (/^https?:\/\//i.test(placeholder)) {
		return undefined
	}
	return placeholder
}

/** CSS object-fit `contentFit` onto the GTK picture's stretch mapping.
 *  'none' degrades to scaleDown — Gtk.Picture has no unscaled natural-size
 *  mode; scale-down preserves intrinsic size when the content fits.
 *  `contentPosition` is not supported by the GTK image host (it centres) —
 *  same limitation the macOS leaf records. */
const fitToStretch: Record<string, 'aspectFit' | 'aspectFill' | 'fill' | 'none'> = {
	contain: 'aspectFit',
	cover: 'aspectFill',
	fill: 'fill',
	// Gtk.Picture has no true scale-down or unscaled mode — SCALE_DOWN is the
	// closest (natural size when it fits, shrinks only when larger).
	'scale-down': 'none',
	none: 'none',
}

export function Image(props: ImageProps): unknown @{
	const srcString = (Array.isArray(props.src) ? props.src[0]?.uri : props.src) ?? ''
	const svg = srcString.startsWith('data:image/svg+xml')
	const placeholder = useMemo(
		() => (props.placeholder && !svg ? gtkPlaceholder(props.placeholder) : undefined),
		[props.placeholder, svg],
	)
	const stretch = fitToStretch[props.contentFit ?? 'cover'] ?? 'aspectFill'

	<image
		id={props.id}
		src={srcString}
		placeholder={placeholder}
		stretch={stretch}
		className={props.className}
		style={styleRecord(props.style)}
		accessible={props.alt != null}
		accessibilityLabel={props.alt}
	/>
}
