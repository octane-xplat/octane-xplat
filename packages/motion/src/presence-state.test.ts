import { expect, it, vi } from 'vitest'
import { PresenceState } from './presence-state'
import type { AnimationResult } from './engine'
const deferred = () => {
	let resolve!: (result: AnimationResult) => void
	const promise = new Promise<AnimationResult>((done) => {
		resolve = done
	})

	return { promise, resolve }
}

const drain = async () => {
	await Promise.resolve()
	await Promise.resolve()
}

it('waits for every registered child and ignores replaced exit completions', async () => {
	const done = vi.fn(),
		state = new PresenceState(true, done)

	const a = deferred(),
		b = deferred(),
		replacement = deferred()

	const memberA = { exit: vi.fn(() => a.promise), enter: vi.fn() }
	state.register(memberA)
	state.register({ exit: () => b.promise, enter() {} })
	state.setPresent(false)
	memberA.exit.mockReturnValue(replacement.promise)
	state.restart(memberA)
	a.resolve('finished')
	b.resolve('finished')
	await drain()
	expect(done).not.toHaveBeenCalled()
	replacement.resolve('finished')
	await drain()
	expect(done).toHaveBeenCalledTimes(1)
})

it('unregisters removed children and completes an empty boundary once', async () => {
	const done = vi.fn(),
		state = new PresenceState(true, done)

	const pending = deferred()
	const off = state.register({ exit: () => pending.promise, enter() {} })
	state.setPresent(false)
	off()
	await drain()
	expect(done).toHaveBeenCalledTimes(1)
	pending.resolve('finished')
	await drain()
	expect(done).toHaveBeenCalledTimes(1)
})

it('a destroyed boundary never invokes completion', async () => {
	const done = vi.fn(),
		state = new PresenceState(true, done)

	state.setPresent(false)
	state.destroy()
	await drain()
	expect(done).not.toHaveBeenCalled()
})
