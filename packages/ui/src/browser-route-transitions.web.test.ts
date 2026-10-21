// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { createBrowserRouteTransitions } from './browser-route-transitions.web'
import { defineWebTransition } from './web-route-transition.web'
import type { PreparedRouteMatch, RouterHostResult, RouteTransitionContext } from './props'

const route: PreparedRouteMatch = {
	to: '/old',
	name: 'old',
	stack: 'root',
	params: {},
	search: {},
	context: {},
	data: undefined,
	href: '/old',
}

const context: RouteTransitionContext = {
	from: route,
	to: { ...route, to: '/new', href: '/new' },
	direction: 'forward',
	action: 'push',
}

const committed: RouterHostResult = { status: 'committed', route: context.to }
const descriptor = Object.getOwnPropertyDescriptor(document, 'startViewTransition')
afterEach(() => {
	vi.restoreAllMocks()
	if (descriptor) {
		Object.defineProperty(document, 'startViewTransition', descriptor)
	} else {
		Reflect.deleteProperty(document, 'startViewTransition')
	}
	Reflect.deleteProperty(window, 'matchMedia')
})

function deferred<Value>() {
	let resolve!: (value: Value) => void
	let reject!: (error: unknown) => void
	const promise = new Promise<Value>((yes, no) => {
		resolve = yes
		reject = no
	})
	return { promise, resolve, reject }
}

function browserTransitions(supportsTypes = true) {
	const records: {
		update(): Promise<void>
		finish(): void
		skip: ReturnType<typeof vi.fn>
		types: Set<string>
	}[] = []
	Object.defineProperty(document, 'startViewTransition', {
		configurable: true,
		value: (update: () => Promise<void>) => {
			const ready = deferred<void>()
			const finished = deferred<void>()
			const updated = deferred<void>()
			const skip = vi.fn(() => {
				ready.reject(new Error('skipped'))
				void updated.promise.finally(() => finished.resolve())
			})
			const record = {
				async update() {
					try {
						await update()
						updated.resolve()
						ready.resolve()
					} catch (error) {
						updated.reject(error)
						ready.reject(error)
						finished.reject(error)
					}
				},
				finish: () => finished.resolve(),
				skip,
				types: new Set<string>(),
			}
			records.push(record)
			return {
				ready: ready.promise,
				finished: finished.promise,
				updateCallbackDone: updated.promise,
				skipTransition: skip,
				...(supportsTypes ? { types: record.types } : {}),
			}
		},
	})
	return records
}

it('commits in the browser callback and settles animation independently', async () => {
	const records = browserTransitions()
	const coordinator = createBrowserRouteTransitions(window)
	const update = vi.fn(async () => committed)
	const result = coordinator.run(context, 'fade', undefined, update)
	expect(update).not.toHaveBeenCalled()
	await records[0].update()
	const navigation = await result
	expect(navigation.status).toBe('committed')
	expect(update).toHaveBeenCalledTimes(1)
	if (navigation.status !== 'committed') {
		throw new Error('Expected commit')
	}
	let done = false
	void navigation.finished!.then(() => {
		done = true
	})
	await Promise.resolve()
	expect(done).toBe(false)
	records[0].finish()
	expect(await navigation.finished).toEqual({ status: 'completed' })
})

it('sets custom types from prepared direction and matches', async () => {
	const records = browserTransitions()
	const effect = defineWebTransition({ types: ({ direction, from }) => [direction, from!.name] })
	const result = createBrowserRouteTransitions(window).run(
		{ ...context, direction: 'back', action: 'back' },
		'item',
		effect,
		async () => committed,
	)
	expect([...records[0].types]).toEqual(['back', 'old'])
	await records[0].update()
	records[0].finish()
	expect((await result).status).toBe('committed')
})

it('skips unsupported, reduced motion, initial entry, disabled and explicit fallbacks while committing once', async () => {
	const update = vi.fn(async () => committed)
	const coordinator = createBrowserRouteTransitions(window)
	const missing = await coordinator.run(context, 'fade', undefined, update)
	if (missing.status === 'committed') {
		expect(await missing.finished).toEqual({ status: 'skipped', reason: 'unsupported' })
	}
	const records = browserTransitions()
	Object.defineProperty(window, 'matchMedia', {
		configurable: true,
		value: () => ({ matches: true }),
	})
	const reduced = await coordinator.run(context, 'fade', undefined, update)
	if (reduced.status === 'committed') {
		expect(await reduced.finished).toEqual({ status: 'skipped', reason: 'reduced-motion' })
	}
	for (const [input, name, effect] of [
		[{ ...context, from: null }, 'fade', undefined],
		[context, 'none', undefined],
		[context, 'custom', { kind: 'skip' }],
	] as const) {
		const result = await coordinator.run(input, name, effect, update)
		if (result.status === 'committed') {
			expect(await result.finished).toEqual({ status: 'skipped', reason: 'disabled' })
		}
	}
	expect(records).toHaveLength(0)
	expect(update).toHaveBeenCalledTimes(5)
})

it('interrupts a preceding animation and still calls both accepted updates once', async () => {
	const records = browserTransitions()
	const coordinator = createBrowserRouteTransitions(window)
	const first = coordinator.run(context, 'fade', undefined, async () => committed)
	await records[0].update()
	const one = await first
	const second = coordinator.run(context, 'fade', undefined, async () => committed)
	expect(records[0].skip).toHaveBeenCalledOnce()
	await records[1].update()
	records[1].finish()
	expect(one.status === 'committed' && (await one.finished)).toEqual({
		status: 'skipped',
		reason: 'interrupted',
	})
	expect((await second).status).toBe('committed')
})

it('settles cancellation promptly and leaves stale update decisions to the host', async () => {
	const records = browserTransitions()
	const cancellation = deferred<Extract<RouterHostResult, { status: 'cancelled' }>>()
	let current = true
	const update = vi.fn(async (): Promise<RouterHostResult> =>
		current ? committed : { status: 'cancelled', reason: 'superseded' },
	)
	const pending = createBrowserRouteTransitions(window).run(
		context,
		'fade',
		undefined,
		update,
		cancellation.promise,
	)
	current = false
	cancellation.resolve({ status: 'cancelled', reason: 'superseded' })
	expect(await pending).toEqual({ status: 'cancelled', reason: 'superseded' })
	expect(records[0].skip).toHaveBeenCalledOnce()
	await records[0].update()
	expect(update).toHaveBeenCalledOnce()
})

it('keeps a failed visual definition from refusing an otherwise valid commit', async () => {
	browserTransitions()
	const error = new Error('invalid effect')
	const result = await createBrowserRouteTransitions(window).run(
		context,
		'custom',
		defineWebTransition({
			types: () => {
				throw error
			},
		}),
		async () => committed,
	)
	expect(result.status === 'committed' && (await result.finished)).toEqual({
		status: 'failed',
		error,
	})
})

it('skips custom animation when the browser lacks typed transitions and still updates', async () => {
  const records = browserTransitions(false)
  const pending = createBrowserRouteTransitions(window).run(context, 'custom', defineWebTransition({ types: ['custom'] }), async () => committed)
  await records[0].update()
  const result = await pending
  expect(result.status === 'committed' && await result.finished).toEqual({ status: 'skipped', reason: 'unsupported' })
})

it('commits once when the browser rejects transition startup', async () => {
  const error = new Error('startup failed')
  Object.defineProperty(document, 'startViewTransition', { configurable: true, value: () => { throw error } })
  const update = vi.fn(async () => committed)
  const result = await createBrowserRouteTransitions(window).run(context, 'fade', undefined, update)
  expect(result.status === 'committed' && await result.finished).toEqual({ status: 'failed', error })
  expect(update).toHaveBeenCalledOnce()
})
