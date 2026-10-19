import { expect, it, vi } from 'vitest'
import { chatHost } from './chat-scroll-host.macos'
it('falls back to the native clip when its animator proxy cannot scroll', () => {
	const clip: any = {
		bounds: { origin: { x: 0, y: 0 }, size: { width: 400, height: 300 } },
		animator: () => ({}),
		scrollToPoint: vi.fn(),
	}
	const host = {
		contentView: clip,
		documentView: { frame: { size: { width: 400, height: 1000 } }, isFlipped: false },
		reflectScrolledClipView: vi.fn(),
	}
	chatHost.scroll(host).scrollToVerticalOffset(200, true)
	expect(clip.scrollToPoint).toHaveBeenCalledWith({ x: 0, y: 500 })
})

it('separates unflipped range drift from manual clip movement and releases notification ownership', () => {
	const callbacks = new Set<() => void>()
	vi.stubGlobal('NSNotificationCenter', {
		defaultCenter: {
			addObserverForNameObjectQueueUsingBlock(
				_name: any,
				_view: any,
				_queue: any,
				callback: () => void,
			) {
				callbacks.add(callback)
				return callback
			},
			removeObserver(token: any) {
				callbacks.delete(token)
			},
		},
	})
	const clip: any = {
		bounds: { origin: { x: 0, y: 200 }, size: { width: 400, height: 300 } },
		postsBoundsChangedNotifications: false,
	}
	const host: any = {
		contentView: clip,
		documentView: { frame: { size: { width: 400, height: 1000 } }, isFlipped: false },
	}
	const scroll = chatHost.scroll(host),
		first = vi.fn(),
		second = vi.fn()
	try {
		scroll.on('scroll', first)
		scroll.on('scroll', second)
		expect(clip.postsBoundsChangedNotifications).toBe(true)
		host.documentView.frame.size.height += 100
		callbacks.forEach((cb) => cb())
		expect(first).not.toHaveBeenCalled()
		clip.bounds.origin.y += 20
		callbacks.forEach((cb) => cb())
		expect(first).toHaveBeenCalledTimes(1)
		scroll.off('scroll', first)
		expect(clip.postsBoundsChangedNotifications).toBe(true)
		scroll.off('scroll', second)
		expect(clip.postsBoundsChangedNotifications).toBe(false)
		expect(callbacks.size).toBe(0)
	} finally {
		scroll.off('scroll', first)
		scroll.off('scroll', second)
		vi.unstubAllGlobals()
	}
})
