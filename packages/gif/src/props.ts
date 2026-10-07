export interface AnimatedImageProps {
	className?: any
	style?: any
	id?: string
	src: string
	alt?: string
	/** Content fit — same grammar as core Image. Web maps to object-fit;
	 *  ui-image (Fresco/SDWebImage) accepts the same values. */
	stretch?: 'none' | 'fill' | 'aspectFit' | 'aspectFill'
	width?: string | number
	height?: string | number
	/** Platform-specific properties are applied after shared props. Native
	 *  bags assign onto the ui-image `Img` view — `noCache`, `decodeWidth`,
	 *  `decodeHeight`, `placeholderImageUri`, `progressiveRenderingEnabled`,
	 *  `cacheKey`, and the rest of its prop surface are reachable this way;
	 *  the shared props stay the parity contract. */
	ios?: any
	android?: any
	web?: any
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
