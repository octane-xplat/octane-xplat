import { describe, expect, it, vi } from 'vitest'
import { resolveVariant, playbackTransition, VariantNode } from './variants'
import type { AnimationResult } from './engine'
import type { TransitionInput } from './types'

function node(timing: TransitionInput = {}) {
	const value = new VariantNode()
	value.resolve = () => ({ target: { x: 10 }, transition: timing })
	value.play = vi.fn(async () => 'finished' as AnimationResult)
	value.stopOwn = vi.fn()
	return value
}

function pending() {
	let resolve!: (result: AnimationResult) => void
	const promise = new Promise<AnimationResult>((done) => {
		resolve = done
	})

	return { promise, resolve }
}

describe('variant resolution', () => {
	it('merges arrays left to right and keeps the last defined transition', () => {
		expect(
			resolveVariant(['missing', 'a', 'b', 'c'], {
				a: { x: 10, opacity: 0, transition: { duration: 1 } },
				b: { x: 20, transition: { duration: 2 } },
				c: { y: 30 },
			}),
		).toEqual({ target: { x: 20, opacity: 0, y: 30 }, transition: { duration: 2 } })
	})

	it('passes custom to resolvers and validates the returned numeric target', () => {
		expect(resolveVariant('a', { a: (custom) => ({ x: custom }) }, 7).target).toEqual({ x: 7 })
		expect(() => resolveVariant('a', { a: () => ({ x: '10px' as any }) })).toThrow('finite numeric')
		expect(() => resolveVariant('a', { a: { transition: { staggerChildren: -1 } } })).toThrow(
			'staggerChildren',
		)

		expect(resolveVariant('toString', {}).target).toEqual({})
	})

	it('strips parent timing and adds delay to each per-key override', () => {
		expect(
			playbackTransition(
				{
					default: { duration: 1, delay: 0.1 },
					x: { delay: 0.2 },
					delayChildren: 1,
					staggerChildren: 2,
					when: 'afterChildren',
				},
				0.3,
			),
		).toEqual({ default: { duration: 1, delay: 0.4 }, x: { delay: 0.5 } })
	})
})

describe('variant orchestration', () => {
	it('starts parent and children concurrently with stable stagger offsets', async () => {
		const parent = node({ delayChildren: 0.1, staggerChildren: 0.2 })
		const a = node(),
			b = node()

		parent.register(a)
		parent.register(b)
		const job = pending()
		parent.play = vi.fn(() => job.promise)
		const result = parent.run('show')
		expect(a.play).toHaveBeenCalledWith('show', { x: 10 }, { delay: 0.1 })
		expect(b.play).toHaveBeenCalledWith('show', { x: 10 }, { delay: 0.30000000000000004 })
		job.resolve('finished')
		expect(await result).toBe('finished')
	})

	it('waits for actual parent completion before children', async () => {
		const parent = node({ when: 'beforeChildren' }),
			child = node()

		parent.register(child)
		const job = pending()
		parent.play = vi.fn(() => job.promise)
		const result = parent.run('show')
		expect(child.play).not.toHaveBeenCalled()
		job.resolve('finished')
		expect(await result).toBe('finished')
		expect(child.play).toHaveBeenCalledOnce()
	})

	it('waits for children and cancels queued parent work on disposal', async () => {
		const parent = node({ when: 'afterChildren' }),
			child = node()

		parent.register(child)
		const job = pending()
		child.play = vi.fn(() => job.promise)
		const result = parent.run('show')
		expect(parent.play).not.toHaveBeenCalled()
		parent.stop()
		job.resolve('finished')
		expect(await result).toBe('cancelled')
		expect(parent.play).not.toHaveBeenCalled()
	})

	it('unregisters children and propagates cancellation through nested runs', async () => {
		const parent = node(),
			child = node(),
			grandchild = node()

		child.register(grandchild)
		const off = parent.register(child)
		await parent.run('show')
		expect(grandchild.play).toHaveBeenCalledOnce()
		off()
		await parent.run('hide')
		expect(child.play).toHaveBeenCalledOnce()
		expect(child.stopOwn).toHaveBeenCalled()
	})
})

it('starts the parent only after every child finishes successfully', async () => {
	const parent = node({ when: 'afterChildren' })
	const a = node(),
		b = node()

	parent.register(a)
	parent.register(b)
	const first = pending(),
		second = pending()

	a.play = vi.fn(() => first.promise)
	b.play = vi.fn(() => second.promise)
	const result = parent.run('show')
	first.resolve('finished')
	await Promise.resolve()
	expect(parent.play).not.toHaveBeenCalled()
	second.resolve('finished')
	expect(await result).toBe('finished')
	expect(parent.play).toHaveBeenCalledOnce()
})

it('does not launch an obsolete child phase after replacement', async () => {
	const parent = node({ when: 'beforeChildren' }),
		child = node()

	parent.register(child)
	const old = pending()
	parent.play = vi.fn(() => old.promise)
	const obsolete = parent.run('show')
	parent.play = vi.fn(async () => 'finished')
	await parent.run('hide')
	old.resolve('finished')
	expect(await obsolete).toBe('cancelled')
	expect(child.play).toHaveBeenCalledTimes(1)
	expect(child.play).toHaveBeenCalledWith('hide', { x: 10 }, { delay: 0 })
})

it('animates late children after the current parent run finishes', async () => {
	const parent = node({ when: 'beforeChildren', delayChildren: 0.1 }),
		child = node()

	await parent.run('show')
	parent.register(child)
	await Promise.resolve()
	expect(child.play).toHaveBeenCalledWith('show', { x: 10 }, { delay: 0.1 })
})

it('keeps independently started exits alive while invalidating queued tree work', async () => {
	const parent = node({ when: 'beforeChildren' }),
		child = node()

	parent.register(child)
	const job = pending()
	parent.play = vi.fn(() => job.promise)
	const run = parent.run('show')
	const stops = (child.stopOwn as ReturnType<typeof vi.fn>).mock.calls.length
	parent.cancelPending()
	job.resolve('finished')
	expect(await run).toBe('cancelled')
	expect(child.stopOwn).toHaveBeenCalledTimes(stops)
	expect(child.play).not.toHaveBeenCalled()
})

it('does not count a late child twice while waiting for the parent phase', async () => {
	const parent = node({ when: 'beforeChildren' }),
		child = node()

	const job = pending()
	parent.play = vi.fn(() => job.promise)
	const run = parent.run('show')
	parent.register(child)
	job.resolve('finished')
	await run
	await Promise.resolve()
	expect(child.play).toHaveBeenCalledOnce()
})
