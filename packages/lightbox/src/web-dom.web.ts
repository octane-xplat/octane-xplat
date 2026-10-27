import { fit, intersect, objectPosition, scaleRect } from './math'
import type { Rect, Visual } from './math'

/** DOM-only helpers — trigger measuring, scroll lock, morph targets. */

export const toRect = (r: DOMRect): Rect => ({ x: r.left, y: r.top, w: r.width, h: r.height })
export const area = (r: Rect) => r.w * r.h
export const thumbImg = (el: HTMLElement) =>
	el instanceof HTMLImageElement ? el : el.querySelector('img')

/** The part of `el` actually on screen: clipped by every overflow ancestor and the viewport. */
export function visibleRect(el: Element): Rect {
	let r = toRect(el.getBoundingClientRect())
	for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
		const cs = getComputedStyle(p)
		if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
			r = intersect(r, toRect(p.getBoundingClientRect()))
		}
	}
	return intersect(r, { x: 0, y: 0, w: innerWidth, h: innerHeight })
}
export const visibleFraction = (el: Element) => {
	const full = area(toRect(el.getBoundingClientRect()))
	return full ? area(visibleRect(el)) / full : 0
}

export function radiusOf(el: Element, r: DOMRect) {
	const v = getComputedStyle(el).borderTopLeftRadius
	return v.endsWith('%') ? (parseFloat(v) / 100) * Math.min(r.width, r.height) : parseFloat(v) || 0
}

/** Where the full image would sit if drawn into the trigger, cropped like the thumbnail. */
export function thumbVisual(trigger: HTMLElement, aspect: number): Visual | null {
	const visible = visibleRect(trigger)
	if (visible.w < 1 || visible.h < 1) {return null}
	const r = trigger.getBoundingClientRect()
	const img = thumbImg(trigger)
	const ir = img ? img.getBoundingClientRect() : r
	const cs = img ? getComputedStyle(img) : null
	const contain = cs?.objectFit === 'contain' || cs?.objectFit === 'scale-down'
	const [px, py] = cs ? objectPosition(cs.objectPosition) : [0.5, 0.5]
	const drawn = fit(aspect, toRect(ir), contain ? 'contain' : 'cover', px, py)
	const clip = intersect(contain ? drawn : toRect(ir), visible)
	const radius = Math.min(Math.max(radiusOf(trigger, r), img ? radiusOf(img, ir) : 0), clip.w / 2, clip.h / 2)
	return { img: drawn, clip, radius, opacity: 1 }
}

export const shift = (r: Rect, dx: number, dy: number): Rect => ({ ...r, x: r.x + dx, y: r.y + dy })
export const shiftVisual = (v: Visual, dx: number, dy: number): Visual =>
	dx || dy ? { ...v, img: shift(v.img, dx, dy), clip: shift(v.clip, dx, dy) } : v

export const fadeVisual = (v: Visual): Visual => ({
	...v,
	img: scaleRect(v.img, 0.92),
	clip: scaleRect(v.clip, 0.92),
	opacity: 0,
})

/**
 * Lock page scroll without reserving a scrollbar gutter: browsers paint a
 * reserved gutter on top of fixed content, which would leave a strip down the
 * side of a full-screen viewer. Body padding absorbs the scrollbar's width
 * instead. Programmatic scrolling still works under `overflow: hidden`.
 */
export function lockScroll() {
	const html = document.documentElement
	const body = document.body
	const gap = innerWidth - html.clientWidth
	const prev = [html.style.overflow, html.style.overscrollBehavior, body.style.paddingRight] as const
	if (gap > 0) {
		body.style.paddingRight = `${parseFloat(getComputedStyle(body).paddingRight) + gap}px`
	}
	html.style.overflow = 'hidden'
	// A sideways trackpad swipe over the chrome would otherwise chain to the page and trigger back/forward.
	html.style.overscrollBehavior = 'none'
	return () => {
		html.style.overflow = prev[0]
		html.style.overscrollBehavior = prev[1]
		body.style.paddingRight = prev[2]
	}
}
