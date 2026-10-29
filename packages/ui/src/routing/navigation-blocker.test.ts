// @vitest-environment node
import { expect, it, vi } from 'vitest'
import {
	admitNavigationBlockers,
	connectNavigationBlockers,
	createNavigationBlocker,
	registerNavigationBlocker,
} from './navigation-blocker'

function deferred<T>() {
	let resolve!: (value: T) => void
	const promise = new Promise<T>((settle) => {
		resolve = settle
	})
	return { promise, resolve }
}

function attempt() {
	let live = true
	const cancelled = deferred<void>()
	const finished = deferred<void>()
	const cancel = vi.fn(() => {
		live = false
		cancelled.resolve()
	})
	return {
		action: 'push' as const,
		destination: Object.freeze({ to: '/next' }),
		cancellation: cancelled.promise,
		finished: finished.promise,
		isCurrent: () => live,
		cancel,
		finish: () => {
			live = false
			finished.resolve()
		},
	}
}

function controls(blocker: ReturnType<typeof createNavigationBlocker>) {
	const state = blocker.getSnapshot()
	expect(state.status).toBe('blocked')
	if (state.status !== 'blocked') {
		throw new Error('Expected a held attempt')
	}
	return state
}

it('holds an attempt until confirmation and keeps proceeding distinct from completion', async () => {
	const blocker = createNavigationBlocker()
	const request = attempt()
	let settled = false
	const pending = blocker.request(request).then((value) => {
		settled = true
		return value
	})
	const held = controls(blocker)
	expect(held).toMatchObject({ action: 'push', destination: { to: '/next' } })
	await Promise.resolve()
	expect(settled).toBe(false)
	held.proceed()
	expect(await pending).toBe(true)
	expect(blocker.getSnapshot().status).toBe('proceeding')
	held.reset()
	expect(blocker.getSnapshot().status).toBe('proceeding')
	expect(request.cancel).not.toHaveBeenCalled()
	request.finish()
	await vi.waitFor(() => expect(blocker.getSnapshot().status).toBe('idle'))
})

it('reset settles once as refusal and makes obsolete proceed/reset controls inert', async () => {
	const blocker = createNavigationBlocker()
	const request = attempt()
	const pending = blocker.request(request)
	const held = controls(blocker)
	held.reset()
	held.reset()
	held.proceed()
	expect(await pending).toBe(false)
	expect(request.cancel).toHaveBeenCalledTimes(1)
	expect(blocker.getSnapshot().status).toBe('idle')
})

it('external cancellation releases a held confirmation', async () => {
	const blocker = createNavigationBlocker()
	const request = attempt()
	const pending = blocker.request(request)
	const held = controls(blocker)
	request.cancel()
	expect(await pending).toBe(false)
	expect(blocker.getSnapshot().status).toBe('idle')
	held.proceed()
	expect(blocker.getSnapshot().status).toBe('idle')
})

it('a stale dialog cannot approve or reset a later attempt', async () => {
	const blocker = createNavigationBlocker()
	const first = attempt()
	const firstResult = blocker.request(first)
	const old = controls(blocker)
	const second = attempt()
	const secondResult = blocker.request(second)
	const current = controls(blocker)
	expect(await firstResult).toBe(false)
	old.proceed()
	old.reset()
	await Promise.resolve()
	expect(blocker.getSnapshot()).toBe(current)
	expect(second.cancel).not.toHaveBeenCalled()
	current.proceed()
	expect(await secondResult).toBe(true)
	second.finish()
})

it('already superseded attempts do not open confirmation', async () => {
	const blocker = createNavigationBlocker()
	const request = attempt()
	request.cancel()
	expect(await blocker.request(request)).toBe(false)
	expect(blocker.getSnapshot().status).toBe('idle')
})

it('all visible blockers approve, starting with the newest registration', async () => {
	const navigator = {}
	const disconnect = connectNavigationBlockers(navigator)
	const parent = createNavigationBlocker()
	const child = createNavigationBlocker()
	const removeParent = registerNavigationBlocker(navigator, {
		blocker: parent,
		shouldBlock: () => true,
	})
	const removeChild = registerNavigationBlocker(navigator, {
		blocker: child,
		shouldBlock: () => true,
	})
	const request = attempt()
	try {
		const pending = admitNavigationBlockers(navigator, request)
		expect(parent.getSnapshot().status).toBe('idle')
		controls(child).proceed()
		await vi.waitFor(() => expect(parent.getSnapshot().status).toBe('blocked'))
		expect(child.getSnapshot().status).toBe('proceeding')
		controls(parent).proceed()
		expect(await pending).toBe(true)
		request.finish()
		await vi.waitFor(() => expect(child.getSnapshot().status).toBe('idle'))
	} finally {
		request.finish()
		removeChild()
		removeParent()
		disconnect()
	}
})

it('a reset cancels the attempt instead of continuing to another blocker', async () => {
	const navigator = {}
	const disconnect = connectNavigationBlockers(navigator)
	const parent = createNavigationBlocker()
	const child = createNavigationBlocker()
	registerNavigationBlocker(navigator, { blocker: parent, shouldBlock: () => true })
	registerNavigationBlocker(navigator, { blocker: child, shouldBlock: () => true })
	const request = attempt()
	try {
		const pending = admitNavigationBlockers(navigator, request)
		controls(child).reset()
		expect(await pending).toBe(false)
		expect(parent.getSnapshot().status).toBe('idle')
	} finally {
		request.finish()
		disconnect()
	}
})

it('checks current visibility and skips hidden or removed registrations', async () => {
	const navigator = {}
	const disconnect = connectNavigationBlockers(navigator)
	const hidden = createNavigationBlocker()
	const removed = createNavigationBlocker()
	registerNavigationBlocker(navigator, { blocker: hidden, shouldBlock: () => false })
	const remove = registerNavigationBlocker(navigator, { blocker: removed, shouldBlock: () => true })
	remove()
	const request = attempt()
	try {
		expect(await admitNavigationBlockers(navigator, request)).toBe(true)
		expect(hidden.getSnapshot().status).toBe('idle')
		expect(removed.getSnapshot().status).toBe('idle')
	} finally {
		request.finish()
		disconnect()
	}
})

it('unmounting a blocked declaration cancels its held request', async () => {
	const navigator = {}
	const disconnect = connectNavigationBlockers(navigator)
	const blocker = createNavigationBlocker()
	const remove = registerNavigationBlocker(navigator, { blocker, shouldBlock: () => true })
	const request = attempt()
	try {
		const pending = admitNavigationBlockers(navigator, request)
		remove()
		remove()
		expect(await pending).toBe(false)
		expect(request.cancel).toHaveBeenCalledTimes(1)
	} finally {
		disconnect()
	}
})

it('disconnecting a flow settles confirmations without affecting another flow', async () => {
	const first = {},
		second = {}
	const disconnectFirst = connectNavigationBlockers(first)
	const disconnectSecond = connectNavigationBlockers(second)
	const a = createNavigationBlocker(),
		b = createNavigationBlocker()
	registerNavigationBlocker(first, { blocker: a, shouldBlock: () => true })
	registerNavigationBlocker(second, { blocker: b, shouldBlock: () => true })
	const firstRequest = attempt(),
		secondRequest = attempt()
	try {
		const firstResult = admitNavigationBlockers(first, firstRequest)
		const secondResult = admitNavigationBlockers(second, secondRequest)
		disconnectFirst()
		expect(await firstResult).toBe(false)
		expect(b.getSnapshot().status).toBe('blocked')
		controls(b).proceed()
		expect(await secondResult).toBe(true)
		expect(() => registerNavigationBlocker(first, { blocker: a, shouldBlock: () => true })).toThrow(
			'live canonical',
		)
	} finally {
		firstRequest.finish()
		secondRequest.finish()
		disconnectFirst()
		disconnectSecond()
	}
})

it('observer errors cannot leave reset or proceed waiting forever', async () => {
	const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
	const blocker = createNavigationBlocker()
	const unsubscribe = blocker.subscribe(() => {
		throw new Error('observer')
	})
	try {
		const first = attempt()
		const firstResult = blocker.request(first)
		controls(blocker).reset()
		expect(await firstResult).toBe(false)
		const second = attempt()
		const secondResult = blocker.request(second)
		controls(blocker).proceed()
		expect(await secondResult).toBe(true)
		second.finish()
		await vi.waitFor(() => expect(blocker.getSnapshot().status).toBe('idle'))
	} finally {
		unsubscribe()
		warn.mockRestore()
	}
})

it('an old flow disposer cannot detach a reconnected owner or its confirmation', async () => {
	const navigator = {}
	const firstDisconnect = connectNavigationBlockers(navigator)
	expect(() => connectNavigationBlockers(navigator)).toThrow('already connected')
	const blocker = createNavigationBlocker()
	const oldRemove = registerNavigationBlocker(navigator, { blocker, shouldBlock: () => true })
	firstDisconnect()
	const secondDisconnect = connectNavigationBlockers(navigator)
	registerNavigationBlocker(navigator, { blocker, shouldBlock: () => true })
	const request = attempt()
	try {
		const pending = admitNavigationBlockers(navigator, request)
		firstDisconnect()
		oldRemove()
		expect(blocker.getSnapshot().status).toBe('blocked')
		controls(blocker).proceed()
		expect(await pending).toBe(true)
	} finally {
		request.finish()
		secondDisconnect()
	}
})

it('keeps approved work proceeding when its condition registration is removed', async () => {
	const navigator = {}
	const disconnect = connectNavigationBlockers(navigator)
	const blocker = createNavigationBlocker()
	const remove = registerNavigationBlocker(navigator, { blocker, shouldBlock: () => true })
	const request = attempt()
	try {
		const pending = admitNavigationBlockers(navigator, request)
		controls(blocker).proceed()
		expect(await pending).toBe(true)
		remove()
		expect(blocker.getSnapshot().status).toBe('proceeding')
		expect(request.cancel).not.toHaveBeenCalled()
		request.finish()
		await vi.waitFor(() => expect(blocker.getSnapshot().status).toBe('idle'))
	} finally {
		request.finish()
		disconnect()
	}
})
