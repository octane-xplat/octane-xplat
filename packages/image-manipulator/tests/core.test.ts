import { describe, expect, it } from 'vitest'
import { createImageManipulator } from '../src/core'
import { outputSize } from '../src/geometry'
import type { Frame, ImageBackend } from '../src/backend-types'

function fixture() {
	const freed: string[] = []
	const paths = new Set<string>()
	let serial = 0
	let finishSave: (() => void) | undefined
	let delaySave = false
	const live = (frame: Frame<string>) => {
		if (freed.includes(frame.image)) {
			throw new Error('Use after release')
		}
	}
	const backend: ImageBackend<string> = {
		isAvailable: () => true,
		load: async () => ({ width: 6, height: 4, image: 'original' }),
		transform(frame, operation) {
			live(frame)
			if (operation.kind === 'extent') {
				throw new Error('Extent unavailable')
			}
			return {
				...outputSize(frame, operation),
				image: `${frame.image}/${operation.kind}-${++serial}`,
			}
		},
		async save(frame) {
			live(frame)
			if (delaySave) {
				await new Promise<void>((resolve) => {
					finishSave = resolve
				})
			}
			live(frame)
			const uri = `output-${++serial}`
			paths.add(uri)
			return { uri, width: frame.width, height: frame.height }
		},
		release(frame) {
			live(frame)
			freed.push(frame.image)
		},
		releaseResult(uri) {
			paths.delete(uri)
		},
	}
	return {
		...createImageManipulator(backend),
		freed,
		paths,
		delay: () => {
			delaySave = true
		},
		finish: () => finishSave!(),
	}
}

describe('image operation ownership', () => {
	it('captures the queued state and preserves old refs through edits, reset and release', async () => {
		const f = fixture()
		const ctx = f.ImageManipulator.manipulate('fixture').crop({
			originX: 1,
			originY: 0,
			width: 3,
			height: 2,
		})
		const first = ctx.renderAsync()
		ctx.rotate(90)
		const second = await ctx.renderAsync()
		const previous = await first
		expect([previous.width, previous.height]).toEqual([3, 2])
		expect([second.width, second.height]).toEqual([2, 3])
		ctx.reset()
		const reset = await ctx.renderAsync()
		expect([reset.width, reset.height]).toEqual([6, 4])
		ctx.release()
		await Promise.resolve()
		const output = await previous.saveAsync()
		previous.release()
		second.release()
		reset.release()
		expect(f.paths.has(output.uri)).toBe(true)
		f.releaseImage(output)
		f.releaseImage(output)
		expect(f.paths.size).toBe(0)
		expect(new Set(f.freed).size).toBe(3)
	})

	it('a save pins pixels through release and a derived context retains its source', async () => {
		const f = fixture()
		const ctx = f.ImageManipulator.manipulate('fixture')
		const ref = await ctx.renderAsync()
		const child = f.ImageManipulator.manipulate(ref).resize({ width: 3 })
		f.delay()
		const save = ref.saveAsync()
		ref.release()
		ctx.release()
		await Promise.resolve()
		expect(f.freed).toEqual([])
		f.finish()
		await save
		const derived = await child.renderAsync()
		expect([derived.width, derived.height]).toEqual([3, 2])
		child.release()
		derived.release()
		await Promise.resolve()
		expect(f.freed).toContain('original')
	})

	it('failed operations release intermediates and reset recovers the original', async () => {
		const f = fixture()
		const ctx = f.ImageManipulator.manipulate('fixture')
			.resize({ width: 3 })
			.crop({ originX: 3, originY: 0, width: 1, height: 1 })
		await expect(ctx.renderAsync()).rejects.toThrow('bounds')
		ctx.reset()
		const ref = await ctx.renderAsync()
		expect(ref.width).toBe(6)
		ref.release()
		ctx.release()
		await Promise.resolve()
		expect(f.freed).toHaveLength(2)
	})

	it('rejects invalid inputs without adding operations and rejects released handles', async () => {
		const f = fixture()
		const ctx = f.ImageManipulator.manipulate('fixture')
		expect(() => ctx.resize({})).toThrow('width or height')
		expect(() => ctx.rotate(NaN)).toThrow('finite')
		expect(() => ctx.crop({ originX: -1, originY: 0, width: 2, height: 2 })).toThrow('originX')
		const ref = await ctx.renderAsync()
		await expect(ref.saveAsync({ compress: 2 })).rejects.toThrow('compress')
		ref.release()
		ref.release()
		await expect(ref.saveAsync()).rejects.toMatchObject({ code: 'ERR_IMAGE_MANIPULATOR_RELEASED' })
		expect(() => f.ImageManipulator.manipulate(ref)).toThrow('released')
		ctx.release()
		await expect(ctx.renderAsync()).rejects.toThrow('released')
	})
})

it('computes exact quarter-turn bounds and rounds inferred dimensions', () => {
	expect(outputSize({ width: 13, height: 7 }, { kind: 'rotate', degrees: 90 })).toEqual({
		width: 7,
		height: 13,
	})
	expect(outputSize({ width: 13, height: 7 }, { kind: 'resize', width: 1, height: null })).toEqual({
		width: 1,
		height: 1,
	})
})
