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

/** Options for `prefetch`. Mirrors the slice of ui-image's PrefetchOptions
 *  that is meaningful without a display view. */
export interface PrefetchOptions {
	/** Request headers for the prefetch fetch. Native only — a web prefetch
	 *  goes through a plain <img>, which cannot send custom headers. */
	headers?: Record<string, string>
}
