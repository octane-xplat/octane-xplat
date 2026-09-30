import {
	Profile,
	SuspenseProfile,
	NestedProfile,
	Retained,
	Reader,
	sharedSelection$,
	sharedCalls,
} from '../tests/data-lifecycle.fixture.mobile.tsrx'

import { afterEach, describe, expect, it, vi } from 'vitest'
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
	flushUniversalSync,
} from 'octane/universal/native'

import { type QueryContext } from 'octane/signals'

type Request = {
	id: string
	signal: AbortSignal
	resolve: (value: string) => void
	reject: (error: Error) => void
}

function requests() {
	const calls: Request[] = []
	const load = (id: string, { signal }: QueryContext<string>) =>
		new Promise<string>((resolve, reject) => {
			calls.push({ id, signal, resolve, reject })
		})

	return { calls, load }
}

const roots: ReturnType<typeof createUniversalRoot>[] = []
function mount(Component: any, props: any) {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	roots.push(root)
	root.render(Component, props)
	return {
		root,
		container,
		text: () =>
			container.children
				.filter((node: any) => node.type === 'label')
				.map((node: any) => node.props.text),
	}
}

async function settle() {
	for (let i = 0; i < 12; i++) {
		await Promise.resolve()
	}

	flushUniversalSync(() => {})
}

afterEach(() => {
	for (const root of roots.splice(0)) {
		root.unmount()
	}
})

describe('compiler-owned query lifecycle on universal roots', () => {
	it('suspends on first data, catches a query error, and retries the boundary', async () => {
		const { calls, load } = requests()
		const view = mount(SuspenseProfile, { load })
		expect(view.text()).toEqual(['pending'])
		calls[0].reject(new Error('offline'))
		await settle()
		expect(view.container.children[0].props.text).toBe('offline')
		flushUniversalSync(() => view.container.dispatchEvent(view.container.children[0], 'tap', {}))
		await settle()
		expect(view.text()).toEqual(['pending'])
		expect(calls).toHaveLength(2)
		calls[1].resolve('recovered')
		await settle()
		expect(view.text()).toEqual(['recovered'])
	})

	it('shares the declaring component query with a child reader', async () => {
		const { calls, load } = requests()
		const view = mount(NestedProfile, { load })
		expect(calls).toHaveLength(1)
		calls[0].resolve('nested result')
		await settle()
		expect(view.text()).toEqual(['ready', 'nested result'])
		view.root.unmount()
		expect(view.container.children).toEqual([])
		const pendingView = mount(NestedProfile, { load })
		expect(calls).toHaveLength(2)
		pendingView.root.unmount()
		expect(calls[1].signal.aborted).toBe(true)
		calls[1].resolve('after child reader unmounted')
		await settle()
		expect(pendingView.container.children).toEqual([])
	})

	it('isolates stacked instances, retires requests, and ignores late responses', async () => {
		const { calls, load } = requests()
		const first = mount(Profile, { id: 'first', load })
		const second = mount(Profile, { id: 'second', load })
		expect(calls.map((call) => call.id)).toEqual(['first', 'second'])
		calls[0].resolve('one')
		calls[1].resolve('two')
		await settle()
		expect(first.text()).toEqual(['first:ready:one:false'])
		expect(second.text()).toEqual(['second:ready:two:false'])
		second.root.render(Profile, { id: 'second', nextId: 'third', load })
		flushUniversalSync(() =>
			second.container.dispatchEvent(second.container.children[4], 'tap', {}),
		)

		await settle()
		expect(calls.map((call) => call.id)).toEqual(['first', 'second', 'third'])
		second.root.render(Profile, { id: 'second', nextId: 'fourth', load })
		flushUniversalSync(() =>
			second.container.dispatchEvent(second.container.children[4], 'tap', {}),
		)

		await settle()
		expect(calls[2].signal.aborted).toBe(true)
		calls[3].resolve('four')
		await settle()
		calls[2].resolve('late third')
		await settle()
		expect(second.text()).toEqual(['fourth:ready:four:false'])
		expect(first.text()).toEqual(['first:ready:one:false'])
		second.root.render(Profile, { id: 'second', nextId: 'fifth', load })
		flushUniversalSync(() =>
			second.container.dispatchEvent(second.container.children[4], 'tap', {}),
		)

		await settle()
		second.root.unmount()
		expect(calls[4].signal.aborted).toBe(true)
		calls[4].resolve('after unmount')
		await settle()
		expect(second.container.children).toEqual([])
	})

	it('reports pending, error, retry, refetch, and reset separately', async () => {
		const { calls, load } = requests()
		const view = mount(Profile, { id: 'a', load })
		expect(view.text()).toEqual(['a:pending:none:false'])
		calls[0].reject(new Error('offline'))
		await settle()
		expect(view.text()).toEqual(['a:error:none:false'])
		flushUniversalSync(() => view.container.dispatchEvent(view.container.children[1], 'tap', {}))
		await settle()
		expect(view.text()).toEqual(['a:pending:none:false'])
		calls[1].resolve('one')
		await settle()
		flushUniversalSync(() => view.container.dispatchEvent(view.container.children[2], 'tap', {}))
		await settle()
		expect(view.text()).toEqual(['a:ready:one:true'])
		calls[2].resolve('two')
		await settle()
		flushUniversalSync(() => view.container.dispatchEvent(view.container.children[3], 'tap', {}))
		await settle()
		expect(view.text()).toEqual(['a:pending:two:false'])
		calls[3].resolve('three')
		await settle()
		expect(view.text()).toEqual(['a:ready:three:false'])
	})

	it('updates a module signal across roots and disconnects unmounted readers', async () => {
		const selection$ = sharedSelection$
		const calls = sharedCalls
		selection$.set('a')
		let renders = 0
		const props = {
			onRender: () => {
				renders++
			},
		}

		const page = mount(Reader, props)
		const sheet = mount(Reader, props)
		const modal = mount(Reader, props)
		expect(calls).toHaveLength(1)
		calls[0].resolve('one')
		await settle()
		for (const view of [page, sheet, modal]) {
			expect(view.text()).toEqual(['a:ready:one'])
		}

		flushUniversalSync(() => selection$.set('b'))
		await settle()
		expect(calls).toHaveLength(2)
		calls[1].resolve('two')
		await settle()
		for (const view of [page, sheet, modal]) {
			expect(view.text()).toEqual(['b:ready:two'])
		}

		for (const view of [page, sheet, modal]) {
			view.root.unmount()
		}

		const before = renders
		flushUniversalSync(() => selection$.set(''))
		await settle()
		expect(renders).toBe(before)
	})

	it('delivers a tap that re-suspends, hides retained hosts, and reports handler errors', async () => {
		let resolve!: (value: string) => void
		const pending = new Promise<string>((done) => {
			resolve = done
		})

		const error = new Error('handler failure')
		const fail = vi.fn(() => {
			throw error
		})

		const uncaught = vi.fn()
		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'), {
			onUncaughtError: uncaught,
		})

		roots.push(root)
		root.render(Retained, { pending, fail })
		const body = container.children[0]
		expect(body.props.text).toBe('ready')
		flushUniversalSync(() => container.dispatchEvent(body, 'tap', {}))
		await settle()
		expect(container.children[0]).toBe(body)
		expect(body.visible).toBe(false)
		expect(container.children[1]).toMatchObject({ props: { text: 'pending' }, visible: true })
		expect(container.commits.flatMap((batch: any) => batch.commands ?? batch)).toEqual(
			expect.arrayContaining([expect.objectContaining({ op: 'visibility', state: 'hidden' })]),
		)

		resolve('resolved')
		await settle()
		expect(container.children[0]).toBe(body)
		expect(body.visible).toBe(true)
		expect(body.props.text).toBe('resolved')
		container.dispatchEvent(container.children[1], 'tap', {})
		await settle()
		expect(fail).toHaveBeenCalledOnce()
		expect(uncaught).toHaveBeenCalledWith(error)
	})
})
