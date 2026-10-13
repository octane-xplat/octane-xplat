import { afterEach, describe, expect, it, vi } from 'vitest'
import { observeReducedMotion, readReducedMotion } from './reduced-motion.macos'

afterEach(() => vi.unstubAllGlobals())

function host(reduced = false) {
	const callbacks = new Map<object, () => void>()
	const center = {
		addObserverForNameObjectQueueUsingBlock: vi.fn(
			(_name: string, _object: unknown, _queue: unknown, callback: () => void) => {
				const token = {}
				callbacks.set(token, callback)
				return token
			},
		),
		removeObserver: vi.fn((token: object) => {
			callbacks.delete(token)
		}),
	}

	const workspace = { accessibilityDisplayShouldReduceMotion: reduced, notificationCenter: center }
	const queue = {}
	vi.stubGlobal('NSWorkspace', { sharedWorkspace: workspace })
	vi.stubGlobal('NSOperationQueue', { mainQueue: queue })
	vi.stubGlobal(
		'NSWorkspaceAccessibilityDisplayOptionsDidChangeNotification',
		'accessibility-change',
	)

	const defaultCenter = {
		addObserverForNameObjectQueueUsingBlock: vi.fn(),
		removeObserver: vi.fn(),
	}

	vi.stubGlobal('NSNotificationCenter', { defaultCenter })
	return {
		workspace,
		center,
		queue,
		defaultCenter,
		callbacks,
		post: () => [...callbacks.values()].forEach((callback) => callback()),
	}
}

describe('macOS reduced-motion preference', () => {
	it.each([false, true])('reads the initial OS preference %s without subscribing', (reduced) => {
		const fixture = host(reduced)
		expect(readReducedMotion()).toBe(reduced)
		expect(fixture.center.addObserverForNameObjectQueueUsingBlock).not.toHaveBeenCalled()
	})

	it('subscribes to the workspace center on the main queue and reads both live transitions', () => {
		const fixture = host()
		const values: boolean[] = []
		const off = observeReducedMotion(() => values.push(readReducedMotion()))
		expect(values).toEqual([])
		expect(fixture.center.addObserverForNameObjectQueueUsingBlock).toHaveBeenCalledWith(
			'accessibility-change',
			fixture.workspace,
			fixture.queue,
			expect.any(Function),
		)

		fixture.workspace.accessibilityDisplayShouldReduceMotion = true
		fixture.post()
		fixture.workspace.accessibilityDisplayShouldReduceMotion = false
		fixture.post()
		expect(values).toEqual([true, false])
		off()
		expect(fixture.defaultCenter.addObserverForNameObjectQueueUsingBlock).not.toHaveBeenCalled()
		expect(fixture.defaultCenter.removeObserver).not.toHaveBeenCalled()
	})

	it('removes the exact token once from its original center and ignores queued callbacks', () => {
		const fixture = host()
		const notify = vi.fn()
		const off = observeReducedMotion(notify)
		const [token, callback] = [...fixture.callbacks.entries()][0]
		const replacement = host()
		off()
		off()
		callback()
		fixture.post()
		expect(notify).not.toHaveBeenCalled()
		expect(fixture.center.removeObserver).toHaveBeenCalledExactlyOnceWith(token)
		expect(fixture.callbacks.size).toBe(0)
		expect(replacement.center.removeObserver).not.toHaveBeenCalled()
	})

	it('keeps subscriptions independent across unsubscribe and resubscribe', () => {
		const fixture = host()
		const first = vi.fn(),
			second = vi.fn(),
			third = vi.fn()

		const offFirst = observeReducedMotion(first)
		const offSecond = observeReducedMotion(second)
		offFirst()
		fixture.post()
		const offThird = observeReducedMotion(third)
		fixture.post()
		expect(first).not.toHaveBeenCalled()
		expect(second).toHaveBeenCalledTimes(2)
		expect(third).toHaveBeenCalledTimes(1)
		offSecond()
		offThird()
		expect(fixture.callbacks.size).toBe(0)
	})

	it('allows a callback to dispose its own subscription', () => {
		const fixture = host()
		const notify = vi.fn(() => off())
		const off = observeReducedMotion(notify)
		fixture.post()
		fixture.post()
		expect(notify).toHaveBeenCalledTimes(1)
		expect(fixture.callbacks.size).toBe(0)
	})

	it('uses the AppKit notification name when the bridge omits its constant', () => {
		const fixture = host()
		vi.stubGlobal('NSWorkspaceAccessibilityDisplayOptionsDidChangeNotification', undefined)
		const off = observeReducedMotion(vi.fn())
		expect(fixture.center.addObserverForNameObjectQueueUsingBlock.mock.calls[0][0]).toBe(
			'NSWorkspaceAccessibilityDisplayOptionsDidChangeNotification',
		)

		off()
	})

	it('stays safe without an AppKit workspace and does not install polling', () => {
		vi.stubGlobal('NSWorkspace', undefined)
		const timer = vi.spyOn(globalThis, 'setInterval')
		try {
			expect(readReducedMotion()).toBe(false)
			const off = observeReducedMotion(vi.fn())
			off()
			off()
			expect(timer).not.toHaveBeenCalled()
		} finally {
			timer.mockRestore()
		}
	})

	it('does not acquire an observer when cleanup is unavailable', () => {
		const fixture = host()
		vi.stubGlobal('NSWorkspace', {
			sharedWorkspace: {
				notificationCenter: {
					addObserverForNameObjectQueueUsingBlock:
						fixture.center.addObserverForNameObjectQueueUsingBlock,
				},
			},
		})

		observeReducedMotion(vi.fn())()
		expect(fixture.center.addObserverForNameObjectQueueUsingBlock).not.toHaveBeenCalled()
	})
})
