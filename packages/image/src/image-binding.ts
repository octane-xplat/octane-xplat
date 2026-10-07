import type { ImageContentFit, ImageContentPositionObject, ImageSourceLike } from './props';
import { bestImageSource, contentRect } from './image-content';

/** View-sized decode + srcset selection + content-rect layout for the
 *  ui-image `Img` leaf. Mirrors the core Image binding semantics
 *  (packages/ui/src/image-sizing.ts + image-content-binding.ts):
 *
 *  `src` never goes through JSX — the binding holds it until the view's
 *  first real layout, writes decodeWidth/decodeHeight in device pixels,
 *  then assigns it. Without that hold the engine decodes at full source
 *  resolution (the 5 MB-cache jank this package exists to fix is half
 *  cache size and half oversized decodes — study L1+L2). A later resize
 *  re-issues at the new size, except 'fill'/'none' fits where the decode
 *  can't improve. 'none' never downsamples — its contract is source pixels.
 *
 *  `update` must be idempotent: ref callbacks re-fire on every render, and
 *  same view + same src + same size is a no-op. */
export function createImageBinding(options: {
	getFit: () => ImageContentFit;
	getPosition: () => ImageContentPositionObject;
	getSrc: () => { source: any; sources: ImageSourceLike[] | null };
	/** Explicit decode bounds — the caller's decodeWidth/decodeHeight props;
	 *  when set they win over the measured view size. */
	getDecodeBounds: () => { width?: number; height?: number };
	/** Device-pixel scale (Screen.mainScreen.scale) — injected so this
	 *  module stays platform-free. */
	screenScale: () => number;
}) {
	let view: any = null;
	let host: any = null; // computed-rect path: the absolutelayout wrapper
	let listening = false;
	let pending: { source: any; sources: ImageSourceLike[] | null } = {
		source: null,
		sources: null,
	};

	let appliedSrc: any;
	let applied = false;
	let width = 0;
	let height = 0;
	let imageWidth = 0; // intrinsic bitmap dips
	let imageHeight = 0;

	const scale = () => options.screenScale() || 1;

	const issue = (next: any) => {
		const fit = options.getFit();
		const bounds = options.getDecodeBounds();
		// 'none' draws the source at intrinsic size — downsampling would
		// shrink it (core parity; see ui/src/image-sizing.ts).
		const downscale = fit !== 'none';
		view.decodeWidth = bounds.width ?? (downscale ? width : 0);
		view.decodeHeight = bounds.height ?? (downscale ? height : 0);
		view.src = next;
		appliedSrc = next;
		applied = true;
	};

	const applyRect = () => {
		if (!host || !view || imageWidth <= 0 || imageHeight <= 0) {
			return;
		}

		const viewWidth = (host.getMeasuredWidth?.() ?? 0) / scale();
		const viewHeight = (host.getMeasuredHeight?.() ?? 0) / scale();
		if (viewWidth <= 0 || viewHeight <= 0) {
			return;
		}

		const rect = contentRect(
			options.getFit(),
			options.getPosition(),
			viewWidth,
			viewHeight,
			imageWidth,
			imageHeight,
		);

		view.left = rect.x;
		view.top = rect.y;
		view.width = rect.width;
		view.height = rect.height;
	};

	const evaluate = () => {
		const sizeView = host ?? view;
		if (!view || !sizeView) {
			return;
		}

		const measuredWidth = sizeView.getMeasuredWidth?.() ?? 0;
		const measuredHeight = sizeView.getMeasuredHeight?.() ?? 0;
		// Hold the request until a real layout — an earlier write decodes at
		// the default 0 dims (full source resolution).
		if (measuredWidth <= 0 || measuredHeight <= 0) {
			return;
		}

		let next = pending.source;
		if (pending.sources) {
			next =
				bestImageSource(
					pending.sources,
					measuredWidth / scale(),
					measuredHeight / scale(),
					scale(),
				)?.uri ?? pending.sources[0]?.uri;
		}

		if (next == null || next === '') {
			return;
		}

		const resized = applied && (measuredWidth !== width || measuredHeight !== height);
		if (applied && next === appliedSrc && !resized) {
			applyRect();
			return;
		}

		const fit = options.getFit();
		// A same-src resize re-issue only matters where the decode target
		// changes the result — 'fill'/'none' keep the existing bitmap.
		if (applied && next === appliedSrc && (fit === 'fill' || fit === 'none')) {
			applyRect();
			return;
		}

		width = measuredWidth;
		height = measuredHeight;
		issue(next);
		applyRect();
	};

	const onLayout = () => evaluate();

	const listen = (target: any) => {
		if (listening || !target) {
			return;
		}

		listening = true;
		target.on('layoutChanged', onLayout);
	};

	return {
		/** Called from the ref callbacks — image view first, then the computed
		 *  path's wrapper host. Refreshes the pending src from props and
		 *  evaluates; idempotent. */
		update(imageView: any, hostView: any) {
			if (imageView) {
				view = imageView;
			}

			if (hostView) {
				host = hostView;
			}

			pending = options.getSrc();
			listen(host ?? view);
			evaluate();
		},
		/** Engine set the final bitmap — record intrinsic size for the
		 *  content-rect path. */
		setIntrinsic(widthPx: number, heightPx: number) {
			imageWidth = widthPx / scale();
			imageHeight = heightPx / scale();
			applyRect();
		},
	};
}
