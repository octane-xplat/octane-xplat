import type { ImageProps } from "./props";
import { applyEscapeProps } from "./escape-props";
/** Image — a plain <img>. `src` takes any URL or data: URI. */
export function Image(props: ImageProps) @{
	<img
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		className={props.className}
		style={props.style}
		src={props.src}
		alt={props.alt}
	/>
}
