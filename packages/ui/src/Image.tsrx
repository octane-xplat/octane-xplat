/** @jsxImportSource @nativescript-community/octane */
import { ImageSource } from '@nativescript/core';
import { useMemo, useRef } from 'octane';
import type { ImageProps } from './props';
import { cx } from './cx';
import { applyEscapeProps } from './escape-props';
import { layoutChildProps } from './layout-child';
import { isSvgSrc, svgSource } from './svg';
import { createSizedImageBinding } from './image-sizing';
/** Image — NS <image>. `src` accepts the NS ImageSource grammar:
 *  res://name, ~/bundle-path, file path, remote URL, or data: URI. SVG srcs
 *  (inline markup, svg data URIs, .svg paths/URLs) route to <svgview> —
 *  remote .svg URLs fetch to markup since SVGView has no fetch of its own.
 *  `alt` maps to accessibilityLabel (RN calls it `alt` on web parity).
 *  `src` never goes through JSX: the binding holds it until first layout,
 *  then sets decodeWidth/decodeHeight in device px before assigning — an
 *  eager src would decode at full source resolution on Android (study L1). */
export function Image(props: ImageProps) @{
	const svg = useMemo(() => (isSvgSrc(props.src) ? svgSource(props.src) : null), [props.src]);
	const sizing = useMemo(() => createSizedImageBinding(), []);
	const imageRef = useRef<any>(null);
	const boundRef = useRef({ key: props.recyclingKey, src: props.src });
	const bound = boundRef.current;
	boundRef.current = { key: props.recyclingKey, src: props.src };
	// expo-image `recyclingKey`: platform-list cells rebind the same view, and
	// Android's setUri keeps drawing the previous bitmap until the new fetch
	// resolves. Clear it before the ref re-binds the next src — only when
	// identity AND source both changed (same src = same bitmap).
	if (
		bound.key != null &&
		props.recyclingKey != null &&
		bound.key !== props.recyclingKey &&
		bound.src !== props.src &&
		imageRef.current
	) {
		imageRef.current.imageSource = null;
	}

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

	@if (svg != null) {
		<svgview
			ref={(v: any) => applyEscapeProps(v, props)}
			id={props.id}
			{...layoutChildProps(props)}
			className={cx(props.className)}
			style={props.style}
			src={svg}
			stretch="aspectFit"
			accessibilityLabel={props.alt}
		/>
	} @else {
		<image
			ref={(v: any) => {
				imageRef.current = v;
				applyEscapeProps(v, props);
				if (v) {
					sizing.update(v, source);
				}
			}}
			id={props.id}
			{...layoutChildProps(props)}
			className={cx(props.className)}
			style={props.style}
			accessibilityLabel={props.alt}
		/>
	}
}
