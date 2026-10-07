/** View-sized decode for the native <image> leaf.
 *
 *  NS Android reads decodeWidth/decodeHeight only when `src` is written —
 *  `srcProperty.setNative` → `_createImageSourceFromSrc` →
 *  `imageView.setUri(value, decodeWidth, decodeHeight, …)` — and the
 *  properties default to 0 → `Fetcher.calculateInSampleSize` maps
 *  reqWidth ≤ 0 to the source dims → inSampleSize 1 → a full-resolution
 *  decode (~48 MB ARGB_8888 per 12 MP photo; docs/notes/expo-image-study.md
 *  L1). So the leaf holds `src` until the view's first real layout, writes
 *  the decode dims in device pixels, then assigns src. A later resize
 *  re-issues at the new size — the same reload expo-image runs from
 *  onSizeChanged — under the same gate: 'fill'/'none' stretches keep the
 *  existing decode because a resize can't change the ideal sample there
 *  ('none' additionally never downsamples — its contract is source
 *  pixels). iOS ignores the decode dims entirely; the deferred assignment
 *  is behavior-identical there, so one path serves both platforms.
 *
 *  The ref callback re-fires on every render (identity change), so
 *  `update` must be idempotent: same view + same src + same size is a
 *  no-op. Null ref calls on detach are ignored by the leaf — re-attaching
 *  the same view must not lose `applied`, or each render would re-issue
 *  setUri. The dead-view listener left behind on real unmount is a
 *  self-contained cycle the GC collects with the component record. */
export function createSizedImageBinding() {
	let view: any = null;
	let listening = false;
	let pendingSrc: any;
	let pendingStretch: string | undefined;
	let appliedSrc: any;
	let applied = false;
	let width = 0;
	let height = 0;

	const issue = (next: any) => {
		// `pendingStretch` overrides view.stretch for the decode gates when the
		// content-rect path draws stretch='fill' under a different semantic fit
		// ('none' needs the full-resolution source to find the natural size).
		const downscale = (pendingStretch ?? view.stretch) !== 'none';
		view.decodeWidth = { value: downscale ? width : 0, unit: 'px' };
		view.decodeHeight = { value: downscale ? height : 0, unit: 'px' };
		view.src = next;
		appliedSrc = next;
		applied = true;
	};

	const evaluate = () => {
		if (!view) {
			return;
		}

		const measuredWidth = view.getMeasuredWidth?.() ?? 0;
		const measuredHeight = view.getMeasuredHeight?.() ?? 0;
		// Hold the request until a real layout — writing src sooner decodes
		// at the default 0 dims (full source resolution).
		if (measuredWidth <= 0 || measuredHeight <= 0) {
			return;
		}

		if (!applied || pendingSrc !== appliedSrc) {
			width = measuredWidth;
			height = measuredHeight;
			issue(pendingSrc);
			return;
		}

		if (measuredWidth === width && measuredHeight === height) {
			return;
		}

		const stretch = pendingStretch ?? view.stretch;
		if (stretch === 'fill' || stretch === 'none') {
			return;
		}

		width = measuredWidth;
		height = measuredHeight;
		issue(appliedSrc);
	};

	const onLayout = () => evaluate();

	return {
		/** (Re)bind source → view; issues once the view reports a real layout.
		 *  `stretchForDecode` overrides view.stretch for the decode/reload
		 *  gates — see `issue`. */
		update(next: any, source: any, stretchForDecode?: string): void {
			if (next !== view) {
				view?.off?.('layoutChanged', onLayout);
				view = next;
				listening = false;
				applied = false;
				appliedSrc = undefined;
			}

			pendingSrc = source;
			pendingStretch = stretchForDecode;
			if (view && !listening && typeof view.on === 'function') {
				view.on('layoutChanged', onLayout);
				listening = true;
			}

			evaluate();
		},
		dispose(): void {
			view?.off?.('layoutChanged', onLayout);
			view = null;
			listening = false;
			applied = false;
		},
	};
}
