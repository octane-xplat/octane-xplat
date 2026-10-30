import type { ClassValue, CSSProperties } from 'octane/jsx-runtime'

/** Props for the `<AnimatedImage>` element (animated GIF/WebP via Fresco on
 *  Android, SDWebImage on iOS, a plain `<img>` on web). */
export interface AnimatedImageProps {
	/** clsx-style class list applied to the image element. */
	className?: ClassValue
	/** Inline style: CSS text or a camelCase style object. */
	style?: string | CSSProperties
	/** Element id passed through to the host element. */
	id?: string
	/** Image URL — remote http(s) or a bundled asset path. */
	src: string
	/** Accessible description; maps to `alt`/contentDescription. */
	alt?: string
	/** Content fit — same grammar as core Image. Web maps to object-fit;
	 *  ui-image (Fresco/SDWebImage) accepts the same values. */
	stretch?: 'none' | 'fill' | 'aspectFit' | 'aspectFill'
	/** Display width — dips on native, CSS length/number on web. */
	width?: string | number
	/** Display height — same units contract as `width`. */
	height?: string | number
	/** Platform-specific properties are applied after shared props. Native
	 *  bags assign onto the ui-image `Img` view — `noCache`, `decodeWidth`,
	 *  `decodeHeight`, `placeholderImageUri`, `progressiveRenderingEnabled`,
	 *  `cacheKey`, and the rest of its prop surface are reachable this way;
	 *  the shared props stay the parity contract. */
	ios?: Record<string, unknown>
	/** Android-only host properties (same bag contract as `ios`). */
	android?: Record<string, unknown>
	/** Web-only host properties (same bag contract as `ios`). */
	web?: Record<string, unknown>
}

/** Options for `prefetch`. The same contract `@octane-xplat/image`'s
 *  `prefetch` carries. */
export interface PrefetchOptions {
	/** Request headers for the prefetch fetch. Honored on Android (Fresco);
	 *  **dropped on iOS** — the plugin's prefetch path builds its SDWebImage
	 *  context without the download-request-modifier branch its `Img`
	 *  display path has; an upstream patch is needed there. Ignored on web —
	 *  a plain <img> cannot send custom headers. */
	headers?: Record<string, string>
	/** Max URLs fetched in parallel (JS-side cap). Default 5 — the same
	 *  ceiling NS core's ImageCache used. */
	concurrency?: number
}
