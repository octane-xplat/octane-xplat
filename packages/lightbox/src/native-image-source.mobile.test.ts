import { expect, it, vi } from 'vitest'
import { observeNativeImage } from './native-image-source'
it('learns dimensions from the loaded host, ignores stale sources and releases listeners', () => {
	const listeners = new Map<string, Set<() => void>>()
	const host = {
		src: 'portrait.jpg', isLoading: true, imageSource: undefined as { width: number; height: number } | undefined,
		on(event: string, cb: () => void) { const callbacks = listeners.get(event) ?? new Set(); callbacks.add(cb); listeners.set(event, callbacks) },
		off(event: string, cb: () => void) { listeners.get(event)?.delete(cb) },
	}
	const emit = (event: string) => { for (const cb of listeners.get(event) ?? []) cb() }
	const changed = vi.fn()
	const off = observeNativeImage(host, host.src, changed)
	expect(changed).not.toHaveBeenCalled()
	host.imageSource = { width: 600, height: 1200 }; host.isLoading = false
	emit('isLoadingChange')
	expect(changed).toHaveBeenLastCalledWith({ width: 600, height: 1200, failed: false })
	host.src = 'landscape.jpg'; host.imageSource = { width: 1200, height: 600 }
	emit('imageSourceChange')
	expect(changed).toHaveBeenCalledTimes(1)
	off()
	expect([...listeners.values()].every(callbacks => callbacks.size === 0)).toBe(true)
	const next = vi.fn()
	const detach = observeNativeImage(host, host.src, next)
	expect(next).toHaveBeenCalledWith({ width: 1200, height: 600, failed: false })
	detach()
})
it('reports a completed failed decode without inventing image dimensions', () => {
	const callbacks = new Set<() => void>()
	const host = { src: 'broken.jpg', isLoading: false, imageSource: undefined,
		on(_event: string, cb: () => void) { callbacks.add(cb) }, off(_event: string, cb: () => void) { callbacks.delete(cb) } }
	const changed = vi.fn()
	const off = observeNativeImage(host, host.src, changed)
	expect(changed).not.toHaveBeenCalled()
	host.isLoading = true; for (const cb of callbacks) cb()
	host.isLoading = false; for (const cb of callbacks) cb()
	expect(changed).toHaveBeenCalledExactlyOnceWith({ width: 0, height: 0, failed: true })
	off()
})
