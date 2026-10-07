import type { ImageProps, ImageSourceLike } from "./props";
import { applyEscapeProps } from "./escape-props";
import { layoutChildProps, normStyle } from './layout-child.web';
import { useLayoutEffect, useRef } from 'octane'
import { imageSrcSet, objectPositionCSSValue, resolveContentFit, resolveContentPosition } from './image-content';
import { hashToPngBase64 } from './hash-image'

/** `blurhash:`/`thumbhash:` decode to a data: PNG (./hash-image); every
 *  other value passes through as an ordinary <img> URL (a low-res source
 *  URL is a fine placeholder on web). */
function placeholderUrl(placeholder: string): string {
	const png = hashToPngBase64(placeholder)
	return png ? `data:image/png;base64,${png}` : placeholder
}

/** Image — a plain <img>. `src` takes any URL or data: URI; a source array
 *  becomes a real `srcset` (w descriptors from width·scale, x from scale —
 *  the browser owns selection, the same role bestImageSource plays on
 *  native). `contentFit`/`contentPosition` map 1:1 to object-fit/
 *  object-position; explicit props win over style, style wins over the
 *  'cover'/'50% 50%' defaults. `placeholder` rides the same element: the
 *  img keeps showing its last decoded image while a new src fetches, so
 *  assigning placeholder → src swaps placeholder → final in one view —
 *  never a blank frame and no parallel loader (expo-image study L5). A
 *  hidden prefetch keeps the final fetch running while the placeholder
 *  paints. `decoding` writes the HTML `decoding` attribute 1:1 (default
 *  'async' — the shared contract's default, not the browser's 'auto'). */
export function Image(props: ImageProps) @{
	const imgRef = useRef<HTMLImageElement | null>(null)
	const sources = Array.isArray(props.src) ? (props.src as ImageSourceLike[]) : null;
	const selected = sources
		? imageSrcSet(sources)
		: { src: props.src as string, srcSet: undefined };

	useLayoutEffect(() => {
		const img = imgRef.current
		// complete = the current src already resolved (cache/sync data URI) —
		// showing the placeholder would flash backwards.
		if (!img || !props.placeholder || img.complete) return
		const placeholder = placeholderUrl(props.placeholder)
		const { src: final, srcSet: finalSrcSet } = selected
		// (document.createElement — `Image` here is this component, not the
		// global HTMLImageElement constructor)
		const warm = document.createElement('img')
		warm.src = final
		if (finalSrcSet) {
			warm.srcset = finalSrcSet
		}

		const swap = () => {
			img.src = final
			if (finalSrcSet) {
				// srcset overrides src while present — restore it after the
				// src write so both point at the final selection.
				img.srcset = finalSrcSet
			}
		}

		img.addEventListener('load', swap, { once: true })
		img.addEventListener('error', swap, { once: true })
		if (finalSrcSet) {
			// While srcset is set it wins over src — clear it or the
			// placeholder assignment below is inert.
			img.srcset = ''
		}

		img.src = placeholder
		return () => {
			img.removeEventListener('load', swap)
			img.removeEventListener('error', swap)
		}
	}, [props.src, props.placeholder])

	const style = {
		objectFit: 'cover',
		objectPosition: '50% 50%',
		...normStyle(props.style),
		...(props.contentFit !== undefined
			? { objectFit: resolveContentFit(props.contentFit) }
			: null),
		...(props.contentPosition !== undefined
			? { objectPosition: objectPositionCSSValue(resolveContentPosition(props.contentPosition)) }
			: null),
	};

	<img
		ref={(e: any) => {
			imgRef.current = e
			applyEscapeProps(e, props)
		}}
		id={props.id}
		className={props.className}
		{...layoutChildProps(props)}
		src={selected.src}
		srcSet={selected.srcSet}
		decoding={props.decoding ?? 'async'}
		alt={props.alt}
		style={style}
	/>
}
