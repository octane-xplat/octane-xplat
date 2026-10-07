import type { ImageProps, ImageSourceLike } from "./props";
import { applyEscapeProps } from "./escape-props";
import { layoutChildProps, normStyle } from './layout-child.web';
import { imageSrcSet, objectPositionCSSValue, resolveContentFit, resolveContentPosition } from './image-content';
/** Image — a plain <img>. `src` takes any URL or data: URI; a source array
 *  becomes a real `srcset` (w descriptors from width·scale, x from scale —
 *  the browser owns selection, the same role bestImageSource plays on
 *  native). `contentFit`/`contentPosition` map 1:1 to object-fit/
 *  object-position; explicit props win over style, style wins over the
 *  'cover'/'50% 50%' defaults. */
export function Image(props: ImageProps) @{
	const sources = Array.isArray(props.src) ? (props.src as ImageSourceLike[]) : null;
	const selected = sources
		? imageSrcSet(sources)
		: { src: props.src as string, srcSet: undefined };

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
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		className={props.className}
		{...layoutChildProps(props)}
		src={selected.src}
		srcSet={selected.srcSet}
		alt={props.alt}
		style={style}
	/>
}
