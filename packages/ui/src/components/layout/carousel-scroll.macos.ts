import type { CarouselHandle } from '../../props'
import { scrollableAreaMetrics } from './scrollable-area-metrics.macos'
import { scrollableAreaOffset } from './scrollable-area-offset.macos'
import { convertAppKitInlineOffset } from './scrollable-area-logical.macos'
import type { NSScrollView, NSView } from '@octane-xplat/platform/macos'

const EPS = 1
function hidden(view: NSView) {
	return ['hidden', 'hiddenOrHasHiddenAncestor'].some((name) => {
		const value = Reflect.get(view, name)
		return Boolean(typeof value === 'function' ? value.call(view) : value)
	})
}
/** Private native geometry adapter; no stored DOM or NativeScript scroll facade. */
export function createAppKitCarouselScroll(options: {
	view(): NSScrollView | null
	slides(): readonly (NSView | null)[]
	count(): number
	loop(): boolean
	direction(): 'ltr' | 'rtl'
	reducedMotion(): boolean
	beforeMove?(): void
}) {
	let initialized: { view: NSScrollView; direction: 'ltr' | 'rtl' } | null = null
	const read = () => {
		const view = options.view(), clip = view?.contentView, document = view?.documentView
		if (!view?.window || !clip || !document || hidden(view)) return null
		const width = Number(clip.bounds.size.width), content = Number(document.frame.size.width)
		const metrics = scrollableAreaMetrics(view)
		if (![width, content, metrics.x, metrics.maxX, Number(clip.bounds.origin.y)].every(Number.isFinite) || width <= 0 || content < 0) return null
		const direction = options.direction(), position = convertAppKitInlineOffset(metrics.x, metrics.maxX, direction)
		return { view, document, width, content, maximum: metrics.maxX, position, direction }
	}
	const state = () => {
		const geometry = read()
		if (!geometry || options.count() <= 0 || geometry.maximum <= EPS) return { canPrev: false, canNext: false }
		const loop = options.loop() && options.count() > 1
		return { canPrev: loop || geometry.position > EPS, canNext: loop || geometry.position < geometry.maximum - EPS }
	}
	const move = (geometry: NonNullable<ReturnType<typeof read>>, logical: number, animated = true) => {
		options.beforeMove?.()
		scrollableAreaOffset(geometry.view, { inline: convertAppKitInlineOffset(logical, geometry.maximum, geometry.direction) }, animated && !options.reducedMotion())
	}
	const slideOffset = (geometry: NonNullable<ReturnType<typeof read>>, index: number) => {
		const slide = options.slides()[index]
		if (!slide || slide.window !== geometry.view.window || typeof slide.convertRectToView !== 'function' ||
			(typeof slide.isDescendantOf === 'function' && !slide.isDescendantOf(geometry.document))) return null
		const rect = slide.convertRectToView(slide.bounds, geometry.document), start = Number(rect.origin.x), width = Number(rect.size.width)
		if (![start, width].every(Number.isFinite) || width <= 0) return null
		const physical = geometry.direction === 'rtl' ? start + width - geometry.width : start
		return { logical: convertAppKitInlineOffset(physical, geometry.maximum, geometry.direction), start, width }
	}
	const page = (forward: boolean) => {
		const geometry = read()
		if (!geometry || options.count() <= 0 || !(forward ? state().canNext : state().canPrev)) return
		const loop = options.loop() && options.count() > 1
		const target = forward ? (loop && geometry.position >= geometry.maximum - EPS ? 0 : geometry.position + geometry.width) :
			(loop && geometry.position <= EPS ? geometry.maximum : geometry.position - geometry.width)
		initialized = { view: geometry.view, direction: geometry.direction }
		move(geometry, target)
	}
	const handle: CarouselHandle = {
		scrollNext: () => page(true), scrollPrev: () => page(false),
		scrollTo(index) {
			const geometry = read(), count = options.count()
			if (!geometry || !count || !Number.isFinite(index)) return
			const offset = slideOffset(geometry, Math.max(0, Math.min(count - 1, Math.trunc(index))))
			if (offset) { initialized = { view: geometry.view, direction: geometry.direction }; move(geometry, offset.logical) }
		},
		canScrollNext: () => state().canNext, canScrollPrev: () => state().canPrev,
	}
	return {
		handle, state, width: () => read()?.width ?? 0, reset: () => { initialized = null },
		interacted() {
			const view = options.view()
			if (view) initialized = { view, direction: options.direction() }
		},
		snap() {
			const geometry = read()
			if (!geometry || !options.count()) return
			let nearest: { logical: number; distance: number } | null = null
			for (let index = 0; index < options.count(); index++) {
				const offset = slideOffset(geometry, index)
				if (!offset) continue
				const distance = Math.abs(offset.logical - geometry.position)
				if (!nearest || distance < nearest.distance) nearest = { logical: offset.logical, distance }
			}
			if (nearest && nearest.distance > EPS) move(geometry, nearest.logical)
		},
		initialize() {
			const geometry = read()
			if (!geometry || !options.count() || (initialized && initialized.view === geometry.view && initialized.direction === geometry.direction)) { return }
			// Preserve a pre-existing/programmatic or unbracketed user offset.
			if (convertAppKitInlineOffset(geometry.position, geometry.maximum, geometry.direction) > EPS) {
				initialized = { view: geometry.view, direction: geometry.direction }; return
			}
			const offset = slideOffset(geometry, 0)
			if (!offset || offset.start + offset.width > geometry.content + EPS) return
			if (geometry.direction === 'rtl' && options.count() > 1) {
				const last = slideOffset(geometry, options.count() - 1)
				if (geometry.maximum <= EPS || !last || offset.start <= last.start) return
			}
			const token = { view: geometry.view, direction: geometry.direction }; initialized = token
			try { move(geometry, offset.logical, false) }
			catch (error) { if (initialized === token) initialized = null; throw error }
		},
	}
}
