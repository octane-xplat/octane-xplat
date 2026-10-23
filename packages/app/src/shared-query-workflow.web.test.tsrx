// @vitest-environment jsdom
import { expect, it, vi } from 'vitest'
import { createRoot, flushSync } from 'octane'
import { createMemoryQueryStorage } from '@octane-xplat/ui/data'
import { inspectQueryClient } from '@octane-xplat/ui/data/dev'
import { createDemoSession, demoSession } from './shared-query-data'
import { CachedUsers } from './app/cached-users.tsrx'
import { CachedUser } from './app/cached-user.tsrx'

// This component check owns the data workflow; the browser task exercises real routing.
vi.mock('@octane-xplat/ui/routing', () => ({ useRouter: () => ({ push() {}, back() {} }) }))

async function until(condition: () => boolean) {
	const deadline = Date.now() + 5000
	while (!condition() && Date.now() < deadline)
		await new Promise((resolve) => setTimeout(resolve, 0))
	expect(condition()).toBe(true)
}

it('renders a prepared list/detail workflow, confirmed edits, rollback, pages and isolated account replacement', async () => {
	const storage = createMemoryQueryStorage()
	const session = createDemoSession('Trace A', { storage, latencyMs: 0 })
	const previous = demoSession.getSnapshot()
	demoSession.set(session)
	await previous.queries.dispose()
	const inspector = inspectQueryClient(session.queries, {
		labels: [{ definition: session.users, label: 'users.detail' }],
	})
	const hosts = [document.createElement('div'), document.createElement('div')]
	hosts.forEach((host) => document.body.append(host))
	const roots = hosts.map((host) => createRoot(host))
	const click = (root: number, id: string) => {
		const element = hosts[root].querySelector<HTMLElement>(`#${id}`)
		if (!element) throw new Error(`Missing ${id}`)
		flushSync(() => element.click())
	}
	try {
		await session.queries.ensureData(session.feed, '')
		const user = await session.queries.ensureData(session.users, '1')
		roots[0].render(CachedUsers, {})
		roots[1].render(CachedUser, { params: {}, search: { id: '1' }, data: user, context: { previousRouteName: 'cached-users' } })
		await until(() => hosts[1].querySelector('#cached-name')?.textContent === 'Trace A user 1')
		const detail = inspector.snapshot().queries.find((query) => query.label === 'users.detail')!
		expect(
			inspector
				.snapshot()
				.events.filter((event) => event.queryId === detail.queryId && event.type === 'load'),
		).toHaveLength(1)
		click(1, 'cached-save')
		await until(() => hosts[1].textContent?.includes('Saved.') === true)
		expect(hosts[0].querySelector('#cached-user-1')?.textContent).toBe('Trace A user 1!')
		click(1, 'cached-reject')
		await until(() => hosts[1].textContent?.includes('Save rejected.') === true)
		expect(hosts[1].querySelector('#cached-name')?.textContent).toBe('Trace A user 1!')
		click(0, 'cached-more')
		await until(() => hosts[0].querySelector('#cached-user-6') !== null)
		roots[1].unmount()
		expect(hosts[0].querySelector('#cached-user-6')).not.toBeNull()
		const next = createDemoSession('Trace B', { storage, latencyMs: 0 })
		flushSync(() => demoSession.set(next))
		await session.queries.dispose()
		await until(() => hosts[0].querySelector('#cached-user-1')?.textContent === 'Trace B user 1')
		expect(hosts[0].textContent).not.toContain('Trace A user')
	} finally {
		roots.forEach((root) => root.unmount())
		hosts.forEach((host) => host.remove())
		inspector.dispose()
		await session.queries.dispose()
		await demoSession.getSnapshot().queries.dispose()
	}
})

it('restores a coherent saved detail and retained feed window in a new client', async () => {
	const storage = createMemoryQueryStorage()
	const first = createDemoSession('Restore trace', { storage, latencyMs: 0 })
	let next: ReturnType<typeof createDemoSession> | undefined
	try {
		await first.queries.ensureData(first.feed, '')
		await first.queries.fetchNextPage(first.feed, '')
		await first.queries.ensureData(first.users, '1')
		await first.saveUser('1', 'Confirmed name')
		expect(first.queries.getQueryData(first.users, '1')?.name).toBe('Confirmed name')
		await first.queries.dispose()
		next = createDemoSession('Restore trace', { storage, latencyMs: 0 })
		const inspector = inspectQueryClient(next.queries)
		try {
			expect((await next.queries.ensureData(next.users, '1')).name).toBe('Confirmed name')
			const data = await next.queries.ensureData(next.feed, '')
			expect(data.pageParams).toEqual([0, 3])
			expect(data.pages[0]?.items[0]?.name).toBe('Confirmed name')
			expect(inspector.snapshot().events.filter((event) => event.type === 'restore')).toHaveLength(
				2,
			)
		} finally {
			inspector.dispose()
		}
	} finally {
		await first.queries.dispose()
		await next?.queries.dispose()
	}
})
