import { describe, expect, it } from 'vitest'
import { WorkshopSession, type MountRequest, type MountedStory, type StageHost } from '../src/session'
import type { StoryDefinition } from '../src/contract'

const story = (over: Partial<StoryDefinition<any, any, any>> = {}): StoryDefinition<any, any, any> => ({
	id: 'demo/basic',
	title: 'Demo / Basic',
	targets: 'all',
	component: () => null,
	args: { step: 1 },
	...over,
})

interface Recorded {
	events: string[]
	mounts: MountRequest[]
	mounted: { props: Record<string, unknown>; unmounted: boolean; updates: Record<string, unknown>[] }[]
}

function host(events: string[] = []): StageHost & { recorded: Recorded } {
	const recorded: Recorded = { events, mounts: [], mounted: [] }
	return {
		recorded,
		mount(request: MountRequest): MountedStory {
			recorded.mounts.push(request)
			const entry = { props: request.props, unmounted: false, updates: [] as Record<string, unknown>[] }
			recorded.mounted.push(entry)
			events.push(`mount:${request.story.id}`)
			return {
				update(props) {
					entry.updates.push(props)
					entry.props = props
				},
				unmount() {
					if (entry.unmounted) {
						throw new Error('double unmount')
					}

					entry.unmounted = true
					events.push(`unmount:${request.story.id}`)
				},
			}
		},
	}
}

const session = (h: StageHost, extra: object = {}) =>
	new WorkshopSession({ host: h, target: 'web', ...extra })

describe('mount lifecycle', () => {
	it('prepares state+fixture, mounts with injected props, reaches ready', async () => {
		const h = host()
		const s = session(h)
		const states: { phase: string }[] = []
		s.subscribe((snap) => states.push(snap))
		await s.select(
			story({
				args: { step: 2 },
				state: () => ({ count: 0 }),
				fixture: () => ({ account: 'A' }),
			}),
		)

		const request = h.recorded.mounts[0]!
		expect(s.state.phase).toBe('ready')
		expect(request.props.step).toBe(2)
		expect(request.props.fixture).toEqual({ account: 'A' })
		expect(request.props.state).toBeTruthy() // injected Store
		expect(states.map((x) => x.phase)).toEqual(['discovered', 'preparing', 'mounting', 'ready'])
	})

	it('switching stories disposes the prior generation exactly once', async () => {
		const h = host()
		const s = session(h)
		await s.select(story({ id: 'a/one' }))
		await s.select(story({ id: 'a/two' }))
		expect(h.recorded.events).toEqual(['mount:a/one', 'unmount:a/one', 'mount:a/two'])
		expect(h.recorded.mounted[0]!.unmounted).toBe(true)
	})

	it('reset remounts with fresh args, state and fixture', async () => {
		const h = host()
		const s = session(h)
		let fixtureRuns = 0
		await s.select(
			story({ args: { step: 1 }, state: () => ({ n: 1 }), fixture: () => ({ run: ++fixtureRuns }) }),
		)

		s.applyProps({ step: 9 })
		await s.reset()
		expect(fixtureRuns).toBe(2)
		expect(s.state.phase).toBe('ready')
		expect(h.recorded.mounts[1]!.props.step).toBe(1) // back to defaults
		expect(h.recorded.mounted[0]!.unmounted).toBe(true)
	})
})

describe('fixtures: cancellation and cleanup', () => {
	it('cancels a pending fixture when a newer selection supersedes it', async () => {
		const h = host()
		const s = session(h)
		const signals: unknown[] = []
		const pending = story({
			id: 'slow/one',
			fixture: (ctx: any) => {
				signals.push(ctx.signal)
				return new Promise(() => {})
			},
		})

		const first = s.select(pending)
		await s.select(story({ id: 'fast/two' }))
		await first
		expect((signals[0] as { aborted: boolean }).aborted).toBe(true)
		expect(s.state.phase).toBe('ready')
		expect(h.recorded.mounts.map((m) => m.story.id)).toEqual(['fast/two'])
	})

	it('disposes late registrations exactly once after cancellation', async () => {
		const h = host()
		const s = session(h)
		let cleaned = 0
		const stuck = story({
			id: 'stuck/one',
			fixture: (ctx: any) =>
				new Promise((resolve) => {
					ctx.signal.addEventListener('abort', () => {
						// A fixture that registers a resource as it winds down.
						ctx.onCleanup(() => {
							cleaned++
						})

						setTimeout(() => resolve({ late: true }), 0)
					})
				}),
		})

		const first = s.select(stuck)
		await s.select(story({ id: 'other/two' }))
		await first
		await new Promise((r) => setTimeout(r, 10))
		expect(cleaned).toBe(1)
	})

	it('unwinds partial setup in reverse order on fixture failure', async () => {
		const h = host()
		const s = session(h)
		const order: string[] = []
		await s.select(
			story({
				id: 'fail/fixture',
				fixture: (ctx: any) => {
					ctx.onCleanup(() => order.push('first'))
					ctx.onCleanup(() => order.push('second'))
					throw new Error('boom')
				},
			}),
		)

		expect(order).toEqual(['second', 'first'])
		expect(s.state.phase).toBe('failed')
		expect(s.state.failure?.phase).toBe('fixture')
	})

	it('fixture timeout fails with a readable error', async () => {
		const h = host()
		const s = session(h)
		await s.select(
			story({
				id: 'timeout/fixture',
				fixtureTimeout: 20,
				fixture: () => new Promise(() => {}),
			}),
		)

		expect(s.state.phase).toBe('failed')
		expect(s.state.failure?.phase).toBe('fixture')
		expect(s.state.failure?.message).toMatch(/timed out/)
	})
})

describe('cleanup failure and restart', () => {
	it('cleanup failure blocks the next generation and reports the error', async () => {
		const h = host()
		const s = session(h)
		const bad = story({
			id: 'bad/cleanup',
			fixture: (ctx: any) => {
				ctx.onCleanup(() => {
					throw new Error('cleanup exploded')
				})

				return { ok: true }
			},
		})

		await s.select(bad)
		await s.select(story({ id: 'next/story' }))
		expect(s.state.phase).toBe('restart-required')
		expect(s.state.failure?.phase).toBe('cleanup')
		expect(s.state.failure?.message).toMatch(/cleanup exploded/)
		// The next generation never mounted over failed cleanup.
		expect(h.recorded.mounts.map((m) => m.story.id)).toEqual(['bad/cleanup'])
	})

	it('subsequent selection and reset cannot bypass a cleanup failure', async () => {
		const h = host()
		const s = session(h)
		await s.select(
			story({
				id: 'bad/cleanup',
				fixture: (ctx: any) => {
					ctx.onCleanup(() => {
						throw new Error('x')
					})

					return {}
				},
			}),
		)

		await s.select(story({ id: 'next/one' }))
		expect(s.state.phase).toBe('restart-required')
		await s.select(story({ id: 'next/two' }))
		await s.reset()
		s.markConnected()
		s.markCompileError(new Error('later'))
		expect(s.state.phase).toBe('restart-required')
		expect(h.recorded.mounts).toHaveLength(1)
	})

	it('cleanup that never settles declares restart-required', async () => {
		const h = host()
		const s = session(h, { disposalTimeout: 20 })
		await s.select(
			story({
				id: 'hang/cleanup',
				fixture: (ctx: any) => {
					ctx.onCleanup(() => new Promise<void>(() => {}))
					return {}
				},
			}),
		)

		await s.select(story({ id: 'next/one' }))
		expect(s.state.phase).toBe('restart-required')
		expect(s.state.failure?.message).toMatch(/timed out|restart/i)
	})
})

describe('state-preserving controls', () => {
	it('applyProps updates props without remounting or re-running fixture', async () => {
		const h = host()
		const s = session(h)
		let fixtureRuns = 0
		await s.select(
			story({ args: { step: 1 }, fixture: () => ({ run: ++fixtureRuns }) }),
		)

		s.applyProps({ step: 7 })
		expect(fixtureRuns).toBe(1)
		expect(h.recorded.mounted[0]!.updates[0]).toMatchObject({ step: 7 })
		expect(h.recorded.events).toEqual(['mount:demo/basic'])
	})

	it('applyProps no-ops when the generation is not ready', async () => {
		const h = host()
		const s = session(h)
		s.applyProps({ step: 7 })
		expect(h.recorded.mounted).toHaveLength(0)
	})
})

describe('errors and staleness', () => {
	it('a render error inside the boundary reports a mount failure', async () => {
		const h = host()
		const s = session(h)
		await s.select(story())
		h.recorded.mounts[0]!.onRenderError(new Error('render blew up'))
		expect(s.state.phase).toBe('failed')
		expect(s.state.failure?.phase).toBe('mount')
		expect(s.state.failure?.message).toMatch(/render blew up/)
	})

	it('a mount throw unwinds and fails', async () => {
		const h: StageHost = {
			mount() {
				throw new Error('host exploded')
			},
		}

		const s = session(h)
		await s.select(story())
		expect(s.state.phase).toBe('failed')
		expect(s.state.failure?.phase).toBe('mount')
	})

	it('compile errors keep the last good stage stale; reload recovers', async () => {
		const h = host()
		const s = session(h)
		await s.select(story())
		s.markCompileError(new Error('parse error'))
		expect(s.state.phase).toBe('failed')
		expect(s.state.stale).toBe(true)
		await s.reload(story())
		expect(s.state.phase).toBe('ready')
		expect(s.state.stale).toBe(false)
	})

	it('markRebuilding marks the mounted stage stale', async () => {
		const h = host()
		const s = session(h)
		await s.select(story())
		s.markRebuilding()
		expect(s.state.phase).toBe('rebuilding')
		expect(s.state.stale).toBe(true)
	})
})


describe('retirement races and isolation', () => {
	it('concurrent selections await the same retirement before mounting', async () => {
		const h = host()
		const s = session(h)
		let release!: () => void
		await s.select(story({ fixture: (ctx: any) => {
			ctx.onCleanup(() => new Promise<void>((resolve) => { release = resolve }))
			return {}
		} }))

		const first = s.select(story({ id: 'next/first' }))
		const second = s.select(story({ id: 'next/second' }))
		await Promise.resolve()
		expect(h.recorded.mounts).toHaveLength(1)
		release()
		await Promise.all([first, second])
		expect(h.recorded.mounts.map((m) => m.story.id)).toEqual(['demo/basic', 'next/second'])
	})

	it('attempts all cleanups after a rejection and never retries them', async () => {
		const h = host()
		const s = session(h)
		const cleaned: string[] = []
		await s.select(story({ fixture: (ctx: any) => {
			ctx.onCleanup(() => { cleaned.push('first') })
			ctx.onCleanup(() => { cleaned.push('second'); throw new Error('second failed') })
			ctx.onCleanup(() => { cleaned.push('third') })
			return {}
		} }))

		await s.reset()
		await s.reset()
		expect(cleaned).toEqual(['third', 'second', 'first'])
		expect(s.state.phase).toBe('restart-required')
	})

	it('attempts siblings of hung cleanup and keeps timeout sticky', async () => {
		const h = host()
		const s = session(h, { disposalTimeout: 20 })
		let cleaned = 0
		await s.select(story({ fixture: (ctx: any) => {
			ctx.onCleanup(() => { cleaned++ })
			ctx.onCleanup(() => new Promise<void>(() => {}))
			return {}
		} }))

		await s.reset()
		await s.select(story({ id: 'next/story' }))
		expect(cleaned).toBe(1)
		expect(s.state.phase).toBe('restart-required')
		expect(h.recorded.mounts).toHaveLength(1)
	})

	it('bounds partial preparation cleanup and reports its failure', async () => {
		const s = session(host(), { disposalTimeout: 20 })
		await s.select(story({ fixture: (ctx: any) => {
			ctx.onCleanup(() => new Promise<void>(() => {}))
			throw new Error('preparation failed')
		} }))

		expect(s.state.phase).toBe('restart-required')
		expect(s.state.failure?.phase).toBe('cleanup')
	})

	it('owns and retires a root acquired after asynchronous mount cancellation', async () => {
		let acquire!: (root: MountedStory) => void
		let unmounted = 0
		const h = host()
		const originalMount = h.mount
		h.mount = ((request: MountRequest) => request.story.id === 'slow/mount'
			? new Promise<MountedStory>((resolve) => { acquire = resolve })
			: originalMount(request)) as any

		const s = session(h)
		const first = s.select(story({ id: 'slow/mount' }))
		await Promise.resolve()
		const second = s.select(story({ id: 'next/story' }))
		acquire({ update() {}, unmount() { unmounted++ } })
		await Promise.all([first, second])
		expect(unmounted).toBe(1)
		expect(s.state.phase).toBe('ready')
		expect(h.recorded.mounts.map((m) => m.story.id)).toEqual(['next/story'])
	})

	it('nested defaults, state and fixture data are fresh on reset', async () => {
		const h = host()
		const s = session(h)
		const definition = story({ args: { nested: { label: 'default' } },
			state: () => ({ nested: { count: 0 } }), fixture: () => ({ nested: { label: 'fixture' } }) })

		await s.select(definition)
		const first = h.recorded.mounts[0]!.props as any
		first.nested.label = 'mutated'
		first.state.set({ nested: { count: 99 } })
		first.fixture.nested.label = 'mutated'
		await s.reset()
		const next = h.recorded.mounts[1]!.props as any
		expect(next.nested.label).toBe('default')
		expect(next.state.get().nested.count).toBe(0)
		expect(next.fixture.nested.label).toBe('fixture')
		expect(next.state).not.toBe(first.state)
	})
})


describe('late fixture ownership', () => {
	it('late resource acquisition after ignored cancellation is disposed exactly once', async () => {
		const h = host()
		const s = session(h)
		let finish!: () => void
		let cleaned = 0
		const first = s.select(story({ id: 'late/fixture', fixture: (ctx: any) => new Promise((resolve) => {
			finish = () => { ctx.onCleanup(() => { cleaned++ }); resolve({ late: true }) }
		}) }))

		await s.select(story({ id: 'next/story' }))
		finish()
		await first
		await Promise.resolve()
		expect(cleaned).toBe(1)
		expect(h.recorded.mounts.map(m => m.story.id)).toEqual(['next/story'])
	})

	it('late cleanup failure invalidates isolation and blocks later runs', async () => {
		const h = host()
		const s = session(h)
		let register!: () => void
		const first = s.select(story({ fixture: (ctx: any) => new Promise(() => {
			register = () => ctx.onCleanup(() => { throw new Error('late failure') })
		}) }))

		await s.select(story({ id: 'next/story' }))
		register()
		await first
		await Promise.resolve()
		await s.select(story({ id: 'next/blocked' }))
		expect(s.state.phase).toBe('restart-required')
		expect(s.state.failure?.message).toMatch(/late failure/)
		expect(h.recorded.mounts).toHaveLength(1)
	})
})


describe('bounded late cleanup', () => {
	it('late hanging cleanup requires restart, without retrying resources', async () => {
		const h = host()
		const s = session(h, { disposalTimeout: 20 })
		let register!: () => void
		let attempts = 0
		const first = s.select(story({ fixture: (ctx: any) => new Promise(() => {
			register = () => ctx.onCleanup(() => { attempts++; return new Promise<void>(() => {}) })
		}) }))

		await s.select(story({ id: 'next/story' }))
		register()
		await first
		await new Promise(resolve => setTimeout(resolve, 30))
		await s.reset()
		expect(attempts).toBe(1)
		expect(s.state.phase).toBe('restart-required')
		expect(s.state.failure?.message).toMatch(/timed out/)
	})

	it('a hung root unmount still attempts fixture resources', async () => {
		let cleaned = 0
		const s = session({ mount() { return { update() {}, unmount() { return new Promise<void>(() => {}) } } } }, { disposalTimeout: 20 })
		await s.select(story({ fixture: (ctx: any) => {
			ctx.onCleanup(() => { cleaned++ })
			return {}
		} }))

		await s.reset()
		expect(cleaned).toBe(1)
		expect(s.state.phase).toBe('restart-required')
	})

	it('render failure unwinds partial providers and fixture resources', async () => {
		const h = host()
		const s = session(h)
		let cleaned = 0
		await s.select(story({ fixture: (ctx: any) => {
			ctx.onCleanup(() => { cleaned++ })
			return {}
		} }))

		h.recorded.mounts[0]!.onRenderError(new Error('provider failed'))
		await s.dispose()
		expect(cleaned).toBe(1)
		expect(h.recorded.mounted[0]!.unmounted).toBe(true)
	})
})


it('disposal racing selection cannot clear the new generation owner', async () => {
	const h = host()
	const s = session(h)
	let finish!: () => void
	await s.select(story({ fixture: (ctx: any) => {
		ctx.onCleanup(() => new Promise<void>(resolve => { finish = resolve }))
		return {}
	} }))

	const ending = s.dispose()
	const selecting = s.select(story({ id: 'next/story' }))
	await Promise.resolve()
	finish()
	await Promise.all([ending, selecting])
	expect(s.currentStory?.id).toBe('next/story')
	await s.dispose()
	expect(h.recorded.mounted.at(-1)!.unmounted).toBe(true)
})
