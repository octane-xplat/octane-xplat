import { describe, expect, it } from 'vitest'
import { createAppKitFocusVisibleSource } from './focus-visible-source.macos'

function host() {
	let key!: (event: any) => any
	let inactive!: () => void
	const removed: string[] = []
	let installs = 0
	const native = {
		NSEvent: {
			addLocalMonitorForEventsMatchingMaskHandler: (_mask: number, callback: typeof key) => {
				installs++
				key = callback
				return 'monitor'
			},
			removeMonitor: (token: string) => removed.push(token),
		},
		NSNotificationCenter: { defaultCenter: {
			addObserverForNameObjectQueueUsingBlock: (_name: string, _object: unknown, _queue: unknown, callback: () => void) => {
				inactive = callback
				return 'observer'
			},
			removeObserver: (token: string) => removed.push(token),
		} },
	}
	return { native, removed, installs: () => installs, event: (type: number, modifierFlags = 0) => {
		const event = { type, modifierFlags }
		expect(key(event)).toBe(event)
	}, inactive: () => inactive() }
}

describe('AppKit input modality source', () => {
	it('reports keyboard/pointer changes without consuming native events', () => {
		const env = host()
		const source = createAppKitFocusVisibleSource(() => env.native)
		const snapshots: unknown[] = []
		const off = source.subscribe(() => snapshots.push(source.getSnapshot()))
		expect(source.getSnapshot()).toEqual({ isSupported: true, isFocusVisible: false, inputModality: 'unknown' })
		env.event(10)
		expect(source.getSnapshot()).toEqual({ isSupported: true, isFocusVisible: true, inputModality: 'keyboard' })
		const stable = source.getSnapshot()
		env.event(10)
		expect(source.getSnapshot()).toBe(stable)
		for (const type of [1, 3, 25]) {
			env.event(type)
			expect(source.getSnapshot().inputModality).toBe('pointer')
		}
		expect(source.getSnapshot().isFocusVisible).toBe(false)
		expect(snapshots.length).toBe(3) // Initial support, keyboard, pointer.
		off()
	})

	it('ignores modified shortcuts and resets when the app deactivates', () => {
		const env = host()
		const source = createAppKitFocusVisibleSource(() => env.native)
		const off = source.subscribe(() => {})
		for (const modifier of [1 << 18, 1 << 19, 1 << 20]) env.event(10, modifier)
		expect(source.getSnapshot().inputModality).toBe('unknown')
		env.event(10, 1 << 17) // Shift+Tab remains keyboard input.
		expect(source.getSnapshot().isFocusVisible).toBe(true)
		env.inactive()
		expect(source.getSnapshot().inputModality).toBe('unknown')
		expect(source.getSnapshot().isFocusVisible).toBe(false)
		off()
	})

	it('shares observation and tears it down only after the last hook reader', () => {
		const env = host()
		const source = createAppKitFocusVisibleSource(() => env.native)
		const a = source.subscribe(() => {})
		const b = source.subscribe(() => {})
		expect(env.installs()).toBe(1)
		a()
		expect(env.removed).toEqual([])
		b()
		expect(env.removed).toEqual(['monitor', 'observer'])
		const c = source.subscribe(() => {})
		expect(env.installs()).toBe(2)
		c()
	})

	it('retains non-hook global observation until explicitly disposed', () => {
		const env = host()
		const source = createAppKitFocusVisibleSource(() => env.native)
		expect(source.isFocusVisible()).toBe(false)
		env.event(10)
		expect(source.isFocusVisible()).toBe(true)
		const off = source.subscribe(() => {})
		off()
		expect(env.removed).toEqual([])
		source.dispose()
		expect(env.removed).toEqual(['monitor', 'observer'])
		expect(source.getSnapshot().inputModality).toBe('unknown')
	})

	it('reports unavailable bridges honestly and releases partial registration', () => {
		const missing = createAppKitFocusVisibleSource(() => ({}))
		const off = missing.subscribe(() => {})
		expect(missing.getSnapshot().isSupported).toBe(false)
		off()
		const env = host()
		env.native.NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock = () => { throw new Error('registration failed') }
		const source = createAppKitFocusVisibleSource(() => env.native)
		const cleanup = source.subscribe(() => {})
		expect(source.getSnapshot().isSupported).toBe(false)
		expect(env.removed).toEqual(['monitor'])
		cleanup()
	})
})
