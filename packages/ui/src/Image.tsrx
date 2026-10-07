/** @jsxImportSource @nativescript-community/octane */
import { isAndroid, isIOS, ImageSource, Screen } from '@nativescript/core';
import { useMemo, useRef } from 'octane';
import type { ImageProps, ImageSourceLike } from './props';
import { cx } from './cx';
import { applyEscapeProps } from './escape-props';
import { rememberGridChildPlacement } from './grid-placement';
import { layoutChildProps } from './layout-child';
import { isSvgSrc, svgSource } from './svg';
import { createSizedImageBinding } from './image-sizing';
import { contentFitToStretch, needsContentRect, resolveContentFit, resolveContentPosition } from './image-content';
import { createImageContentBinding } from './image-content-binding';
/** Image — NS <image>. `src` accepts the NS ImageSource grammar:
 *  res://name, ~/bundle-path, file path, remote URL, or data: URI; an
 *  ImageSourceLike[] picks the closest pixel count to the laid-out view
 *  (srcset for native — study L8). SVG srcs (inline markup, svg data URIs,
 *  .svg paths/URLs) route to <svgview> — remote .svg URLs fetch to markup
 *  since SVGView has no fetch of its own. `alt` maps to accessibilityLabel
 *  (RN calls it `alt` on web parity).
 *  `contentFit` maps to stretch for the centered contain/cover/fill cases.
 *  'none'/'scale-down'/positioned content takes the computed path: the
 *  binding measures the host box, computes the CSS content rect, and lays
 *  out an inner fill-stretched <image> inside a clipped absolutelayout —
 *  the view-level equivalent of expo's matrix (the stock NS widget owns
 *  its own draw matrix; see image-content-binding.ts).
 *  `src` never goes through JSX: the content binding resolves WHICH source
 *  (the array pick, or the prop as-is) and hands it to the sized binding,
 *  which holds it until first layout then sets decodeWidth/decodeHeight in
 *  device px before assigning — an eager src would decode at full source
 *  resolution on Android (study L1). */
function clipImageHost(host: any): void {
	host?.on?.('loaded', () => {
		// iOS UIView clipsToBounds defaults false (DOM/NS overflow:visible);
		// cover/positioned rects must clip at the component box. Android
		// ViewGroups clip children by default — and the host never receives
		// escape props, which would unclip it.
		if (isIOS && host.ios) {
			host.ios.clipsToBounds = true;
		}
	});
}

export function Image(props: ImageProps) @{
	const sources = Array.isArray(props.src) ? (props.src as ImageSourceLike[]) : null;
	const srcString = sources ? '' : (props.src as string);
	const fit = resolveContentFit(props.contentFit);
	const position = resolveContentPosition(props.contentPosition);
	const computed = needsContentRect(fit, position);
	const sizing = useMemo(() => createSizedImageBinding(), []);
	const binding = useMemo(
		() =>
			createImageContentBinding({
				isAndroid,
				screenScale: () => Screen.mainScreen?.scale ?? 1,
				issue: (view: any, src: any, gate?: string) => sizing.update(view, src, gate),
			}),
		[],
	);

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

	const svg = useMemo(() => (srcString && isSvgSrc(srcString) ? svgSource(srcString) : null), [srcString]);
	const source = useMemo(() => {
		const comma = srcString.indexOf(',');
		if (
			srcString.startsWith('data:') &&
			comma > 0 &&
			srcString.slice(0, comma).endsWith(';base64')
		) {
			return ImageSource.fromBase64Sync(srcString.slice(comma + 1));
		}

		return srcString;
	}, [srcString]);

	const update = { source: sources ? null : source, sources, fit, position, computed };

	@if (svg != null) {
		<svgview
			ref={(v: any) => applyEscapeProps(v, props)}
			id={props.id}
			{...layoutChildProps(props)}
			className={cx(props.className)}
			style={props.style}
			src={svg}
			stretch={fit === 'none' ? 'none' : contentFitToStretch(fit === 'scale-down' ? 'contain' : fit)}
			accessibilityLabel={props.alt}
		/>
	} @else if (computed) {
		<absolutelayout
			ref={(v: any) => {
				clipImageHost(v);
				rememberGridChildPlacement(v, props);
				if (v) {
					binding.update(v, null, update);
				}
			}}
			id={props.id}
			{...layoutChildProps(props)}
			className={cx(props.className)}
			style={props.style}
		>
			<image
				ref={(v: any) => {
					imageRef.current = v;
					applyEscapeProps(v, props);
					if (v) {
						binding.update(null, v, update);
					}
				}}
				stretch="fill"
				accessibilityLabel={props.alt}
			/>
		</absolutelayout>
	} @else {
		<image
			ref={(v: any) => {
				imageRef.current = v;
				applyEscapeProps(v, props);
				if (v) {
					binding.update(v, v, update);
				}
			}}
			id={props.id}
			{...layoutChildProps(props)}
			className={cx(props.className)}
			style={props.style}
			stretch={contentFitToStretch(fit)}
			accessibilityLabel={props.alt}
		/>
	}
}
