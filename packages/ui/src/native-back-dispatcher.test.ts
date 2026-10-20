import { beforeEach, expect, it, vi } from 'vitest'
const native = vi.hoisted(() => {
	const listeners: ((event: any) => void)[] = []
	const android = {
		on: (_name: string, callback: (event: any) => void) => listeners.push(callback),
	}
	const Application: any = { android, AndroidApplication: { activityBackPressedEvent: 'back' } }
	return { listeners, android, Application }
})
vi.mock('@nativescript/core', () => native)
import {
	isNativeActivityBackEvent,
	registerNativeBackHandler,
} from './native-back-dispatcher.android'
beforeEach(() => {
	delete native.Application[Symbol.for('octane-xplat.routing.android-back')]
	native.Application.android = native.android
	native.listeners.length = 0
})
function press(cancel = false) {
	const event = { cancel }
	for (const listener of native.listeners) {listener(event)}
	return event.cancel
}
it('orders interceptors before surfaces and legacy defaults, newest first within a priority', () => {
	const calls: string[] = []
	registerNativeBackHandler('legacy', {
		priority: -100,
		handle: () => {
			calls.push('legacy')
			return true
		},
	})
	registerNativeBackHandler('surface', {
		priority: 50,
		handle: () => {
			calls.push('surface')
			return true
		},
	})
	registerNativeBackHandler('old', {
		priority: 100,
		handle: () => {
			calls.push('old')
			return false
		},
	})
	registerNativeBackHandler('new', {
		priority: 100,
		handle: () => {
			calls.push('new')
			return false
		},
	})
	expect(press()).toBe(true)
	expect(calls).toEqual(['new', 'old', 'surface'])
	expect(native.listeners).toHaveLength(1)
})
it('replaces keyed registrations without letting a stale cleanup remove their replacement', () => {
	const old = vi.fn(() => true)
	const next = vi.fn(() => true)
	const detachOld = registerNativeBackHandler('same', { priority: 0, handle: old })
	const detachNext = registerNativeBackHandler('same', { priority: 0, handle: next })
	detachOld()
	expect(press()).toBe(true)
	expect(old).not.toHaveBeenCalled()
	expect(next).toHaveBeenCalledOnce()
	detachNext()
	expect(press()).toBe(false)
})
it('preserves an already consumed press and consumes a failing handler safely', () => {
	const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
	const handler = vi.fn(() => {
		throw new Error('private failure')
	})
	try {
		registerNativeBackHandler({}, { priority: 0, handle: handler })
		expect(press(true)).toBe(true)
		expect(handler).not.toHaveBeenCalled()
		expect(press()).toBe(true)
		expect(warn).toHaveBeenCalledWith('[octane-xplat] Android Back handler failed')
	} finally {
		warn.mockRestore()
	}
})
it('keeps one listener when modules reload', async () => {
	const old = vi.fn(() => false)
	registerNativeBackHandler('legacy', { priority: 0, handle: old })
	vi.resetModules()
	const reloaded = await import('./native-back-dispatcher.android')
	const next = vi.fn(() => true)
	reloaded.registerNativeBackHandler('legacy', { priority: 0, handle: next })
	expect(native.listeners).toHaveLength(1)
	expect(press()).toBe(true)
	expect(old).not.toHaveBeenCalled()
	expect(next).toHaveBeenCalledOnce()
})
it('distinguishes activity events from SDK modal events and does not subscribe before Android exists', () => {
	expect(isNativeActivityBackEvent({ cancel: false, object: native.Application })).toBe(true)
	expect(isNativeActivityBackEvent({ cancel: false, object: {} })).toBe(false)
	native.Application.android = undefined
	const detach = registerNativeBackHandler({}, { priority: 0, handle: () => true })
	detach()
	expect(native.listeners).toHaveLength(0)
})

it('does not invoke a lower handler removed during the same press', () => {
	const lower = vi.fn(() => true)
	const detach = registerNativeBackHandler('lower', { priority: 0, handle: lower })
	registerNativeBackHandler('upper', {
		priority: 10,
		handle: () => {
			detach()
			return false
		},
	})
	expect(press()).toBe(false)
	expect(lower).not.toHaveBeenCalled()
})
