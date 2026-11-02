interface PendingImage<T> {
	listeners: Set<(image: T | null) => void>
	cancel?: () => void
	state: 'pending' | 'complete' | 'cancelled'
	cacheable: boolean
}

/** Shared, bounded decoded-image requests. Install listeners before starting
 * native work. Invalidating memory keeps current view deliveries alive while
 * retiring cache writes and sharing for subsequent loads. */
export function createImageRequests<T>(
	start: (source: string, complete: (image: T | null) => void) => (() => void) | void,
	limit = 64,
	report: (error: unknown) => void = (error) => console.error('[macos-image] request cleanup/delivery failed', error),
) {
	const cache = new Map<string, T>()
	const pending = new Map<string, PendingImage<T>>()
	const complete = (source: string, request: PendingImage<T>, image: T | null) => {
		if (request.state !== 'pending') {return}
		request.state = 'complete'
		if (pending.get(source) === request) {pending.delete(source)}
		request.cancel = undefined
		if (image !== null && request.cacheable && limit > 0) {
			cache.delete(source)
			cache.set(source, image)
			while (cache.size > limit) {cache.delete(cache.keys().next().value!)}
		}
		const listeners = [...request.listeners]
		request.listeners.clear()
		for (const listener of listeners) {
			try { listener(image) } catch (error) { report(error) }
		}
	}
	const invalidate = (source: string) => {
		cache.delete(source)
		const request = pending.get(source)
		if (request) {
			request.cacheable = false
			pending.delete(source)
		}
	}
	return {
		/** Decoded memory only; neither a disk nor an HTTP-cache probe. */
		isCached(source: string): boolean { return cache.has(source) },
		evict(source: string): void { invalidate(source) },
		clear(): void {
			cache.clear()
			for (const request of pending.values()) {request.cacheable = false}
			pending.clear()
		},
		subscribe(source: string, listener: (image: T | null) => void, onPending?: () => void): () => void {
			if (cache.has(source)) {
				const image = cache.get(source)!
				cache.delete(source)
				cache.set(source, image)
				listener(image)
				return () => {}
			}
			onPending?.()
			let request = pending.get(source)
			const fresh = !request
			if (!request) {
				request = { listeners: new Set(), state: 'pending', cacheable: true }
				pending.set(source, request)
			}
			const load = request
			const deliver = (image: T | null) => listener(image)
			load.listeners.add(deliver)
			if (fresh) {
				try {
					const cancel = start(source, (image) => complete(source, load, image))
					if (typeof cancel === 'function') {
						if (load.state === 'cancelled') {cancel()}
						else if (load.state === 'pending') {load.cancel = cancel}
					}
				} catch {
					complete(source, load, null)
				}
			}
			let active = true
			return () => {
				if (!active) {return}
				active = false
				load.listeners.delete(deliver)
				if (load.state !== 'pending' || load.listeners.size) {return}
				if (pending.get(source) === load) {pending.delete(source)}
				load.state = 'cancelled'
				const cancel = load.cancel
				load.cancel = undefined
				try { cancel?.() } catch (error) { report(error) }
			}
		},
	}
}
