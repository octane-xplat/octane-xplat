import { fit, intersect } from './math'
import type { Rect, Visual } from './math'
import { viewRect } from './rect'

export function nativeImageIn(view: any): any | null {
	if (!view) return null
	if (view.typeName === 'Image' || view.imageSource) return view
	let found: any = null
	if (view.eachChild) view.eachChild((child: any) => { found = nativeImageIn(child); return !found })
	else for (let index = 0; index < (view.getChildrenCount?.() ?? 0); index++) {
		found = nativeImageIn(view.getChildAt(index))
		if (found) break
	}
	return found
}

const valid = (rect: Rect | null): rect is Rect => !!rect && Object.values(rect).every(Number.isFinite) && rect.w > 0 && rect.h > 0
export function nativeVisibleRect(view: any): Rect | null {
	let rect = viewRect(view)
	if (!valid(rect)) return null
	let root = view
	for (let parent = view.parent; parent; parent = parent.parent) {
		root = parent
		const clips = parent.typeName === 'ScrollView' || parent.ios?.clipsToBounds || parent.android?.getClipChildren?.() || ['hidden', 'clip'].includes(parent.style?.overflow)
		if (clips) {
			const box = viewRect(parent)
			if (!valid(box)) return null
			rect = intersect(rect, box)
		}
	}
	const window = viewRect(root)
	return valid(window) ? intersect(rect, window) : null
}
export function nativeVisibleFraction(view: any) {
	const full = viewRect(view), visible = nativeVisibleRect(view)
	return valid(full) && visible ? visible.w * visible.h / (full.w * full.h) : 0
}

function radius(view: any, rect: Rect) {
	const value = view?.style?.borderTopLeftRadius ?? view?.borderRadius ?? 0
	if (typeof value === 'number') return Math.max(0, value)
	if (typeof value === 'object' && value?.unit === '%') return Math.max(0, value.value * Math.min(rect.w, rect.h))
	return 0
}

/** Native source-image geometry, in slide-local DIPs, including real clipping. */
export function nativeThumbVisual(trigger: any, slide: Rect, aspect: number): Visual | null {
	const outer = viewRect(trigger), visible = nativeVisibleRect(trigger)
	if (!valid(outer) || !visible || visible.w < 1 || visible.h < 1 || !(aspect > 0)) return null
	const image = nativeImageIn(trigger)
	const box = image ? viewRect(image) : outer
	if (!valid(box)) return null
	const stretch = image?.stretch ?? 'aspectFill'
	let drawn: Rect
	if (stretch === 'fill') {
		// UI's positioned-content path draws an already fitted inner image.
		// A distorted fill cannot be represented by a uniform-scale morph.
		if (Math.abs(box.w / box.h - aspect) > 0.001) return null
		drawn = box
	} else if (stretch === 'none') return null
	else drawn = fit(aspect, box, stretch === 'aspectFit' ? 'contain' : 'cover')
	const imageVisible = image ? nativeVisibleRect(image) : visible
	if (!imageVisible) return null
	const clip = intersect(intersect(stretch === 'aspectFit' ? drawn : box, visible), imageVisible)
	if (clip.w < 1 || clip.h < 1) return null
	const local = (r: Rect) => ({ ...r, x: r.x - slide.x, y: r.y - slide.y })
	return {
		img: local(drawn), clip: local(clip), opacity: 1,
		radius: Math.min(Math.max(radius(trigger, outer), image ? radius(image, box) : 0), clip.w / 2, clip.h / 2),
	}
}

export function createNativeTriggerVisibility() {
	let hidden: { view: any; visibility: unknown } | null = null
	return (trigger: any) => {
		if (hidden) hidden.view.visibility = hidden.visibility
		hidden = null
		const view = nativeImageIn(trigger) ?? trigger
		if (view) {
			hidden = { view, visibility: view.visibility ?? 'visible' }
			view.visibility = 'hidden'
		}
	}
}

/** Preserve the opening source when still attached/measurable; otherwise use
 * the most visible registration for this media index, as upstream does. */
export function pickNativeTrigger(candidates: Iterable<any>, opening: any) {
	const list = [...candidates].filter(view => view?.parent)
	if (list.includes(opening) && valid(viewRect(opening))) return opening
	let best: any = null
	let seen = 0
	for (const view of list) {
		const fraction = nativeVisibleFraction(view)
		if (fraction > seen + 0.01) { best = view; seen = fraction }
	}
	return best ?? list[0] ?? null
}
