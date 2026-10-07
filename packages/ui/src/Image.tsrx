/** @jsxImportSource @nativescript-community/octane */
import { isAndroid, isIOS, ImageSource, knownFolders, Screen } from '@nativescript/core';
import { useLayoutEffect, useMemo, useRef } from 'octane';
import type { ImageProps, ImageSourceLike } from './props';
import { cx } from './cx';
import { applyEscapeProps } from './escape-props';
import { rememberGridChildPlacement } from './grid-placement';
import { layoutChildProps } from './layout-child';
import { isSvgSrc, svgSource } from './svg';
import { createSizedImageBinding } from './image-sizing';
import { contentFitToStretch, needsContentRect, resolveContentFit, resolveContentPosition } from './image-content';
import { createImageContentBinding } from './image-content-binding';
import { hashToPngBase64 } from './hash-image';

/** Resolves `placeholder` to an ImageSource synchronously — a placeholder
 *  that must fetch first defeats its purpose, so remote URLs are ignored.
 *  Accepts `blurhash:`/`thumbhash:` (decoded to PNG bytes in JS — see
 *  ./hash-image), `data:` base64, `res://`, `~/`, and plain file paths. */
function placeholderSource(placeholder: string): ImageSource | null {
	const png = hashToPngBase64(placeholder);
	if (png) {
		return ImageSource.fromBase64Sync(png);
	}

	const comma = placeholder.indexOf(',');
	if (
		placeholder.startsWith('data:') &&
		comma > 0 &&
		placeholder.slice(0, comma).endsWith(';base64')
	) {
		return ImageSource.fromBase64Sync(placeholder.slice(comma + 1));
	}

	if (placeholder.startsWith('res://')) {
		return ImageSource.fromResourceSync(placeholder.slice('res://'.length));
	}

	if (placeholder.startsWith('~/')) {
		return ImageSource.fromFileSync(
			knownFolders.currentApp().path + '/' + placeholder.slice(2),
		);
	}

	if (!/^https?:\/\//.test(placeholder)) {
		return ImageSource.fromFileSync(placeholder);
	}

	return null;
}

/** Re-resolves on every call — iOS disposes the previous ImageSource's
 *  native image each time `src` is assigned. Only writes when a load is
 *  pending (or nothing is showing), so a completed final image is never
 *  clobbered. */
function applyPlaceholder(view: any, placeholder: string | undefined): void {
	if (!placeholder || !(view.isLoading || !view.imageSource)) {
		return;
	}

	const ph = placeholderSource(placeholder);
	if (ph) {
		view.imageSource = ph;
	}
}

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
 *  resolution on Android (study L1).
 *  `placeholder` rides the same view: NS nulls `imageSource` whenever a new
 *  `src` is applied, so the leaf (re)assigns the placeholder bitmap whenever
 *  the pipeline reports a pending load (`isLoadingChange`) and after every
 *  binding src write (`afterIssue` — a same-src re-issue mid-load fires no
 *  event). Placeholder → final inside one view; on the computed-rect path
 *  the inner stretch='fill' image scales it with the same content math, so
 *  fit/position match the final (expo-image study L5). A failed load leaves
 *  the placeholder standing — failure-image semantics for free. */
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
	const imageRef = useRef<any>(null);
	const placeholderRef = useRef(props.placeholder);
	placeholderRef.current = props.placeholder;
	const sizing = useMemo(
		() =>
			createSizedImageBinding({
				afterIssue: (v: any) => applyPlaceholder(v, placeholderRef.current),
			}),
		[],
	);

	const binding = useMemo(
		() =>
			createImageContentBinding({
				isAndroid,
				screenScale: () => Screen.mainScreen?.scale ?? 1,
				issue: (view: any, src: any, gate?: string) => sizing.update(view, src, gate),
			}),
		[],
	);

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

	useLayoutEffect(() => {
		const view = imageRef.current;
		if (!view || !props.placeholder || svg != null) {
			return;
		}

		const show = () => applyPlaceholder(view, props.placeholder);
		show();
		view.on?.('isLoadingChange', show);
		return () => view.off?.('isLoadingChange', show);
	}, [props.src, props.placeholder, svg]);

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
