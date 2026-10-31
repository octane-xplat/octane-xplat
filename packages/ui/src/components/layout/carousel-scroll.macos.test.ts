import { strict as assert } from 'node:assert'
import { test } from 'vitest'
import { createAppKitCarouselScroll } from './carousel-scroll.macos.ts'
function fixture(rtl = false) {
	const state = { loop: false, count: 3, reduced: false, direction: rtl ? 'rtl' as const : 'ltr' as 'ltr' | 'rtl' }
	const writes: any[] = [], animated: any[] = [], window = {}
	const clip: any = { bounds: { origin: { x: rtl ? 240 : 0, y: 37 }, size: { width: 100, height: 60 } },
		scrollToPoint(point: any) { writes.push(point); this.bounds.origin = point },
		animator() { return { scrollToPoint: (point: any) => { animated.push(point); clip.scrollToPoint(point) } } },
	}
	const document: any = { frame: { size: { width: 340, height: 97 } }, flipped: false }
	const view: any = { window, contentView: clip, documentView: document, reflectScrolledClipView() {} }
	const slides: any[] = Array.from({ length: 3 }, (_, index) => ({ window, bounds: {},
		isDescendantOf: (target: any) => target === document,
		convertRectToView: () => ({ origin: { x: (rtl ? 2 - index : index) * 120 }, size: { width: 100 } }),
	}))
	let current: any = view
	const control = createAppKitCarouselScroll({ view: () => current, slides: () => slides, count: () => state.count,
		loop: () => state.loop, direction: () => state.direction, reducedMotion: () => state.reduced })
	return { state, writes, animated, clip, document, view, slides, control, detach: () => { current = null } }
}
test('viewport paging, boundaries and looping use live metadata and preserve the vertical clip origin', () => {
	const f = fixture(), h = f.control.handle
	assert.equal(h.canScrollPrev(), false); assert.equal(h.canScrollNext(), true)
	h.scrollNext(); assert.deepEqual(f.writes.at(-1), { x: 100, y: 37 })
	h.scrollNext(); h.scrollNext(); assert.equal(f.clip.bounds.origin.x, 240); assert.equal(h.canScrollNext(), false)
	h.scrollPrev(); assert.equal(f.clip.bounds.origin.x, 140)
	f.state.loop = true; h.scrollTo(2); assert.equal(h.canScrollNext(), true); h.scrollNext(); assert.equal(f.clip.bounds.origin.x, 0)
	h.scrollPrev(); assert.equal(f.clip.bounds.origin.x, 240)
	f.document.frame.size.width = 100; assert.equal(h.canScrollPrev(), false); assert.equal(h.canScrollNext(), false)
	f.state.count = 0; h.scrollNext(); assert.equal(h.canScrollNext(), false)
})
test('index navigation uses current document coordinates, clamps finite indices and rejects foreign or uninspectable slides', () => {
	const f = fixture(), h = f.control.handle
	h.scrollTo(50); assert.equal(f.clip.bounds.origin.x, 240)
	h.scrollTo(-4); assert.equal(f.clip.bounds.origin.x, 0)
	h.scrollTo(1.9); assert.equal(f.clip.bounds.origin.x, 120)
	const before = f.writes.length
	for (const index of [NaN, Infinity, -Infinity]) {h.scrollTo(index)}
	f.slides[1].window = {}; h.scrollTo(1)
	f.slides[0].isDescendantOf = () => false; h.scrollTo(0)
	f.slides[2].convertRectToView = undefined; h.scrollTo(2)
	assert.equal(f.writes.length, before)
})
test('RTL page direction and indexed leading-edge alignment use logical offsets and reverse loop boundaries', () => {
	const f = fixture(true), h = f.control.handle
	f.clip.bounds.origin.x = 0; f.control.initialize(); assert.equal(f.clip.bounds.origin.x, 240)
	assert.equal(h.canScrollPrev(), false); h.scrollNext(); assert.equal(f.clip.bounds.origin.x, 140)
	h.scrollTo(2); assert.equal(f.clip.bounds.origin.x, 0); assert.equal(h.canScrollNext(), false)
	f.state.loop = true; h.scrollNext(); assert.equal(f.clip.bounds.origin.x, 240)
	h.scrollPrev(); assert.equal(f.clip.bounds.origin.x, 0)
})
test('initial alignment waits for usable geometry, runs once per viewport/direction and honors reduced motion/fallback animation', () => {
	const f = fixture(), h = f.control.handle
	const geometry = f.slides[0].convertRectToView
	f.slides[0].convertRectToView = () => ({ origin: { x: 0 }, size: { width: 0 } }); f.control.initialize(); assert.equal(f.writes.length, 0)
	f.slides[0].convertRectToView = geometry; f.control.initialize(); assert.equal(f.animated.length, 0)
	h.scrollNext(); const at = f.clip.bounds.origin.x; f.control.initialize(); assert.equal(f.clip.bounds.origin.x, at)
	f.state.reduced = true; const animated = f.animated.length; h.scrollNext(); assert.equal(f.animated.length, animated)
	f.state.reduced = false; f.clip.animator = () => ({}); h.scrollPrev(); assert.equal(f.animated.length, animated)
	const retained = f.clip.bounds.origin.x; f.control.reset(); f.control.initialize(); assert.equal(f.clip.bounds.origin.x, retained)
})
test('invalid, hidden and detached geometry has no capability or writes and retained handles cannot act after teardown', () => {
	const f = fixture(), h = f.control.handle
	for (const mutate of [() => { f.view.hidden = true }, () => { f.view.window = null }, () => { f.clip.bounds.size.width = 0 },
		() => { f.document.frame.size.width = NaN }, () => { f.clip.bounds.origin.x = Infinity }]) {
		const before = f.writes.length; mutate(); h.scrollNext(); h.scrollPrev(); h.scrollTo(0)
		assert.equal(h.canScrollNext(), false); assert.equal(f.writes.length, before)
		f.view.hidden = false; f.view.window = {}; for (const slide of f.slides) {slide.window = f.view.window}
		f.clip.bounds.size.width = 100; f.document.frame.size.width = 340; f.clip.bounds.origin.x = 0
	}
	f.detach(); h.scrollNext(); h.scrollTo(0); assert.equal(h.canScrollNext(), false)
})

test('nearest-edge snap uses current clamped slide geometry in both directions and skips aligned or unavailable targets', () => {
	const f = fixture(); f.clip.bounds.origin.x = 178; f.control.snap(); assert.deepEqual(f.writes.at(-1), { x: 120, y: 37 })
	const before = f.writes.length; f.control.snap(); assert.equal(f.writes.length, before)
	f.state.count = 0; f.clip.bounds.origin.x = 70; f.control.snap(); assert.equal(f.writes.length, before)
	const rtl = fixture(true); rtl.state.reduced = true; rtl.clip.bounds.origin.x = 70; rtl.control.snap()
	assert.equal(rtl.clip.bounds.origin.x, 120); assert.equal(rtl.animated.length, 0)
})
test('accepted handle requests and existing native user offsets survive late initial alignment', () => {
	const f = fixture(); f.control.handle.scrollTo(2); const before = f.writes.length
	f.control.initialize(); assert.equal(f.clip.bounds.origin.x, 240); assert.equal(f.writes.length, before)
	const native = fixture(); native.clip.bounds.origin.x = 75; native.control.initialize(); assert.equal(native.writes.length, 0)
	native.control.interacted(); native.clip.bounds.origin.x = 0; native.control.initialize(); assert.equal(native.writes.length, 0)
})
