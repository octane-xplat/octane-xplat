import { bestImageSource, contentRect } from './image-content';
import type {
	ImageContentFit,
	ImageContentPositionObject,
	ImageSourceLike,
} from './props';

export interface ImageContentEnv {
	/** Platform gate for the intrinsic-size unit conversion — the leaf
	 *  supplies it so this module stays free of '@nativescript/core'. */
	isAndroid: boolean;
	/** Device pixel ratio for the L8 pixel-count target. */
	screenScale: () => number;
	/** Src write seam — the sized-decode binding (image-sizing.ts) owns WHEN
	 *  a source lands on the view: first-layout gate, decode dims, resize
	 *  reload. `stretchForDecode` overrides the view's stretch for those
	 *  gates on the computed path, whose inner image draws stretch='fill'
	 *  under a different semantic fit ('none' needs the full-resolution
	 *  source to find the natural size). */
	issue: (view: any, source: any, stretchForDecode?: string) => void;
}

export interface ImageContentUpdate {
	/** The resolved single source (string or ImageSource), null when
	 *  `sources` carries the request. */
	source: any;
	/** Resolution-qualified sources (L8) — the binding defers selection
	 *  until a real layout exists, picks the closest pixel count, then
	 *  hands the winner to `issue`. */
	sources: readonly ImageSourceLike[] | null;
	/** Resolved CSS fit/position for the computed path. */
	fit: ImageContentFit;
	position: ImageContentPositionObject;
	/** True when the image view lives in a clip host and is laid out by the
	 *  binding (width/height/left/top in dips) — needed for 'none',
	 *  'scale-down', and non-center positions no platform scaleType has. */
	computed: boolean;
}

/** Intrinsic size in dips. iOS `UIImage.size` is already points; Android
 *  `Bitmap` reports raw pixels — density-bucketed resource bitmaps convert
 *  through their bucket (a 300px xxxhdpi asset = 75 dips), while decoded
 *  remote/file bitmaps carry no density and treat px as dips, which is the
 *  CSS 'none' natural size on every platform. */
function intrinsicDipSize(
	imageSource: any,
	android: boolean,
): { w: number; h: number } | null {
	const width = imageSource?.width;
	const height = imageSource?.height;
	if (!width || !height) {
		return null;
	}

	if (android) {
		const density = imageSource.android?.getDensity?.() ?? 0;
		if (density > 0) {
			return { w: (width * 160) / density, h: (height * 160) / density };
		}
	}

	return { w: width, h: height };
}

/** Measure → compute → apply for Image's content contract (study L7).
 *  NS's stock widget owns its draw path — the widgets ImageView computes
 *  its own matrix in onDraw and honors only the four stretch scaleTypes —
 *  so the drawable-level matrix expo-image uses is engine internals. What
 *  the leaf can own is the view-level equivalent: measure the box
 *  (`layoutChanged` → `getActualSize`, dips), compute the content rect
 *  with the same math as object-fit/object-position, and lay out the
 *  inner <image stretch="fill"> to that rect inside a clipped host. One
 *  code path produces identical rects on iOS and Android.
 *
 *  This binding never writes `src` itself — it resolves WHICH source the
 *  view should load and hands it to `env.issue`, the sized-decode binding
 *  (study L1). That seam composes both contracts: the L8 array pick waits
 *  on the same first real layout the decode gate needs, and the computed
 *  path passes the semantic fit as the decode gate so 'none' still
 *  decodes at source resolution while 'fill' would have been
 *  view-sampled.
 *
 *  Before the bitmap's intrinsic size is known the computed path sizes
 *  the inner image to the host box: a real rect is what lets the decode
 *  gate's first-layout check pass, and the placeholder is the CSS 'fill'
 *  answer until imageSourceChange refines it.
 *
 *  `update` re-runs on every render (ref identity churn); all writes are
 *  idempotent. Null refs on detach are ignored — a dead listener is a
 *  self-contained cycle GC collects with the view. */
export function createImageContentBinding(env: ImageContentEnv) {
	let sizeView: any = null;
	let imageView: any = null;
	let update: ImageContentUpdate = {
		source: null,
		sources: null,
		fit: 'cover',
		position: {},
		computed: false,
	};

	let appliedW = 0;
	let appliedH = 0;
	let appliedX = 0;
	let appliedY = 0;
	let listening = false;
	let sourceListening = false;

	const screenScale = () => {
		try {
			return env.screenScale();
		} catch {
			return 1;
		}
	};

	// 'none' decodes at source resolution — its contract is natural size and
	// the rect math needs the true intrinsic. Everything else decodes at
	// view size: for 'scale-down' the intrinsic-vs-view comparison survives
	// downsampling (a bigger source still reads >= view), though a source
	// barely larger than the view can sample to just under it and resolve
	// as 'none' — a small undersize vs CSS, accepted for one decode pass.
	const decodeGate = () => (update.fit === 'none' ? 'none' : 'aspectFit');

	const evaluate = () => {
		if (!sizeView) {
			return;
		}

		const needsViewSize = update.computed || update.sources != null;
		let viewWidth = 0;
		let viewHeight = 0;
		if (needsViewSize) {
			const actual = sizeView.getActualSize?.();
			viewWidth = actual?.width ?? 0;
			viewHeight = actual?.height ?? 0;
			if (viewWidth <= 0 || viewHeight <= 0) {
				return;
			}
		}

		if (imageView) {
			let resolved: any = update.source;
			if (update.sources?.length) {
				resolved = bestImageSource(update.sources, viewWidth, viewHeight, screenScale())?.uri;
			}

			if (resolved != null && resolved !== '') {
				env.issue(imageView, resolved, update.computed ? decodeGate() : undefined);
			}
		}

		if (!update.computed || !imageView) {
			return;
		}

		const intrinsic = intrinsicDipSize(imageView.imageSource, env.isAndroid);
		const rect = intrinsic
			? contentRect(update.fit, update.position, viewWidth, viewHeight, intrinsic.w, intrinsic.h)
			: { x: 0, y: 0, width: viewWidth, height: viewHeight };

		if (
			rect.width !== appliedW ||
			rect.height !== appliedH ||
			rect.x !== appliedX ||
			rect.y !== appliedY
		) {
			appliedW = rect.width;
			appliedH = rect.height;
			appliedX = rect.x;
			appliedY = rect.y;
			imageView.width = rect.width;
			imageView.height = rect.height;
			imageView.left = rect.x;
			imageView.top = rect.y;
		}
	};

	const onLayout = () => evaluate();
	const onImageSource = () => evaluate();

	const listen = () => {
		const wantsMeasure = update.computed || update.sources != null;
		if (wantsMeasure && !listening && typeof sizeView?.on === 'function') {
			sizeView.on('layoutChanged', onLayout);
			listening = true;
		} else if (!wantsMeasure && listening) {
			sizeView?.off?.('layoutChanged', onLayout);
			listening = false;
		}

		if (update.computed && !sourceListening && typeof imageView?.on === 'function') {
			imageView.on('imageSourceChange', onImageSource);
			sourceListening = true;
		} else if (!update.computed && sourceListening) {
			imageView?.off?.('imageSourceChange', onImageSource);
			sourceListening = false;
		}
	};

	return {
		/** (Re)bind views + intent. `sizeView` is the measured box (the image
		 *  itself on the stretch path, the clip host on the computed path);
		 *  `imageView` is the <image> that draws. */
		update(nextSizeView: any, nextImageView: any, next: ImageContentUpdate): void {
			if (nextSizeView && nextSizeView !== sizeView) {
				sizeView?.off?.('layoutChanged', onLayout);
				sizeView = nextSizeView;
				listening = false;
			}

			if (nextImageView && nextImageView !== imageView) {
				imageView?.off?.('imageSourceChange', onImageSource);
				imageView = nextImageView;
				sourceListening = false;
			}

			update = next;
			listen();
			evaluate();
		},
		dispose(): void {
			sizeView?.off?.('layoutChanged', onLayout);
			imageView?.off?.('imageSourceChange', onImageSource);
			sizeView = null;
			imageView = null;
			listening = false;
			sourceListening = false;
		},
	};
}
