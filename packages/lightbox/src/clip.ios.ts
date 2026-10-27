// iOS clip channel. The morph shrinks the visible window of the slide image —
// the cheap path animates the outer clip view's frame, the fast path attaches a
// CALayer mask directly on the image's own layer. Phase 0 showed
// `layer.mask =` does not survive the NativeScript bridge; `setValueForKey` is
// the next attempt — the writer reports which mechanism actually attached so
// the probe can assert it.

export interface ClipWriter {
	/** 'mask' when the CALayer mask attached, 'layout' for the frame fallback. */
	readonly mechanism: 'mask' | 'layout'
	/** Clip to `inset` DIPs inside the view with corner `radius`. */
	setClip(inset: { top: number; right: number; bottom: number; left: number }, radius: number): void
	clear(): void
}

function attachMask(view: any): CALayer | null {
	const layer = view?.ios?.layer as CALayer | undefined
	if (!layer) {return null}
	const mask = CALayer.layer()
	mask.backgroundColor = UIColor.whiteColor.CGColor
	// Property assignment did not stick in Phase 0 — go through KVC.
	;(layer as any).setValueForKey?.(mask, 'mask')
	if ((layer as any).mask === mask) {return mask}
	try {
		layer.mask = mask
	} catch {}
	return (layer as any).mask === mask ? mask : null
}

export function createClipWriter(view: any): ClipWriter {
	const mask = attachMask(view)
	const size = () => view?.getActualSize?.() ?? { width: 0, height: 0 }
	if (mask) {
		return {
			mechanism: 'mask',
			setClip(inset, radius) {
				const { width, height } = size()
				mask.frame = CGRectMake(inset.left, inset.top, width - inset.left - inset.right, height - inset.top - inset.bottom)
				mask.cornerRadius = radius
			},
			clear() {
				const { width, height } = size()
				mask.frame = CGRectMake(0, 0, width, height)
				mask.cornerRadius = 0
			},
		}
	}
	// Layout fallback: clip by shrinking the view's own clip — the morph image
	// sits in a wrapper whose bounds are animated instead of a layer mask.
	return {
		mechanism: 'layout',
		setClip(inset, radius) {
			if (!view) {return}
			view.clipToBounds = true
			const { width, height } = size()
			const w = Math.max(0, width - inset.left - inset.right)
			const h = Math.max(0, height - inset.top - inset.bottom)
			view.width = w
			view.height = h
			view.translateX = inset.left
			view.translateY = inset.top
			if ('borderRadius' in view.style) {(view.style as any).borderRadius = radius}
			else if (view.style) {(view.style as any).cornerRadius = radius}
		},
		clear() {
			if (!view) {return}
			view.clipToBounds = false
			view.translateX = 0
			view.translateY = 0
			const { width, height } = size()
			view.width = width
			view.height = height
		},
	}
}
