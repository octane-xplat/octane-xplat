import { describe, expect, it } from 'vitest'
import {
	bestImageSource,
	contentAxisOffset,
	contentFitToStretch,
	contentRect,
	imageSrcSet,
	isCenteredContentPosition,
	needsContentRect,
	objectPositionCSSValue,
	resolveContentFit,
	resolveContentPosition,
} from './image-content'

const CENTER = { top: '50%', left: '50%' } as const

describe('resolveContentFit / resolveContentPosition', () => {
	it('defaults to cover and 50%/50%', () => {
		expect(resolveContentFit(undefined)).toBe('cover')
		expect(resolveContentPosition(undefined)).toEqual(CENTER)
	})

	it('maps keyword shorthands like expo-image', () => {
		expect(resolveContentPosition('top right')).toEqual({ top: 0, right: 0 })
		expect(resolveContentPosition('bottom')).toEqual({ bottom: 0, left: '50%' })
		expect(resolveContentPosition('left center')).toEqual({ top: '50%', left: 0 })
	})

	it('falls back to center for invalid keywords', () => {
		expect(resolveContentPosition('diagonal' as any)).toEqual(CENTER)
	})

	it('detects centered positions including explicit 50% edges', () => {
		expect(isCenteredContentPosition({})).toBe(true)
		expect(isCenteredContentPosition({ left: '50%' })).toBe(true)
		expect(isCenteredContentPosition({ right: '50%' })).toBe(true)
		expect(isCenteredContentPosition({ left: 'center' })).toBe(true)
		expect(isCenteredContentPosition({ top: 0 })).toBe(false)
		expect(isCenteredContentPosition({ left: 10 })).toBe(false)
		expect(isCenteredContentPosition({ right: '25%' })).toBe(false)
	})
})

describe('contentAxisOffset', () => {
	const img = 200
	const view = 400

	it('centers by default and honors percentages over the free space', () => {
		expect(contentAxisOffset(view, img, undefined, undefined)).toBe(100)
		expect(contentAxisOffset(view, img, '0%', undefined)).toBe(0)
		expect(contentAxisOffset(view, img, '25%', undefined)).toBe(50)
		expect(contentAxisOffset(view, img, 'center', undefined)).toBe(100)
	})

	it('measures absolute dips from the named edge', () => {
		expect(contentAxisOffset(view, img, 10, undefined)).toBe(10)
		expect(contentAxisOffset(view, img, undefined, 10)).toBe(view - img - 10)
		expect(contentAxisOffset(view, img, undefined, '75%')).toBe(50)
	})
})

describe('contentRect', () => {
	// 200x100 image inside a 400x300 box
	it('contain letterboxes centered', () => {
		expect(contentRect('contain', CENTER, 400, 300, 200, 100)).toEqual({
			x: 0,
			y: 50,
			width: 400,
			height: 200,
		})
	})

	it('cover overflows evenly with negative offset', () => {
		expect(contentRect('cover', CENTER, 400, 300, 200, 100)).toEqual({
			x: -100,
			y: 0,
			width: 600,
			height: 300,
		})
	})

	it('cover + top left anchors the crop', () => {
		expect(contentRect('cover', { top: 0, left: 0 }, 400, 300, 200, 100)).toEqual({
			x: 0,
			y: 0,
			width: 600,
			height: 300,
		})
	})

	it('cover + right 25% shifts into the overflow', () => {
		expect(contentRect('cover', { right: '25%', top: '50%' }, 400, 300, 200, 100).x).toBe(-150)
	})

	it('fill ignores position entirely', () => {
		expect(contentRect('fill', { top: 0, left: 0 }, 400, 300, 200, 100)).toEqual({
			x: 0,
			y: 0,
			width: 400,
			height: 300,
		})
	})

	it('none keeps the intrinsic size, centered', () => {
		expect(contentRect('none', CENTER, 400, 300, 200, 100)).toEqual({
			x: 100,
			y: 100,
			width: 200,
			height: 100,
		})
	})

	it('scale-down shrinks to contain when the image is bigger, else none', () => {
		expect(contentRect('scale-down', CENTER, 400, 300, 800, 600)).toEqual({
			x: 0,
			y: 0,
			width: 400,
			height: 300,
		})

		expect(contentRect('scale-down', CENTER, 400, 300, 200, 100)).toEqual({
			x: 100,
			y: 100,
			width: 200,
			height: 100,
		})
	})

	it('absolute dip positions pin to the named edge', () => {
		const rect = contentRect('contain', { bottom: 10, right: 20 }, 400, 300, 200, 100)
		// content is 400x200 → bottom-edge offset = 300-200-10, right = 400-400-20
		expect(rect.y).toBe(90)
		expect(rect.x).toBe(-20)
	})
})

describe('needsContentRect / contentFitToStretch', () => {
	it('uses the fast path for expressible fits', () => {
		expect(needsContentRect('cover', CENTER)).toBe(false)
		expect(needsContentRect('contain', CENTER)).toBe(false)
		expect(needsContentRect('fill', CENTER)).toBe(false)
		// fill's rect is the whole box — position can't change it
		expect(needsContentRect('fill', { top: 0, left: 0 })).toBe(false)
	})

	it('needs the computed path for none, scale-down, and positioned content', () => {
		expect(needsContentRect('none', CENTER)).toBe(true)
		expect(needsContentRect('scale-down', CENTER)).toBe(true)
		expect(needsContentRect('cover', { top: 0 })).toBe(true)
		expect(needsContentRect('contain', { left: '25%' })).toBe(true)
	})

	it('maps fits onto the stretch vocabulary', () => {
		expect(contentFitToStretch('contain')).toBe('aspectFit')
		expect(contentFitToStretch('cover')).toBe('aspectFill')
		expect(contentFitToStretch('fill')).toBe('fill')
	})
})

describe('bestImageSource', () => {
	const sources = [
		{ uri: 'https://img.example/photo-100.jpg', width: 100, height: 100 },
		{ uri: 'https://img.example/photo-400.jpg', width: 400, height: 400 },
		{ uri: 'https://img.example/photo-1600.jpg', width: 1600, height: 1600 },
	]

	it('picks the closest pixel count to the view', () => {
		// 200x200 dips at scale 3 → 600x600 device px → closest is 400²
		const best = bestImageSource(sources, 200, 200, 3)
		expect(best?.uri).toBe('https://img.example/photo-400.jpg')
	})

	it('weighs the source scale multiplier', () => {
		const dense = [
			{ uri: 'a', width: 100, height: 100, scale: 1 },
			{ uri: 'b', width: 100, height: 100, scale: 3 },
		]

		// 100 dips at scale 3 → 300px target; b is 300px-worth, a is 100
		expect(bestImageSource(dense, 100, 100, 3)?.uri).toBe('b')
	})

	it('returns the only source, and nothing before a real layout', () => {
		expect(bestImageSource(sources, 0, 0, 3)).toBeNull()
		expect(bestImageSource([sources[0]], 100, 100, 1)?.uri).toBe(sources[0].uri)
	})

	it('skips unsized sources when sized candidates exist', () => {
		const mixed = [{ uri: 'unsized' }, sources[1]]
		expect(bestImageSource(mixed, 100, 100, 3)?.uri).toBe(sources[1].uri)
	})
})

describe('objectPositionCSSValue / imageSrcSet', () => {
	it('emits edge-value object-position', () => {
		expect(objectPositionCSSValue({ top: 0, right: '25%' })).toBe('top 0px right 25%')
		expect(objectPositionCSSValue({ bottom: 10, left: '50%' })).toBe('bottom 10px left 50%')
		expect(objectPositionCSSValue({})).toBe('top 50% left 50%')
	})

	it('builds w-descriptor srcset from width·scale', () => {
		const { src, srcSet } = imageSrcSet([
			{ uri: 'a.jpg', width: 100, height: 100 },
			{ uri: 'b.jpg', width: 200, height: 200, scale: 2 },
		])

		expect(srcSet).toBe('a.jpg 100w, b.jpg 400w')
		expect(src).toBe('b.jpg')
	})

	it('builds x-descriptor srcset when only density is known', () => {
		const { srcSet } = imageSrcSet([
			{ uri: 'a.png', scale: 1 },
			{ uri: 'a@2x.png', scale: 2 },
		])

		expect(srcSet).toBe('a.png 1x, a@2x.png 2x')
	})
})
