import type { AnimatedImageProps } from './props';
import { applyEscapeProps } from './escape-props.web';

const OBJECT_FIT = {
	none: 'none',
	fill: 'fill',
	aspectFit: 'contain',
	aspectFill: 'cover',
} as const;

/** AnimatedImage — a plain <img>; browsers animate GIF/webp natively.
 *  `stretch` maps to object-fit. */
export function AnimatedImage(props: AnimatedImageProps) @{
	<img
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		className={props.className}
		style={{
			objectFit: OBJECT_FIT[props.stretch ?? 'aspectFit'],
			width: props.width,
			height: props.height,
			...props.style,
		}}
		src={props.src}
		alt={props.alt}
	/>
}
