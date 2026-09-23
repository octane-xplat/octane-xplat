/** @jsxImportSource @nativescript-community/octane */
import type { ImageProps } from "./props";
/** Image — NS <image>. `src` accepts the NS ImageSource grammar:
 *  res://name, ~/bundle-path, file path, remote URL, or data: URI.
 *  `alt` maps to accessibilityLabel (RN calls it `alt` on web parity). */
export function Image(props: ImageProps) @{
	<image
		id={props.id}
		className={props.className}
		style={props.style}
		src={props.src}
		accessibilityLabel={props.alt}
	/>
}
