import type { ImageProps } from "./props";
import { applyEscapeProps } from "./escape-props";
import { layoutChildProps } from './layout-child.web';
/** Image — a plain <img>. `src` takes any URL or data: URI. */
export function Image(props: ImageProps) @{
	<img
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		className={props.className}
		{...layoutChildProps(props)}
		src={props.src}
		alt={props.alt}
	/>
}
