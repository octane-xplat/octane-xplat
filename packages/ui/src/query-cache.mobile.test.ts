import { afterEach, describe, expect, it } from 'vitest'
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
	flushUniversalSync,
} from 'octane/universal/native'

import {
	InstanceProfile,
	SharedReader,
	sharedCalls,
	sharedSelection$,
} from '../tests/query-cache.fixture.mobile.tsrx'

import { clearQueryCache, invalidateQueries } from './query-cache'
import type { ProbeRequest } from '../tests/query-cache.fixture.mobile.tsrx'

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

function requests() {
	const calls: ProbeRequest[] = []
	const load = (id: string, { signal }: { signal: AbortSignal }) =>
		new Promise<string>((resolve, reject) => calls.push({ id, signal, resolve, reject }))

	return { calls, load }
}

afterEach(() => {
	for (const root of roots.splice(0)) {
		root.unmount()
	}

	sharedCalls.splice(0)
	sharedSelection$.set('a')
	clearQueryCache()
})

describe('cachedQuery$ on universal roots', () => {
	it('shares one request and its value between two instance-scoped screens', async () => {
		const { calls, load } = requests()
		const first = mount(InstanceProfile, { id: 'same', load })
		const second = mount(InstanceProfile, { id: 'same', load })
		await settle()
		// Two owning cells in two roots dedupe to one shared request.
		expect(calls.map((call) => call.id)).toEqual(['same'])
		calls[0].resolve('record')
		await settle()
		expect(first.text()).toEqual(['same:ready:record:false'])
		expect(second.text()).toEqual(['same:ready:record:false'])
	})

	it('keeps independent entries for different selections', async () => {
		const { calls, load } = requests()
		const first = mount(InstanceProfile, { id: 'a', load })
		const second = mount(InstanceProfile, { id: 'b', load })
		await settle()
		expect(calls.map((call) => call.id)).toEqual(['a', 'b'])
		calls[0].resolve('one')
		calls[1].resolve('two')
		await settle()
		expect(first.text()).toEqual(['a:ready:one:false'])
		expect(second.text()).toEqual(['b:ready:two:false'])
	})

	it('invalidateQueries refetches owners across roots while prior data stays visible', async () => {
		const { calls, load } = requests()
		const first = mount(InstanceProfile, { id: 'same', load })
		const second = mount(InstanceProfile, { id: 'same', load })
		await settle()
		expect(calls).toHaveLength(1)
		calls[0].resolve('v1')
		await settle()
		expect(first.text()).toEqual(['same:ready:v1:false'])

		flushUniversalSync(() => invalidateQueries(['profile']))
		await settle()
		// One shared fetch; both screens keep v1 while it runs.
		expect(calls).toHaveLength(2)
		expect(first.text()).toEqual(['same:ready:v1:true'])
		expect(second.text()).toEqual(['same:ready:v1:true'])
		calls[1].resolve('v2')
		await settle()
		expect(first.text()).toEqual(['same:ready:v2:false'])
		expect(second.text()).toEqual(['same:ready:v2:false'])
	})

	it('invalidateQueries scopes to the key prefix', async () => {
		const { calls, load } = requests()
		const profile = mount(InstanceProfile, { id: 'a', load })
		const shared = mount(SharedReader, {})
		await settle()
		expect(calls).toHaveLength(1)
		expect(sharedCalls).toHaveLength(1)
		calls[0].resolve('profile-one')
		sharedCalls[0].resolve('shared-one')
		await settle()
		expect(profile.text()).toEqual(['a:ready:profile-one:false'])
		expect(shared.text()).toEqual(['root:a:ready:shared-one:false'])

		flushUniversalSync(() => invalidateQueries(['profile']))
		await settle()
		// Only the 'profile' family refetches; 'shared-profile' is untouched.
		expect(calls).toHaveLength(2)
		expect(sharedCalls).toHaveLength(1)

		flushUniversalSync(() => invalidateQueries(['shared-profile']))
		await settle()
		expect(sharedCalls).toHaveLength(2)
	})

	it('a mounted module-level query shares its root cell across roots', async () => {
		// Fresh selection so the retained root cell takes a new request.
		flushUniversalSync(() => sharedSelection$.set('b'))
		const page = mount(SharedReader, { label: 'page' })
		const sheet = mount(SharedReader, { label: 'sheet' })
		await settle()
		expect(sharedCalls).toHaveLength(1)
		expect(sharedCalls[0].id).toBe('b')
		sharedCalls[0].resolve('doc')
		await settle()
		expect(page.text()).toEqual(['page:b:ready:doc:false'])
		expect(sheet.text()).toEqual(['sheet:b:ready:doc:false'])

		flushUniversalSync(() => sharedSelection$.set('c'))
		await settle()
		expect(sharedCalls).toHaveLength(2)
		expect(sharedCalls[1].id).toBe('c')
	})
})
