/** @jsxImportSource @nativescript-community/octane */
import { registerElement } from '@nativescript-community/octane';
import { ImageSource, isAndroid, isIOS, Screen } from '@nativescript/core';
import { Img, initialize } from '@nativescript-community/ui-image';
import { useMemo, useRef } from 'octane';
import type { ImageProps } from './props';
import { hashToPngBase64 } from './hash-image';
import {
	contentFitToStretch,
	needsContentRect,
	resolveContentFit,
	resolveContentPosition,
} from './image-content';

import { createImageBinding } from './image-binding';

// @nativescript-community/ui-image v5 — Glide + okhttp3 on Android (sized LRU
// memory cache + BitmapPool + disk cache), SDWebImage on iOS. `noCache` maps to
// skipMemoryCache + DiskCacheStrategy.NONE / SDWebImage FromLoaderOnly.
registerElement('cachedimage', Img);

let syncDecodeWarned = false;

let engineStarted = false;
function ensureEngine(): void {
	if (!engineStarted) {
		// Android auto-inits inside createNativeView anyway; calling early covers
		// iOS loader registration and keeps an initializeImageCache() config the
		// winner when it ran before first render (the plugin guards on its own
		// `initialized` flag).
		initialize();
		engineStarted = true;
	}
}

const LAYOUT_KEYS = [
	'row',
	'col',
	'rowSpan',
	'colSpan',
	'dock',
	'left',
	'top',
	'flexGrow',
	'flexShrink',
	'alignSelf',
	'order',
] as const;

function layoutChildAttrs(props: ImageProps) {
	const result: Record<string, any> = {};
	for (const key of LAYOUT_KEYS) {
		if (props[key] !== undefined) {
			result[key] = props[key];
		}
	}

	return result;
}

function applyEscapeProps(view: any, props: ImageProps): void {
	const bag = isIOS ? props.ios : isAndroid ? props.android : undefined;
	if (bag) {
		Object.assign(view, bag);
	}
}

/** A `src` string → engine source. data: URIs decode to an ImageSource — the
 *  engine has no data: scheme. */
function resolveSrc(src: string): string | ImageSource {
	const comma = src.indexOf(',');
	if (src.startsWith('data:') && comma > 0 && src.slice(0, comma).endsWith(';base64')) {
		return ImageSource.fromBase64Sync(src.slice(comma + 1));
	}

	return src;
}

/** `placeholder` → what the engine's placeholderImageUri accepts: `res://`,
 *  `~/`, and file paths pass through as strings; `blurhash:`/`thumbhash:` and
 *  `data:` decode to an ImageSource (the plugin's getDrawable/getUIImage
 *  accept the instance even though the prop is typed `string`). Remote URLs
 *  are ignored on native, matching core Image — a placeholder that must fetch
 *  first is pointless. */
function placeholderValue(placeholder: string): string | ImageSource | null {
	const png = hashToPngBase64(placeholder);
	if (png) {
		return ImageSource.fromBase64Sync(png);
	}

	if (/^https?:\/\//.test(placeholder)) {
		return null;
	}

	return resolveSrc(placeholder);
}

/** Image — ui-image `Img` (Glide/SDWebImage). Mirrors the core contract:
 *  `src` takes the Img grammar (remote URL, res://name, ~/bundle path, file
 *  path, data: URI) plus a resolution-qualified `ImageSourceLike[]` (closest
 *  pixel count wins once the view has a real layout — the srcset model).
 *  `contentFit` maps to stretch for the centered contain/cover/fill cases;
 *  'none'/'scale-down'/positioned content take the computed path — the host
 *  box is measured, the content rect computed, and a fill-stretched `Img`
 *  laid out inside a clipped absolutelayout (same structure core uses).
 *  `src` never goes through JSX: the binding holds it until first layout,
 *  writes decodeWidth/decodeHeight in device px, then assigns — an eager src
 *  decodes at full source resolution. SVG is unsupported — keep core `Image`
 *  for those. `alt` maps to accessibilityLabel. `decoding` accepts the shared
 *  vocabulary but 'sync' degrades to async with a warning — the engines have
 *  no synchronous decode mode (see props.ts). */
export function Image(props: ImageProps) @{
	ensureEngine();

	// `decoding='sync'` has no honest path: Glide `.into()` and SDWebImage
	// `sd_setImageWithURL` always decode off-thread, and the plugin's
	// `loadMode` prop is registered but never read. Degrade to the async
	// default with a note rather than setting dead surface.
	if (props.decoding === 'sync' && !syncDecodeWarned) {
		syncDecodeWarned = true;
		console.warn(
			"[octane-xplat] Image: decoding='sync' is not supported by the Glide/SDWebImage engine — decode stays async.",
		);
	}

	const latest = useRef(props);
	latest.current = props;

	const fit = resolveContentFit(props.contentFit);
	const position = resolveContentPosition(props.contentPosition);
	const computed = needsContentRect(fit, position);
	const imageRef = useRef<any>(null);
	const hostRef = useRef<any>(null);

	const binding = useMemo(
		() =>
			createImageBinding({
				getFit: () => resolveContentFit(latest.current.contentFit),
				getPosition: () => resolveContentPosition(latest.current.contentPosition),
				getSrc: () => {
					const src = latest.current.src;
					return Array.isArray(src)
						? { source: null, sources: src }
						: { source: resolveSrc(src), sources: null };
				},
				getDecodeBounds: () => ({
					width: latest.current.decodeWidth,
					height: latest.current.decodeHeight,
				}),
				screenScale: () => Screen.mainScreen?.scale ?? 1,
			}),
		[],
	);

	const boundRef = useRef({ key: props.recyclingKey, src: props.src });
	const bound = boundRef.current;
	boundRef.current = { key: props.recyclingKey, src: props.src };
	// expo-image `recyclingKey`: platform-list cells rebind the same view, and
	// the engine keeps drawing the previous bitmap until the new fetch
	// resolves. Clear it before the ref re-binds the next src — only when
	// identity AND source both changed (same src = same bitmap).
	if (
		bound.key != null &&
		props.recyclingKey != null &&
		bound.key !== props.recyclingKey &&
		bound.src !== props.src &&
		imageRef.current
	) {
		const nativeView = imageRef.current.nativeViewProtected;
		if (nativeView) {
			if (isIOS) {
				nativeView.image = null;
			} else {
				nativeView.setImageDrawable?.(null);
			}
		}
	}

	const attach = (view: any) => {
		if (!view) {
			return;
		}

		imageRef.current = view;
		applyEscapeProps(view, props);
		const ph = latest.current.placeholder;
		if (ph) {
			const resolved = placeholderValue(ph);
			if (resolved != null) {
				// string | ImageSource — the prop is typed `string` but the
				// plugin's placeholder resolution accepts an ImageSource on
				// both platforms.
				view.placeholderImageUri = resolved;
			}
		}

		if (!view.__xplatImageWired) {
			view.__xplatImageWired = true;
			view.on(Img.finalImageSetEvent, (e: any) => {
				const info = e.imageInfo;
				const w = info?.getWidth?.() ?? info?.width ?? 0;
				const h = info?.getHeight?.() ?? info?.height ?? 0;
				binding.setIntrinsic(w, h);
				latest.current.onLoad?.({ width: w, height: h, source: e.source });
			});

			view.on(Img.failureEvent, (e: any) => {
				latest.current.onError?.({ error: e.error });
			});
		}
	};

	@if (computed) {
		<absolutelayout
			ref={(v: any) => {
				hostRef.current = v;
				if (v && isIOS && v.ios) {
					// cover/positioned rects must clip at the component box (iOS
					// defaults overflow:visible).
					v.ios.clipsToBounds = true;
				}

				if (v) {
					binding.update(imageRef.current, v);
				}
			}}
			id={props.id}
			className={props.className}
			style={props.style}
			{...layoutChildAttrs(props)}
		>
			<cachedimage
				ref={(v: any) => {
					attach(v);
					if (v) {
						binding.update(v, hostRef.current);
					}
				}}
				stretch="fill"
				failureImageUri={props.failureImage}
				headers={props.headers}
				noCache={props.cachePolicy === 'none'}
				progressiveRenderingEnabled={props.progressive}
				fadeDuration={props.fadeDuration}
				accessibilityLabel={props.alt}
			/>
		</absolutelayout>
	} @else {
		<cachedimage
			ref={(v: any) => {
				attach(v);
				if (v) {
					binding.update(v, null);
				}
			}}
			id={props.id}
			className={props.className}
			style={props.style}
			{...layoutChildAttrs(props)}
			stretch={contentFitToStretch(fit)}
			failureImageUri={props.failureImage}
			headers={props.headers}
			noCache={props.cachePolicy === 'none'}
			progressiveRenderingEnabled={props.progressive}
			fadeDuration={props.fadeDuration}
			accessibilityLabel={props.alt}
		/>
	}
}
