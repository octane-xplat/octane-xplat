// @vitest-environment jsdom
/** @jsxImportSource octane */
import { act, createRoot, useState } from 'octane'
import { RouteOutlet } from './RouteOutlet.web.tsrx'
import { configureRouter, router } from './default-router.web'
import { defineRoute } from './define-route'
import { defineRoutes } from './route-table'
import { DestinationRedirect } from './routing-core'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createAuthenticationExample } from '../tests/authentication-routing-example.web.tsrx'

const cleanups: (() => void | Promise<void>)[] = []

beforeEach(() => {
	history.replaceState(null, '', '/')
	vi.stubGlobal('matchMedia', (media: string) => ({
		media,
		matches: false,
		addEventListener() {},
		removeEventListener() {},
	}))

	vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
})

afterEach(async () => {
	for (const cleanup of cleanups.splice(0).reverse()) {
		await cleanup()
	}

	vi.unstubAllGlobals()
	vi.restoreAllMocks()
})

async function fixture() {
	const example = await createAuthenticationExample(async (update) => {
		await act(update)
	})

	cleanups.push(example.dispose)
	return example
}

it('cancels a modal sign-in without letting a late SDK result open protected content', async () => {
	const test = await fixture()
	await test.router.push({ to: '/' })
	await test.router.push({
		to: '/login',
		search: { returnTo: '/private/coat' },
		presentation: 'modal',
	})

	await test.click('sign-in')
	await test.click('cancel-sign-in')
	await vi.waitFor(() => expect(test.cancelled).toEqual(['committed']))
	expect(document.querySelector('[role="dialog"]')).toBeNull()
	await test.complete(0, { kind: 'success', account: { id: 'account-a' } })
	expect(test.outcomes).toEqual(['cancelled'])
	expect(test.account()).toBeNull()
	expect(test.loads()).toBe(0)
	expect(test.router.getSnapshot().route?.to).toBe('/')
	expect(document.getElementById('private-item')).toBeNull()
})

it('retries an expired sign-in and completes the return from the replacement owner', async () => {
	history.replaceState(null, '', '/private/coat')
	const test = await fixture()
	expect(await test.router.navigateUrl(location.pathname, { replace: true })).toMatchObject({
		status: 'committed',
		redirected: true,
	})

	expect(test.loads()).toBe(0)
	await test.click('sign-in')
	await test.complete(0, { kind: 'expired' })
	expect(document.getElementById('sign-in-status')?.textContent).toBe('expired')
	expect(test.account()).toBeNull()
	expect(test.loads()).toBe(0)
	await test.click('sign-in')
	await test.complete(1, { kind: 'success', account: { id: 'account-a' } })
	await vi.waitFor(() => expect(test.returned).toEqual(['committed']))
	expect(test.outcomes).toEqual(['expired', 'success'])
	expect(document.getElementById('private-item')?.textContent).toBe('account-a:coat')
	expect(test.loads()).toBe(1)
	expect(test.router.getSnapshot().route?.data).toEqual({ account: 'account-a', id: 'coat' })
	expect(location.pathname).toBe('/private/coat')
})

it('cancels a return started by the retiring account owner rather than reviving its data', async () => {
	const test = await fixture()
	await test.router.push({ to: '/login', search: { returnTo: '/private/coat' } })
	expect(await test.returnFromRetiringOwner({ id: 'account-a' }, '/private/coat')).toMatchObject({
		status: 'cancelled',
	})

	expect(document.getElementById('private-item')).toBeNull()
	expect(test.router.getSnapshot().route).toBeNull()
	expect(await test.router.navigateUrl('/private/coat', { replace: true })).toMatchObject({
		status: 'committed',
	})

	expect(document.getElementById('private-item')?.textContent).toBe('account-a:coat')
})

it('drops expired account data and rechecks the current URL without a redirect loop', async () => {
	const test = await fixture()
	await test.changeSession({ id: 'account-a' })
	await test.router.navigateUrl('/private/coat', { replace: true })
	const old = document.getElementById('private-item')
	expect(old?.textContent).toBe('account-a:coat')
	await test.changeSession(null)
	expect(old?.isConnected).toBe(false)
	expect(test.router.getSnapshot().route).toBeNull()
	expect(await test.router.navigateUrl(location.pathname, { replace: true })).toMatchObject({
		status: 'committed',
		redirected: true,
	})

	expect(test.router.getSnapshot().route?.to).toBe('/login')
	expect(document.getElementById('private-item')).toBeNull()
	expect(test.loads()).toBe(1)
	expect(await test.router.navigateUrl('/private/coat', { replace: true })).toMatchObject({
		status: 'committed',
		redirected: true,
	})

	expect(test.loads()).toBe(1)
})

it('public outlet authority retires private screens and pending work, then consumes one return', async () => {
	let account: { id: string } | null = { id: 'a' }
	let release!: () => void
	const returned: string[] = []
	const route = defineRoute.withContext<{ account: { id: string } | null }>()
	function Private(props: { data: string }) {
		return <p id="authority-private">{props.data}</p>
	}

	configureRouter({
		catalog: defineRoutes([
			route({ path: '/login' }).screen(() => <p id="authority-login">Login</p>),
			route({
				path: '/private/:id',
				beforeLoad: ({ context }) => {
					if (!context.account) {
						throw new DestinationRedirect({ to: '/login' })
					}

					return { user: context.account }
				},
				loader: ({ context }) => context.user.id,
			}).screen(Private),
			route({
				path: '/slow',
				loader: () =>
					new Promise<string>((resolve) => {
						release = () => resolve('old')
					}),
			}).screen(Private),
		]),
		context: () => ({ account }),
	})

	let update!: (version: number, resumeUrl?: string) => void
	function App() {
		const [state, setState] = useState<{ version: number; resumeUrl?: string }>({ version: 0 })
		update = (version, resumeUrl) => setState({ version, resumeUrl })
		return (
			<RouteOutlet
				authority={state.version}
				resumeUrl={state.resumeUrl}
				onResume={(result) => returned.push(result.status)}
			/>
		)
	}

	const container = document.createElement('div')
	document.body.append(container)
	const root = createRoot(container)
	try {
		history.replaceState(null, '', '/private/coat')
		await act(() => root.render(App))
		await vi.waitFor(() =>
			expect(container.querySelector('#authority-private')?.textContent).toBe('a'),
		)

		const old = container.querySelector('#authority-private')!
		const pending = router.navigateUrl('/slow')
		await vi.waitFor(() => expect(release).toBeTypeOf('function'))
		account = null
		await act(() => update(1))
		expect(old.isConnected).toBe(false)
		expect(await pending).toMatchObject({ status: 'cancelled' })
		await vi.waitFor(() => expect(container.querySelector('#authority-login')).not.toBeNull())
		release()
		account = { id: 'b' }
		await act(() => update(2, '/private/coat'))
		await vi.waitFor(() => expect(returned).toEqual(['committed']))
		expect(container.querySelector('#authority-private')?.textContent).toBe('b')
		await act(() => update(2, '/login'))
		expect(returned).toEqual(['committed'])
		expect(container.querySelector('#authority-private')?.textContent).toBe('b')
		// A return owned by an expired authority cannot notify the replacement.
		release = undefined!
		await act(() => update(3, '/slow'))
		await vi.waitFor(() => expect(release).toBeTypeOf('function'))
		const finishOldReturn = release
		await act(() => update(4, '/private/coat'))
		await vi.waitFor(() => expect(returned).toEqual(['committed', 'committed']))
		finishOldReturn()
		expect(container.querySelector('#authority-private')?.textContent).toBe('b')
	} finally {
		await act(() => root.unmount())
		container.remove()
	}
})

it('consumes a rejected return URL without an automatic retry', async () => {
	const test = await fixture()
	await test.changeSession({ id: 'account-a' }, 'https://untrusted.invalid/private/coat')
	await vi.waitFor(() => expect(test.returned).toEqual(['invalid-input']))
	await act(async () => {
		await Promise.resolve()
		await Promise.resolve()
	})

	expect(test.returned).toEqual(['invalid-input'])
	expect(test.loads()).toBe(0)
})
