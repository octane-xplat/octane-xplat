import { expect, it } from 'vitest'
import { createNativeTriggerVisibility, nativeThumbVisual, nativeVisibleFraction } from './native-trigger'
function view(x: number, y: number, w: number, h: number, parent?: any, extra: any = {}) {
	return { parent, getLocationOnScreen: () => ({ x, y }), getActualSize: () => ({ width: w, height: h }), ...extra }
}
it('measures the source image fit and nested crop in DIPs', () => {
	const root = view(0, 0, 400, 800)
	const scroll = view(0, 100, 300, 200, root, { typeName: 'ScrollView' })
	const trigger = view(20, 50, 120, 120, scroll, { borderRadius: 16 })
	const image = view(30, 60, 100, 100, trigger, { typeName: 'Image', stretch: 'aspectFit', borderRadius: 20 })
	trigger.eachChild = (cb: (child: any) => void) => cb(image)
	const visual = nativeThumbVisual(trigger, { x: 0, y: 0, w: 400, h: 800 }, 2)!
	expect(visual.img).toEqual({ x: 30, y: 85, w: 100, h: 50 })
	expect(visual.clip).toEqual({ x: 30, y: 100, w: 100, h: 35 })
	expect(visual.radius).toBe(17.5)
	expect(nativeVisibleFraction(trigger)).toBeCloseTo(70 / 120)
	image.stretch = 'aspectFill'
	expect(nativeThumbVisual(trigger, { x: 0, y: 0, w: 400, h: 800 }, 2)!.img).toEqual({ x: -20, y: 60, w: 200, h: 100 })
})
it('uses positioned inner image bounds and falls back for unrepresentable or offscreen sources', () => {
	const root = view(0, 0, 400, 800)
	const clip = view(50, 50, 100, 100, root, { ios: { clipsToBounds: true } })
	const image = view(20, 30, 200, 100, clip, { typeName: 'Image', stretch: 'fill' })
	clip.eachChild = (cb: (child: any) => void) => cb(image)
	const slide = { x: 0, y: 0, w: 400, h: 800 }
	expect(nativeThumbVisual(clip, slide, 2)!.clip).toEqual({ x: 50, y: 50, w: 100, h: 80 })
	expect(nativeThumbVisual(clip, slide, 1)).toBeNull()
	const offscreen = view(500, 100, 100, 100, root)
	expect(nativeThumbVisual(offscreen, slide, 1)).toBeNull()
})
it('hides only the image and restores its original visibility when switching or closing', () => {
	const image = { typeName: 'Image', visibility: 'collapse' }
	const trigger = { visibility: 'visible', eachChild: (cb: (child: any) => void) => cb(image) }
	const hide = createNativeTriggerVisibility()
	hide(trigger)
	expect(image.visibility).toBe('hidden')
	expect(trigger.visibility).toBe('visible')
	const other = { typeName: 'Image', visibility: 'visible' }
	hide(other)
	expect(image.visibility).toBe('collapse')
	hide(null)
	expect(other.visibility).toBe('visible')
})
