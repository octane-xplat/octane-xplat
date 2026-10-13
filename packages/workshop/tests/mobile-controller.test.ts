import { describe, expect, it } from 'vitest'
import { MobileController, mobileShellMode } from '../src/mobile/controller'
import { WorkshopSession, type MountRequest } from '../src/session'
import { defineStory } from '../src/contract'
import type { CatalogEntry } from '../src/catalog'
import { UNSET } from '../src/controls'

const story = () => defineStory<{ label?: string; count: number }, { nested: { value: number } }, { nested: { value: number } }>({
	id: 'mobile/shared', title: 'Mobile / Shared', targets: 'all',
	component: () => null, args: { label: 'default', count: 1 },
	controls: { label: { type: 'string', allowUnset: true }, count: { type: 'number', min: 0, max: 10 } },
	state: () => ({ nested: { value: 0 } }), fixture: () => ({ nested: { value: 0 } }),
})

const meta = (id: string, load?: CatalogEntry['load'], applicable = true): CatalogEntry => ({
	id, title: id, targets: ['ios', 'android'], capabilities: [], file: 'shared.stories.tsrx', exportName: 'Basic', applicable, load,
})

function setup(target: 'ios' | 'android', entries: CatalogEntry[]) {
	const mounts: MountRequest[] = []
	const updates: Record<string, unknown>[] = []
	let unmounts = 0
	const session = new WorkshopSession({ target, host: { mount(request) {
		mounts.push(request)
		return { update(props) { updates.push(props) }, unmount() { unmounts++ } }
	} } })

	const controller = new MobileController(session, entries, () => {})
	return { session, controller, mounts, updates, unmounts: () => unmounts }
}

for (const target of ['ios', 'android'] as const) {describe(`${target} controller (host-independent checks)`, () => {
	it('never imports an incompatible leaf, including a malicious loader', async () => {
		let loads = 0
		const x = setup(target, [meta('foreign', async () => { loads++; throw Error('foreign import') }, false)])
		await x.controller.select('foreign')
		expect(loads).toBe(0)
		expect(x.mounts).toHaveLength(0)
		expect(x.controller.selectedId).toBe('foreign')
	})

	it('keeps missing identity rather than choosing another story', async () => {
		const x = setup(target, [meta('mobile/shared', async () => ({ Basic: story() }))])
		await x.controller.select('removed')
		expect(x.controller.missingId).toBe('removed')
		expect(x.mounts).toHaveLength(0)
	})

	it('retains state/fixture on controls and removes optional props, then resets nested defaults', async () => {
		const x = setup(target, [meta('mobile/shared', async () => ({ Basic: story() }))])
		await x.controller.select('mobile/shared')
		const first = x.mounts[0]
		const state = first.props.state as { get(): any; set(next: any): void }
		state.set({ nested: { value: 9 } })

		;(first.fixture as any).nested.value = 9
		expect(x.controller.control('label', UNSET)).toBeUndefined()
		expect(Object.hasOwn(x.session.currentProps!, 'label')).toBe(false)
		expect(x.updates[0].label).toBeUndefined()
		expect(x.updates[0].state).toBe(state)
		expect(x.updates[0].fixture).toBe(first.fixture)
		expect(x.controller.control('count', '')).toContain('finite')
		expect(x.session.currentProps!.count).toBe(1)
		await x.session.reset()
		expect(x.unmounts()).toBe(1)
		expect((x.mounts[1].props.state as any).get().nested.value).toBe(0)
		expect((x.mounts[1].fixture as any).nested.value).toBe(0)
		expect(x.mounts[1].props.label).toBe('default')
	})

	it('opening panels and adapting geometry never mounts or retires the stage', async () => {
		const x = setup(target, [meta('mobile/shared', async () => ({ Basic: story() }))])
		await x.controller.select('mobile/shared')
		x.controller.query = 'shared'
		for (const [width, height] of [[390, 800], [820, 700], [1300, 900], [1300, 300]]) {
			mobileShellMode(width, height)
			x.controller.panel = 'stories'; x.controller.panel = 'controls'; x.controller.panel = null
		}

		expect(x.mounts).toHaveLength(1)
		expect(x.unmounts()).toBe(0)
		expect(x.controller.query).toBe('shared')
	})

	it('rejects late module results after a new selection or disposal', async () => {
		let finish!: (value: unknown) => void
		const x = setup(target, [meta('mobile/shared', () => new Promise((r) => { finish = r }))])
		const selecting = x.controller.select('mobile/shared')
		await x.controller.select('removed')
		finish({ Basic: story() }); await selecting
		expect(x.mounts).toHaveLength(0)
		const pending = x.controller.select('mobile/shared')
		await x.controller.dispose()
		finish({ Basic: story() }); await pending
		expect(x.mounts).toHaveLength(0)
	})

	it('passes the actual mobile target to fixtures and disposes late acquisition once', async () => {
		let prepared!: () => void
		const started = new Promise<void>((resolve) => { prepared = resolve })
		let context: any
		let resolveFixture!: (value: unknown) => void
		let cleaned = 0
		const slow = { ...story(), fixture: (ctx: any) => {
			context = ctx
			prepared()
			return new Promise((resolve) => { resolveFixture = resolve })
		} }

		const second = { ...story(), id: 'second' }
		const x = setup(target, [meta('mobile/shared', async () => ({ Basic: slow })), meta('second', async () => ({ Basic: second }))])
		const pending = x.controller.select('mobile/shared')
		await started
		expect(context.target).toBe(target)
		await x.controller.select('second')
		expect(context.signal.aborted).toBe(true)
		context.onCleanup(() => { cleaned++ })
		resolveFixture({ nested: { value: 99 } })
		await pending
		expect(cleaned).toBe(1)
		expect(x.mounts).toHaveLength(1)
		expect(x.session.state.storyId).toBe('second')
	})

	it('dismisses the panel before stage-only and keeps the mounted story untouched', async () => {
		const x = setup(target, [meta('mobile/shared', async () => ({ Basic: story() }))])
		await x.controller.select('mobile/shared')
		x.controller.panel = 'stories'
		expect(x.controller.dismissOverlay()).toBe('panel')
		expect(x.controller.panel).toBeNull()
		expect(x.mounts).toHaveLength(1)
		expect(x.unmounts()).toBe(0)
		expect(x.session.currentProps?.count).toBe(1)

		x.controller.stageOnly = true
		expect(x.controller.dismissOverlay()).toBe('stage-only')
		expect(x.controller.stageOnly).toBe(false)
		expect(x.controller.dismissOverlay()).toBeNull()
		expect(x.mounts).toHaveLength(1)
		expect(x.unmounts()).toBe(0)

		x.controller.stageOnly = true
		x.controller.panel = 'controls'
		expect(x.controller.dismissOverlay()).toBe('panel')
		expect(x.controller.dismissOverlay()).toBe('stage-only')
		expect(x.controller.dismissOverlay()).toBeNull()
	})

	it('keeps last revision stale on compile failure, then reloads the same ID fresh', async () => {
		const x = setup(target, [meta('mobile/shared', async () => ({ Basic: story() }))])
		await x.controller.select('mobile/shared')
		x.controller.updateCatalog(x.controller.catalog, [{ message: 'syntax error' }])
		expect(x.session.state.stale).toBe(true)
		expect(x.unmounts()).toBe(0)
		await x.controller.select('mobile/shared', 'revision-2')
		expect(x.session.state.phase).toBe('ready')
		expect(x.session.state.stale).toBe(false)
		expect(x.unmounts()).toBe(1)
	})
})}

it('uses available height as well as width', () => {
	expect(mobileShellMode(1300, 900)).toBe('wide')
	expect(mobileShellMode(1300, 300)).toBe('compact')
	expect(mobileShellMode(390, 800)).toBe('phone')
})
