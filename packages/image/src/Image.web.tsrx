import { useLayoutEffect, useRef } from 'octane';
import type { ImageProps, ImageSourceLike } from './props';
import {
	imageSrcSet,
	objectPositionCSSValue,
	resolveContentFit,
	resolveContentPosition,
} from './image-content';

import { hashToPngBase64 } from './hash-image';

/** Parent-layout metadata → CSS. Mirrors the ui web mapping: grid indices are
 *  zero-based, dock has no CSS equivalent and is ignored. */
function layoutChildStyle(props: ImageProps) {
	const style: Record<string, any> = {};
	if (props.row !== undefined) {
		style.gridRow = `${props.row + 1} / span ${props.rowSpan ?? 1}`;
	} else if (props.rowSpan !== undefined) {
		style.gridRow = `span ${props.rowSpan}`;
	}

	if (props.col !== undefined) {
		style.gridColumn = `${props.col + 1} / span ${props.colSpan ?? 1}`;
	} else if (props.colSpan !== undefined) {
		style.gridColumn = `span ${props.colSpan}`;
	}

	if (props.left !== undefined) {
		style.left = props.left;
	}

	if (props.top !== undefined) {
		style.top = props.top;
	}

	if (props.flexGrow !== undefined) {
		style.flexGrow = props.flexGrow;
	}

	if (props.flexShrink !== undefined) {
		style.flexShrink = props.flexShrink;
	}

	if (props.alignSelf !== undefined) {
		style.alignSelf = props.alignSelf;
	}

	if (props.order !== undefined) {
		style.order = props.order;
	}

	return style;
}

/** Dash-named escape-bag keys are attributes; other keys use the DOM property
 *  where available. Mirrors ui's web escape-props. */
function applyEscapeProps(element: any, props: ImageProps): void {
	if (!element || !props.web) {
		return;
	}

	for (const [key, value] of Object.entries(props.web)) {
		if (key.includes('-')) {
			if (value == null || value === false) {
				element.removeAttribute(key);
			} else {
				element.setAttribute(key, String(value));
			}
		} else if (key in element) {
			element[key] = value;
		} else if (value != null && value !== false) {
			element.setAttribute(key, String(value));
		}
	}
}

/** `blurhash:`/`thumbhash:` decode to a data: PNG (./hash-image — the ui
 *  copy); every other value passes through as an ordinary <img> URL (a
 *  low-res source URL is a fine placeholder on web). */
function placeholderUrl(placeholder: string): string {
	const png = hashToPngBase64(placeholder);
	return png ? `data:image/png;base64,${png}` : placeholder;
}

/** Image — a plain <img>, mirroring the core contract: a source array becomes
 *  a real `srcset` (browser owns selection); `contentFit`/`contentPosition`
 *  map 1:1 to object-fit/object-position with 'cover'/'50% 50%' defaults;
 *  `placeholder` rides the same element — the img keeps its last decoded
 *  image while a hidden prefetch warms the final src, so placeholder → final
 *  swaps in one view without a blank frame. Engine-only props (cachePolicy,
 *  failureImage, headers, decodeWidth/decodeHeight, progressive,
 *  fadeDuration) have no <img> equivalent and are ignored. onLoad fires
 *  without `source` — the browser does not report which cache satisfied the
 *  request. */
export function Image(props: ImageProps) @{
	const imgRef = useRef<HTMLImageElement | null>(null);
	const sources = Array.isArray(props.src) ? (props.src as ImageSourceLike[]) : null;
	const selected = sources
		? imageSrcSet(sources)
		: { src: props.src as string, srcSet: undefined };

	useLayoutEffect(() => {
		const img = imgRef.current;
		// complete = the current src already resolved (cache/sync data URI) —
		// showing the placeholder would flash backwards.
		if (!img || !props.placeholder || img.complete) return;
		const placeholder = placeholderUrl(props.placeholder);
		const { src: final, srcSet: finalSrcSet } = selected;
		// (document.createElement — `Image` here is this component, not the
		// global HTMLImageElement constructor)
		const warm = document.createElement('img');
		warm.src = final;
		if (finalSrcSet) {
			warm.srcset = finalSrcSet;
		}

		const swap = () => {
			img.src = final;
			if (finalSrcSet) {
				// srcset overrides src while present — restore it after the
				// src write so both point at the final selection.
				img.srcset = finalSrcSet;
			}
		};

		img.addEventListener('load', swap, { once: true });
		img.addEventListener('error', swap, { once: true });
		if (finalSrcSet) {
			// While srcset is set it wins over src — clear it or the
			// placeholder assignment below is inert.
			img.srcset = '';
		}

		img.src = placeholder;
		return () => {
			img.removeEventListener('load', swap);
			img.removeEventListener('error', swap);
		};
	}, [props.src, props.placeholder]);

	const style = {
		objectFit: 'cover',
		objectPosition: '50% 50%',
		...layoutChildStyle(props),
		...(typeof props.style === 'object' ? props.style : {}),
		...(props.contentFit !== undefined
			? { objectFit: resolveContentFit(props.contentFit) }
			: null),
		...(props.contentPosition !== undefined
			? { objectPosition: objectPositionCSSValue(resolveContentPosition(props.contentPosition)) }
			: null),
	};

	<img
		ref={(e: any) => {
			imgRef.current = e;
			applyEscapeProps(e, props);
		}}
		id={props.id}
		className={props.className}
		src={selected.src}
		srcSet={selected.srcSet}
		alt={props.alt}
		style={style}
		onLoad={(e: any) =>
			props.onLoad?.({
				width: e.currentTarget.naturalWidth ?? 0,
				height: e.currentTarget.naturalHeight ?? 0,
			})
		}
		onError={() =>
			props.onError?.({ error: new Error(`Failed to load image: ${props.src}`) })
		}
	/>
}
