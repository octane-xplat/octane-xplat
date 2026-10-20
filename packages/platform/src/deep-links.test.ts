import { beforeEach, expect, it, vi } from 'vitest'
const native = vi.hoisted(() => {
	const listeners = new Map<string, (args: any) => void>()
	const androidListeners = new Map<string, (args: any) => void>()
	const iosListeners = new Map<string, (args: any) => void>()
	return {
		listeners,
		androidListeners,
		iosListeners,
		app: {
			launched: true,
			hasLaunched: () => native.app.launched,
			launchEvent: 'launch',
			resumeEvent: 'resume',
			ios: null as any,
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
	native.iosListeners.clear()
	native.app.ios = null
	native.app.launched = true
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

it('suppresses the iOS launch echo once, then dispatches repeated URLs', async () => {
	sceneHost()
	const links = await import('./deep-links.ts')
	const received = vi.fn()
	links.onDeepLink(received)
	native.listeners.get('launch')!({
		ios: {
			objectForKey: () => ({ absoluteString: 'xplat://detail' }),
		},
	})

	// UIKit echoes the launch URL through openUrl once — suppressed.
	native.listeners.get('openUrl')!({ url: { absoluteString: 'xplat://detail' } })
	expect(received).not.toHaveBeenCalled()
	// A later identical URL is a new user action and must dispatch.
	native.listeners.get('openUrl')!({ url: { absoluteString: 'xplat://detail' } })
	native.listeners.get('openUrl')!({ url: { absoluteString: 'xplat://other' } })
	expect(received.mock.calls).toEqual([['xplat://detail'], ['xplat://other']])
	expect(links.consumeInitialUrl()).toBe('xplat://detail')
	expect(links.consumeInitialUrl()).toBeNull()
	native.app.ios = null
})

const iosSet = (...values: any[]) => ({
	allObjects: { count: values.length, objectAtIndex: (index: number) => values[index] },
})
const iosUrl = (url: string) => ({ URL: { absoluteString: url } })
function sceneHost() {
	native.app.ios = {
		on: (name: string, callback: (args: any) => void) => native.iosListeners.set(name, callback),
	}
}

it('adopts scene connection URLs once and delivers repeated warm scene URLs', async () => {
	sceneHost()
	const links = await import('./deep-links.ts')
	const received = vi.fn()
	links.onDeepLink(received)
	native.listeners.get('launch')!({ ios: {} })
	native.iosListeners.get('sceneWillConnect')!({
		connectionOptions: { URLContexts: iosSet(iosUrl('xplat://detail')) },
	})
	expect(links.consumeInitialUrl()).toBe('xplat://detail')
	expect(links.consumeInitialUrl()).toBeNull()
	// A host/plugin forwarding the same scene event into the legacy bus must not duplicate it.
	native.listeners.get('openUrl')!({ url: { absoluteString: 'xplat://detail' } })
	for (let i = 0; i < 2; i++)
		{native.iosListeners.get('sceneOpenURLContexts')!({
			urlContexts: iosSet(iosUrl('xplat://detail')),
		})}
	expect(received.mock.calls).toEqual([['xplat://detail'], ['xplat://detail']])
})

it('receives scene universal links and later scene connections without replacing an unconsumed cold link', async () => {
	sceneHost()
	const links = await import('./deep-links.ts')
	const received = vi.fn()
	links.onDeepLink(received)
	native.iosListeners.get('sceneWillConnect')!({
		connectionOptions: {
			userActivities: iosSet({ webpageURL: { absoluteString: 'https://example.test/cold' } }),
		},
	})
	native.iosListeners.get('sceneWillConnect')!({
		connectionOptions: { URLContexts: iosSet(iosUrl('xplat://second')) },
	})
	native.iosListeners.get('sceneContinueUserActivity')!({
		userActivity: { webpageURL: { absoluteString: 'https://example.test/warm' } },
	})
	expect(links.consumeInitialUrl()).toBe('https://example.test/cold')
	expect(received.mock.calls).toEqual([['xplat://second'], ['https://example.test/warm']])
})

it('classifies a pre-launch Android newIntent as one cold delivery', async () => {
	native.app.launched = false
	const links = await import('./deep-links.ts')
	const received = vi.fn()
	links.onDeepLink(received)
	const cold = intent('xplat://cold')
	native.androidListeners.get('activityNewIntent')!({ intent: cold })
	native.app.android.foregroundActivity = { getIntent: () => cold }
	native.listeners.get('resume')!({})
	expect(received).not.toHaveBeenCalled()
	expect(links.consumeInitialUrl()).toBeNull()
	native.listeners.get('launch')!({ android: cold })
	expect(links.consumeInitialUrl()).toBe('xplat://cold')
	expect(links.consumeInitialUrl()).toBeNull()
	native.app.android.foregroundActivity = { getIntent: () => cold }
	native.listeners.get('resume')!({})
	expect(received).not.toHaveBeenCalled()
	for (let i = 0; i < 2; i++)
		{native.androidListeners.get('activityNewIntent')!({ intent: intent('xplat://cold') })}
	expect(received.mock.calls).toEqual([['xplat://cold'], ['xplat://cold']])
})

it('preserves distinct early Intents while excluding the launch echo by identity', async () => {
	native.app.launched = false
	const links = await import('./deep-links.ts')
	const received = vi.fn()
	links.onDeepLink(received)
	const cold = intent('xplat://cold')
	const early = intent('xplat://other')
	native.androidListeners.get('activityNewIntent')!({ intent: cold })
	native.androidListeners.get('activityNewIntent')!({ intent: early })
	native.listeners.get('launch')!({ android: cold })
	expect(links.consumeInitialUrl()).toBe('xplat://cold')
	expect(received.mock.calls).toEqual([['xplat://other']])
	native.app.android.foregroundActivity = { getIntent: () => early }
	native.listeners.get('resume')!({})
	expect(received.mock.calls).toEqual([['xplat://other']])
})
