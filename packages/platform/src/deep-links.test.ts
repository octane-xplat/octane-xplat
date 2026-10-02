import { beforeEach, expect, it, vi } from 'vitest'
const native = vi.hoisted(() => {
	const listeners = new Map<string, (args: any) => void>()
	const androidListeners = new Map<string, (args: any) => void>()
	return {
		listeners,
		androidListeners,
		app: {
			launchEvent: 'launch',
			resumeEvent: 'resume',
			ios: null,
			on: (name: string, cb: (args: any) => void) => listeners.set(name, cb),
			android: {
				on: (name: string, cb: (args: any) => void) => androidListeners.set(name, cb),
				foregroundActivity: null as any,
			},
		},
	}
})

vi.mock('@nativescript/core', () => ({ Application: native.app }))
beforeEach(() => {
	vi.resetModules()
	native.listeners.clear()
	native.androidListeners.clear()
})

const intent = (url: string) => ({ getDataString: () => url })
it('delivers a cold link once through consumeInitialUrl, not also the listener', async () => {
	const links = await import('./deep-links.ts')
	const received = vi.fn()
	links.onDeepLink(received)
	const launch = intent('xplat://detail')
	native.app.android.foregroundActivity = { getIntent: () => launch }
	native.listeners.get('launch')!({ android: launch })
	expect(links.consumeInitialUrl()).toBe('xplat://detail')
	expect(links.consumeInitialUrl()).toBeNull()
	native.listeners.get('resume')!({})
	expect(received).not.toHaveBeenCalled()
})

it('accepts repeated warm URLs from distinct intents, deduplicating resume', async () => {
	const links = await import('./deep-links.ts')
	const received = vi.fn()
	links.onDeepLink(received)
	for (let i = 0; i < 2; i++) {
		const next = intent('xplat://detail')
		native.app.android.foregroundActivity = { getIntent: () => next }
		native.androidListeners.get('activityNewIntent')?.({ intent: next })
		native.listeners.get('resume')!({})
	}

	expect(received.mock.calls).toEqual([['xplat://detail'], ['xplat://detail']])
})
