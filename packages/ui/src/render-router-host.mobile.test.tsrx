/** @jsxImportSource @octane-xplat/jsx */
import { expect, it, vi } from 'vitest'
import { createContext, useContext, useState } from 'octane'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
function TestView(props: any) { return <stacklayout style={props.style}>{props.children}</stacklayout> }
vi.mock('./View', () => ({ get View() { return TestView } }))
// The mobile pane executor needs the real SDK only for instanceof checks;
// object-driver targets are plain objects and correctly report unsupported.
vi.mock('@nativescript/core', () => ({ View: class View {} }))
import { createRenderRouterHost } from './render-router-host'
import { RenderRouteOutlet } from './RenderRouteOutlet.tsrx'
import { createRouter } from './router-instance'
import { defineRoute } from './define-route'
import { defineRoutes } from './route-table'
import { defineTransitions } from './route-transitions'
import { RouteForbidden, DestinationRedirect } from './routing-core'
import { getRouteApi, useRouter } from './router-hooks.tsrx'
import type { RouterInstance, TransitionRegistry } from './props'

const Person = createContext('missing')
const PersonProvider: any = Person
const observations = new Map<string, { title: string; count: number; person: string; increment(): void; navigation: ReturnType<typeof useRouter> }>()
let navigation: RouterInstance<any>
let removeOwner = () => {}
let restoreOwner = () => {}
let changePerson = (_value: string) => {}
function Item() {
	const route = getRouteApi('/items/:id', navigation)
	const id = route.useParams().id
	const title = route.useLoaderData().title
	const person = useContext(Person)
	const [count, setCount] = useState(0)
	const router = useRouter(navigation)
	observations.set(id, { title, count, person, increment: () => setCount(value => value + 1), navigation: router })
	return <label text={title + ':' + count + ':' + person} />
}
function Broken() { throw new Error('pane render failed') }
function App(props: { platform: ReturnType<typeof createRenderRouterHost> }) {
	const [owned, setOwned] = useState(true)
	const [person, setPerson] = useState('Avery')
	removeOwner = () => setOwned(false)
	restoreOwner = () => setOwned(true)
	changePerson = setPerson
	return <PersonProvider value={person}>{owned ? <RenderRouteOutlet host={props.platform}><label text="base" /></RenderRouteOutlet> : <label text="outside" />}
		<RenderRouteOutlet host={props.platform} flow="other"><label text="other base" /></RenderRouteOutlet>
	</PersonProvider>
}
async function tick() { flushUniversalSync(() => {}); await new Promise(resolve => setTimeout(resolve, 0)); flushUniversalSync(() => {}) }
async function drive<T>(promise: Promise<T>): Promise<T> {
	let settled = false
	void promise.then(() => { settled = true }, () => { settled = true })
	for (let i = 0; i < 100 && !settled; i++) await tick()
	expect(settled).toBe(true)
	return promise
}
async function fixture<const Effects extends TransitionRegistry = {}>(effects?: Effects, behavior?: { guard?(id: string): void | Promise<void>; title?(id: string, load: number): string }) {
	observations.clear()
	let loads = 0
	const platform = createRenderRouterHost()
	const router = createRouter({ catalog: defineRoutes([defineRoute({ path: '/items/:id', beforeLoad: ({ params }) => behavior?.guard?.(params.id), loader: ({ params }) => { const load = ++loads; return { title: behavior?.title?.(params.id, load) ?? params.id + load } } }).screen(Item)]), host: platform.host, transitions: effects, stacks: ['other'] })
	navigation = router
	platform.attach(router)
	const root = createUniversalRoot(createObjectContainer('nativescript'), createObjectDriver('nativescript'))
	root.render(App, { platform })
	await tick()
	return { router, platform, root, close() { root.unmount(); router.dispose() } }
}

it('commits rendered panes, retains local state and providers, and refreshes in place', async () => {
	const test = await fixture()
	try {
		expect((await drive(test.router.push({ to: '/items/:id', params: { id: 'coat' } }))).status).toBe('committed')
		observations.get('coat')!.increment()
		await tick()
		await drive(test.router.push({ to: '/items/:id', params: { id: 'hat' } }))
		expect(observations.get('coat')).toMatchObject({ title: 'coat1', count: 1, person: 'Avery' })
		changePerson('Jordan')
		await tick()
		expect(observations.get('coat')!.person).toBe('Jordan')
		expect(observations.get('hat')!.person).toBe('Jordan')
		await drive(observations.get('hat')!.navigation.back())
		expect(test.router.getSnapshot().route?.params.id).toBe('coat')
		expect(observations.get('coat')!.count).toBe(1)
		await drive(test.router.refresh())
		expect(observations.get('coat')).toMatchObject({ title: 'coat4', count: 1 })
		await drive(test.router.back())
		expect(test.router.getSnapshot().route).toBe(null)
		expect(test.router.getSnapshot().canGoBack).toBe(false)
	} finally { test.close() }
})

it('keeps independent flow histories and implements replace and reset', async () => {
	const test = await fixture()
	try {
		await drive(test.router.push({ to: '/items/:id', params: { id: 'coat' } }))
		await drive(test.router.forStack('other' as any).push({ to: '/items/:id', params: { id: 'hat' } }))
		expect(test.router.getSnapshot().route?.params.id).toBe('coat')
		await drive(test.router.replace({ to: '/items/:id', params: { id: 'cap' } }))
		expect(test.platform.views.getSnapshot().get('root')!.entries).toHaveLength(2)
		await drive(test.router.reset({ to: '/items/:id', params: { id: 'glove' } }))
		expect(test.router.getSnapshot().canGoBack).toBe(false)
		expect(test.platform.views.getSnapshot().get('root')!.entries).toHaveLength(1)
		expect(test.router.forStack('other' as any).getSnapshot().route?.params.id).toBe('hat')
	} finally { test.close() }
})

it('blocks missing owners and reports render failures without waiting forever', async () => {
	const test = await fixture()
	try {
		test.router.addRoutes(defineRoutes([defineRoute({ path: '/render-failure/:id' }).screen(Broken)]), { id: 'broken', conflict: 'replace' })
		expect(await drive(test.router.push({ to: '/render-failure/:id', params: { id: 'coat' } }))).toMatchObject({ status: 'failed', phase: 'commit' })
		removeOwner()
		await tick()
		expect(test.platform.views.getSnapshot().has('root')).toBe(false)
		expect((await test.router.push({ to: '/items/:id', params: { id: 'hat' } })).status).toBe('blocked')
	} finally { test.close() }
})

it('finishes accepted commits in order rather than cancelling an earlier receipt', async () => {
	const test = await fixture()
	try {
		const command = (id: string) => ({ action: 'push' as const, flow: 'root', route: { to: '/items/:id', href: '/items/' + id, params: { id }, search: {}, context: {}, data: { title: id }, stack: 'root' }, content: { screen: Item, layouts: [], props: {} }, isCurrent: () => true, beginCommit: () => true })
		const first = Promise.resolve(test.platform.host.commit(command('coat') as any))
		// Allow acceptance without flushing a renderer commit.
		await Promise.resolve()
		const second = Promise.resolve(test.platform.host.commit(command('hat') as any))
		const [coat, hat] = await drive(Promise.all([first, second]))
		expect(coat).toMatchObject({ status: 'committed', route: { params: { id: 'coat' } } })
		expect(hat).toMatchObject({ status: 'committed', route: { params: { id: 'hat' } } })
		expect(test.platform.views.getSnapshot().get('root')!.entries).toHaveLength(3)
	} finally { test.close() }
})

it('keeps the current pane until a composition barrier completes and preserves it if the barrier fails', async () => {
	const test = await fixture()
	let release!: () => void
	try {
		await drive(test.router.push({ to: '/items/:id', params: { id: 'coat' } }))
		observations.get('coat')!.increment()
		await tick()
		const barrier = new Promise<void>(resolve => { release = resolve })
		let waiting = false
		const original = test.platform.host.commit.bind(test.platform.host)
		test.platform.host.commit = command => original({ ...command, beforeMutation: () => { waiting = true; return barrier } })
		const pending = test.router.replace({ to: '/items/:id', params: { id: 'hat' } })
		for (let i = 0; i < 100 && !waiting; i++) await tick()
		expect(waiting).toBe(true)
		expect(test.router.getSnapshot().route?.params.id).toBe('coat')
		expect(observations.get('coat')!.count).toBe(1)
		release()
		expect((await drive(pending)).status).toBe('committed')
		test.platform.host.commit = command => original({ ...command, beforeMutation: () => { throw new Error('cleanup failed') } })
		expect(await drive(test.router.reset({ to: '/items/:id', params: { id: 'glove' } }))).toMatchObject({ status: 'failed', phase: 'commit' })
		expect(test.router.getSnapshot().route?.params.id).toBe('hat')
	} finally { release?.(); test.close() }
})

it('stages failed push, replace and reset without discarding the current pane state', async () => {
	const test = await fixture()
	try {
		await drive(test.router.push({ to: '/items/:id', params: { id: 'coat' } }))
		observations.get('coat')!.increment()
		await tick()
		let barriers = 0
		const original = test.platform.host.commit.bind(test.platform.host)
		test.platform.host.commit = command => original({ ...command, beforeMutation: () => { barriers++ } })
		const broken = test.router.addRoutes(defineRoutes([defineRoute({ path: '/render-failure/:id' }).screen(Broken)]), { id: 'broken-staging', conflict: 'replace' })
		try {
			for (const action of ['push', 'replace', 'reset'] as const) {
				expect(await drive(test.router[action]({ to: '/render-failure/:id', params: { id: 'broken' } }))).toMatchObject({ status: 'failed', phase: 'commit' })
				expect(test.router.getSnapshot().route?.params.id).toBe('coat')
				expect(observations.get('coat')!.count).toBe(1)
				expect(test.platform.views.getSnapshot().get('root')?.staged).toBeUndefined()
			}
			expect(barriers).toBe(0)
			changePerson('Jordan')
			await tick()
			expect(observations.get('coat')).toMatchObject({ count: 1, person: 'Jordan' })
		} finally { broken.dispose() }
		await drive(test.router.push({ to: '/items/:id', params: { id: 'hat' } }))
		expect(barriers).toBe(1)
	} finally { test.close() }
})

it('does not revive an old commit in a remounted pane after its barrier completes', async () => {
	const test = await fixture()
	let release!: () => void
	try {
		let waiting = false
		const barrier = new Promise<void>(resolve => { release = resolve })
		const original = test.platform.host.commit.bind(test.platform.host)
		test.platform.host.commit = command => original({ ...command, beforeMutation: () => { waiting = true; return barrier } })
		const pending = test.router.push({ to: '/items/:id', params: { id: 'coat' } })
		for (let i = 0; i < 100 && !waiting; i++) await tick()
		expect(waiting).toBe(true)
		removeOwner()
		await tick()
		restoreOwner()
		await tick()
		release()
		expect(await drive(pending)).toMatchObject({ status: 'cancelled', reason: 'disposed' })
		expect(test.router.getSnapshot().route).toBeNull()
		expect(test.platform.views.getSnapshot().get('root')?.entries).toEqual([null])
		expect((await drive(test.router.push({ to: '/items/:id', params: { id: 'hat' } }))).status).toBe('committed')
	} finally { release?.(); test.close() }
})

it('does not stage a screen for a command already known to be obsolete', async () => {
	const test = await fixture()
	try {
		const original = test.platform.host.commit.bind(test.platform.host)
		test.platform.host.commit = command => original({ ...command, isCurrent: () => false })
		expect(await drive(test.router.push({ to: '/items/:id', params: { id: 'stale' } }))).toMatchObject({ status: 'cancelled', reason: 'superseded' })
		expect(observations.has('stale')).toBe(false)
		expect(test.platform.views.getSnapshot().get('root')?.entries).toEqual([null])
	} finally { test.close() }
})

it('honors explicit skipped definitions on opening a pane and reversing its entry', async () => {
  const test = await fixture(defineTransitions({ fallback: { kind: 'skip' } }))
  try {
    const opened = await drive(test.router.push({ to: '/items/:id', params: { id: 'coat' }, transition: 'fallback' }))
    expect(opened.status === 'committed' && await opened.finished).toEqual({ status: 'skipped', reason: 'disabled' })
    const back = await drive(test.router.back())
    expect(back.status === 'committed' && await back.finished).toEqual({ status: 'skipped', reason: 'disabled' })
  } finally { test.close() }
})

it('rechecks a retained pane before revealing it and preserves local state after admission', async () => {
	let allowed = true
	let account = 'a'
	const test = await fixture(undefined, {
		guard() { if (!allowed) throw new RouteForbidden() },
		title(id, load) { return account + ':' + id + load },
	})
	try {
		await drive(test.router.push({ to: '/items/:id', params: { id: 'coat' } }))
		observations.get('coat')!.increment()
		await tick()
		await drive(test.router.push({ to: '/items/:id', params: { id: 'hat' } }))
		allowed = false
		account = 'b'
		expect(await drive(test.router.back())).toEqual({ status: 'forbidden' })
		expect(test.router.getSnapshot().route?.params.id).toBe('hat')
		expect(observations.get('coat')!.title).toBe('a:coat1')
		allowed = true
		expect((await drive(test.router.retry())).status).toBe('committed')
		expect(observations.get('coat')).toMatchObject({ title: 'b:coat3', count: 1, person: 'Avery' })
	} finally { test.close() }
})

it('replaces the retained target on a guard redirect without borrowing its local state', async () => {
	let redirect = false
	const test = await fixture(undefined, { guard(id) { if (redirect && id === 'coat') throw new DestinationRedirect({ to: '/items/:id', params: { id: 'cap' } }) } })
	try {
		await drive(test.router.push({ to: '/items/:id', params: { id: 'coat' } }))
		observations.get('coat')!.increment()
		await tick()
		await drive(test.router.push({ to: '/items/:id', params: { id: 'hat' } }))
		redirect = true
		const result = await drive(test.router.back())
		expect(result.status === 'committed' && result.redirected).toBe(true)
		expect(test.router.getSnapshot().route?.params.id).toBe('cap')
		expect(observations.get('cap')).toMatchObject({ title: 'cap3', count: 0 })
		expect(test.platform.views.getSnapshot().get('root')?.entries).toHaveLength(2)
	} finally { test.close() }
})

it('lets a newer pane navigation cancel a pending history guard without revealing its target', async () => {
	let waiting = false
	let started = false
	let finish!: () => void
	const gate = new Promise<void>(resolve => { finish = resolve })
	const test = await fixture(undefined, { async guard(id) { if (waiting && id === 'coat') { started = true; await gate } } })
	try {
		await drive(test.router.push({ to: '/items/:id', params: { id: 'coat' } }))
		await drive(test.router.push({ to: '/items/:id', params: { id: 'hat' } }))
		waiting = true
		const older = test.router.back()
		for (let index = 0; index < 100 && !started; index++) await tick()
		expect(started).toBe(true)
		expect((await drive(test.router.replace({ to: '/items/:id', params: { id: 'cap' } }))).status).toBe('committed')
		expect(await drive(older)).toEqual({ status: 'cancelled', reason: 'superseded' })
		finish()
		await tick()
		expect(test.router.getSnapshot().route?.params.id).toBe('cap')
		expect(test.platform.views.getSnapshot().get('root')?.entries).toHaveLength(3)
	} finally { finish(); test.close() }
})
