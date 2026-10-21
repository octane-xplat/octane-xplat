/** View-sized decode for the native <image> leaf.
 *
 *  NS Android reads decodeWidth/decodeHeight only when `src` is written —
 *  `srcProperty.setNative` → `_createImageSourceFromSrc` →
 *  `imageView.setUri(value, decodeWidth, decodeHeight, …)` — and the
 *  properties default to 0 → `Fetcher.calculateInSampleSize` maps
 *  reqWidth ≤ 0 to the source dims → inSampleSize 1 → a full-resolution
 *  decode (~48 MB ARGB_8888 per 12 MP photo; .agents/design/expo-image-study.md
 *  L1). So the leaf holds `src` until the view's first layout pass, writes
 *  the decode dims in device pixels, then assigns src. An axis still 0 at
 *  that point is written as decode `0` — Android reads 0 as "unknown" and
 *  decodes it at the source dimension, capped at the screen's pixel size.
 *  A later resize re-issues at the new size — the same reload expo-image
 *  runs from onSizeChanged — under the same gate: 'fill'/'none' stretches
 *  keep the existing decode because a resize can't change the ideal sample
 *  there ('none' additionally never downsamples — its contract is source
 *  pixels), and a measure that collapses either axis to 0 never reloads —
 *  a reload nulls imageSource, which would collapse an intrinsic-height
 *  image again and loop. iOS ignores the decode dims entirely; it keeps
 *  the same first-layout gate but skips the resize reloads
 *  (`reissueOnResize: false`), so one path serves both platforms.
 *
 *  When the bitmap arrives the leaf also requests a fresh layout: NS
 *  core's own post-load `requestLayout` does not re-measure a foreign
 *  `Image` inside a Mason container, so without this an intrinsic-sized
 *  axis stays 0 (see .agents/docs/notes/masonkit-layout-evaluation.md).
 *
 *  The ref callback re-fires on every render (identity change), so
 *  `update` must be idempotent: same view + same src + same size is a
 *  no-op. Null ref calls on detach are ignored by the leaf — re-attaching
 *  the same view must not lose `applied`, or each render would re-issue
 *  setUri. The dead-view listener left behind on real unmount is a
 *  self-contained cycle the GC collects with the component record.
 *
 *  `afterIssue` runs right after every `src` write — including a same-src
 *  resize re-issue mid-load, which fires no `isLoadingChange` (isLoading is
 *  already true). The Image placeholder hooks this to re-apply its bitmap
 *  after the write has nulled `imageSource` (L5, decision #103). */
export function createSizedImageBinding(
	options: { afterIssue?: (view: any) => void; reissueOnResize?: boolean } = {},
) {
	const reissueOnResize = options.reissueOnResize ?? true
	let view: any = null
	let listening = false
	let laidOut = false
	let pendingSrc: any
	let pendingStretch: string | undefined
	let appliedSrc: any
	let applied = false
	let width = 0
	let height = 0

	const issue = (next: any) => {
		// `pendingStretch` overrides view.stretch for the decode gates when the
		// content-rect path draws stretch='fill' under a different semantic fit
		// ('none' needs the full-resolution source to find the natural size).
		const downscale = (pendingStretch ?? view.stretch) !== 'none'
		view.decodeWidth = { value: downscale ? width : 0, unit: 'px' }
		view.decodeHeight = { value: downscale ? height : 0, unit: 'px' }
		view.src = next
		appliedSrc = next
		applied = true
		options.afterIssue?.(view)
	}

	const evaluate = () => {
		if (!view) {
			return
		}

		const measuredWidth = view.getMeasuredWidth?.() ?? 0
		const measuredHeight = view.getMeasuredHeight?.() ?? 0
		// Hold the request until the first layout pass — before it the
		// measured size is meaningless. A 0 axis after layout is a real
		// measure (auto/intrinsic or genuinely zero), not a missing one:
		// issue with that axis's decode dim at 0 (source resolution on
		// Android) rather than deadlocking an image whose second axis only
		// materializes once its bitmap loads.
		if (
			!laidOut &&
			view.isLayoutValid !== true &&
			measuredWidth <= 0 &&
			measuredHeight <= 0
		) {
			if (view.isLoaded === true) {
				view.requestLayout?.()
				retryHeldIssue()
			}

			return
		}

		if (!applied || pendingSrc !== appliedSrc) {
			width = measuredWidth
			height = measuredHeight
			issue(pendingSrc)
			return
		}

		if (measuredWidth === width && measuredHeight === height) {
			return
		}

		// A reload nulls imageSource — never re-issue because an axis
		// collapsed to 0, or an intrinsic-sized image would lose its second
		// axis and loop.
		if (measuredWidth <= 0 || measuredHeight <= 0) {
			return
		}

		if (!reissueOnResize) {
			return
		}

		const stretch = pendingStretch ?? view.stretch
		if (stretch === 'fill' || stretch === 'none') {
			return
		}

		width = measuredWidth
		height = measuredHeight
		issue(appliedSrc)
	}

	const onLayout = () => {
		laidOut = true
		evaluate()
	}

	// The bitmap changed the view's intrinsic size. NS core requests a
	// layout on imageSourceChange itself, but that request never re-measures
	// a foreign <image> inside a Mason container — ask again so an
	// auto/intrinsic axis materializes (unconditional: a same-size rebind
	// with a different aspect needs it too).
	const onImageSource = () => view?.requestLayout?.()

	// Android marks a view layout-valid without emitting layoutChanged when
	// the bounds never changed (a 0×0 image), and `loaded` usually fires
	// before the binding's listener is attached. While held on an attached
	// view, force a layout pass and re-evaluate on deferred ticks — bounded,
	// so a permanently 0-sized view doesn't spin forever.
	let holdRetries = 0
	const onLoaded = () => {
		view?.requestLayout?.()
		retryHeldIssue()
	}
	const retryHeldIssue = () => {
		if (holdRetries >= 10 || !view || applied) {
			return
		}

		holdRetries++
		setTimeout(evaluate, 0)
	}

	return {
		/** (Re)bind source → view; issues once the view reports a real layout.
		 *  `stretchForDecode` overrides view.stretch for the decode/reload
		 *  gates — see `issue`. */
		update(next: any, source: any, stretchForDecode?: string): void {
			if (next !== view) {
				view?.off?.('layoutChanged', onLayout)
				view?.off?.('imageSourceChange', onImageSource)
				view?.off?.('loaded', onLoaded)
				view = next
				listening = false
				laidOut = false
				holdRetries = 0
				applied = false
				appliedSrc = undefined
			}

			pendingSrc = source
			pendingStretch = stretchForDecode
			if (view && !listening && typeof view.on === 'function') {
				view.on('layoutChanged', onLayout)
				view.on('imageSourceChange', onImageSource)
				view.on('loaded', onLoaded)
				listening = true
			}

			evaluate()
		},
		dispose(): void {
			view?.off?.('layoutChanged', onLayout)
			view?.off?.('imageSourceChange', onImageSource)
			view?.off?.('loaded', onLoaded)
			view = null
			listening = false
			laidOut = false
			holdRetries = 0
			applied = false
		},
	}
}
