/** @jsxImportSource octane */
import { act } from 'octane'
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
