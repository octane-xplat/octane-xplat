/** @jsxImportSource @nativescript-community/octane */
import { ImageSource } from '@nativescript/core';
import { useMemo } from 'octane';
import type { ImageProps } from './props';
import { cx } from './cx';
import { applyEscapeProps } from './escape-props';
import { layoutChildProps } from './layout-child.native';
/** Image — NS <image>. `src` accepts the NS ImageSource grammar:
 *  res://name, ~/bundle-path, file path, remote URL, or data: URI.
 *  `alt` maps to accessibilityLabel (RN calls it `alt` on web parity). */
export function Image(props: ImageProps) @{
	const source = useMemo(() => {
		const comma = props.src.indexOf(',');
		if (
			props.src.startsWith('data:') &&
			comma > 0 &&
			props.src.slice(0, comma).endsWith(';base64')
		) {
			return ImageSource.fromBase64Sync(props.src.slice(comma + 1));
		}
		return props.src;
	}, [props.src]);

	<image
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		{...layoutChildProps(props)}
		className={cx(props.className)}
		style={props.style}
		src={source}
		accessibilityLabel={props.alt}
	/>;
}
