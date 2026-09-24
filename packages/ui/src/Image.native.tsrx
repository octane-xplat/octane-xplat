/** @jsxImportSource @nativescript-community/octane */
import type { ImageProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";
import { layoutChildProps } from './layout-child.native';
/** Image — NS <image>. `src` accepts the NS ImageSource grammar:
 *  res://name, ~/bundle-path, file path, remote URL, or data: URI.
 *  `alt` maps to accessibilityLabel (RN calls it `alt` on web parity). */
export function Image(props: ImageProps) @{
	<image
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		{...layoutChildProps(props)}
		className={cx(props.className)}
		style={props.style}
		src={props.src}
		accessibilityLabel={props.alt}
	/>
}
