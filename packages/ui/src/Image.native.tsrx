/** @jsxImportSource @nativescript-community/octane */
/** Image — NS <image>. `src` accepts the NS ImageSource grammar:
 *  res://name, ~/bundle-path, file path, remote URL, or data: URI.
 *  `alt` maps to accessibilityLabel (RN calls it `alt` on web parity). */
export function Image(props: {
  className?: any;
  style?: any;
  id?: string;
  src: string;
  alt?: string;
}) @{
	<image
		id={props.id}
		className={props.className}
		style={props.style}
		src={props.src}
		accessibilityLabel={props.alt}
	/>
}
