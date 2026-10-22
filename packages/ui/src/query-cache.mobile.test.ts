import { afterEach, describe, expect, it, vi } from 'vitest'
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
	flushUniversalSync,
} from 'octane/universal/native'

import {
	InstanceProfile,
	TwoProfiles,
	SuspenseProfile,
} from '../tests/query-cache.fixture.mobile.tsrx'

import { createQueryClient, defineQuery, type QueryClient } from './query-cache'

vi.mock('@octane-xplat/platform/environment', () => ({
	environment: { getSnapshot: () => ({}), subscribe: () => () => {} },
}))

const roots: ReturnType<typeof createUniversalRoot>[] = []
const clients: QueryClient[] = []
function mount(Component: any, props: any) {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	roots.push(root)
	root.render(Component, props)
	return {
		root,
		text: () =>
			container.children
				.filter((node: any) => node.type === 'label')
				.map((node: any) => node.props.text),
	}
}

async function settle() {
	for (let i = 0; i < 20; i++) {
		await Promise.resolve()
	}
	await new Promise<void>((resolve) => setTimeout(resolve, 0))
	flushUniversalSync(() => {})
}

function fixture() {
	const calls: Array<{ id: string; signal: AbortSignal; resolve: (value: string) => void }> = []
	const definition = defineQuery(
		['profile'],
		(id: string, { signal }) =>
			new Promise<string>((resolve) => calls.push({ id, signal, resolve })),
	)
	const client = createQueryClient()
	clients.push(client)
	return { client, definition, calls }
}

afterEach(async () => {
	for (const root of roots.splice(0)) {
		root.unmount()
	}
	await Promise.all(clients.splice(0).map((client) => client.dispose()))
})

describe('shared query readers on universal roots', () => {
	it('shares requests across independent roots and retains the remaining reader', async () => {
		const f = fixture()
		const a = mount(InstanceProfile, { ...f, id: 'same' })
		const b = mount(InstanceProfile, { ...f, id: 'same' })
		await settle()
		expect(f.calls).toHaveLength(1)
		a.root.unmount()
		expect(f.calls[0]!.signal.aborted).toBe(false)
		f.calls[0]!.resolve('shared')
		await settle()
		expect(b.text()).toEqual(['same:ready:shared:idle'])
	})
	it('keeps two same-family selections independent within one component', async () => {
		const f = fixture()
		const screen = mount(TwoProfiles, f)
		await settle()
		expect(f.calls.map((call) => call.id)).toEqual(['a', 'b'])
		f.calls[0]!.resolve('A')
		f.calls[1]!.resolve('B')
		await settle()
		expect(screen.text()).toEqual(['A:B'])
	})
	it('refreshes both roots once while retaining visible data', async () => {
		const f = fixture()
		const a = mount(InstanceProfile, { ...f, id: 'same' })
		const b = mount(InstanceProfile, { ...f, id: 'same' })
		await settle()
		f.calls[0]!.resolve('first')
		await settle()
		flushUniversalSync(() => f.client.invalidateQueries({ key: ['profile'] }))
		await settle()
		expect(f.calls).toHaveLength(2)
		expect(a.text()).toEqual(['same:ready:first:fetching'])
		expect(b.text()).toEqual(['same:ready:first:fetching'])
		f.calls[1]!.resolve('next')
		await settle()
		expect(a.text()).toEqual(['same:ready:next:idle'])
		expect(b.text()).toEqual(['same:ready:next:idle'])
	})
	it('does not let an obsolete selection overwrite a later selection', async () => {
		const f = fixture()
		const screen = mount(InstanceProfile, { ...f, id: 'a' })
		await settle()
		flushUniversalSync(() => screen.root.render(InstanceProfile, { ...f, id: 'b' }))
		await settle()
		f.calls[1]!.resolve('B')
		f.calls[0]!.resolve('A')
		await settle()
		expect(screen.text()).toEqual(['b:ready:B:idle'])
	})
	it('suspends for first data and removes disposed account data through the boundary', async () => {
		const f = fixture()
		const screen = mount(SuspenseProfile, f)
		await settle()
		expect(screen.text()).toEqual(['loading'])
		f.calls[0]!.resolve('private record')
		await settle()
		expect(screen.text()).toEqual(['private record'])
		await f.client.dispose()
		await settle()
		expect(screen.text()).toEqual(['retired'])
	})
	it('publishes a confirmed save to independent native roots without another request', async () => {
		const f = fixture()
		const a = mount(InstanceProfile, { ...f, id: 'same' })
		const b = mount(InstanceProfile, { ...f, id: 'same' })
		await settle()
		f.calls[0]!.resolve('first')
		await settle()
		flushUniversalSync(() => f.client.setQueryData(f.definition, 'same', 'saved'))
		await settle()
		expect(a.text()).toEqual(['same:ready:saved:idle'])
		expect(b.text()).toEqual(['same:ready:saved:idle'])
		expect(f.calls).toHaveLength(1)
	})
})
