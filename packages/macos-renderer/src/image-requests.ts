interface PendingImage<T> {
	listeners: Set<(image: T | null) => void>
	cancel?: () => void
	cancelled: boolean
}

/** Shared, bounded decoded-image requests. Install listeners before starting
 * native work; identity guards keep cancelled completions out of newer loads. */
export function createImageRequests<T>(
	start: (source: string, complete: (image: T | null) => void) => (() => void) | void,
	limit = 64,
	report: (error: unknown) => void = (error) => console.error('[macos-image] request cleanup/delivery failed', error),
) {
	const cache = new Map<string, T>()
	const pending = new Map<string, PendingImage<T>>()
	const complete = (source: string, request: PendingImage<T>, image: T | null) => {
		if (pending.get(source) !== request) return
		pending.delete(source)
		request.cancel = undefined
		if (image !== null && limit > 0) {
			cache.delete(source)
			cache.set(source, image)
			while (cache.size > limit) cache.delete(cache.keys().next().value!)
		}
		const listeners = [...request.listeners]
		request.listeners.clear()
		for (const listener of listeners) {
			try { listener(image) } catch (error) { report(error) }
		}
	}
	return {
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
				request = { listeners: new Set(), cancelled: false }
				pending.set(source, request)
			}
			const load = request
			const deliver = (image: T | null) => listener(image)
			load.listeners.add(deliver)
			if (fresh) {
				try {
					const cancel = start(source, (image) => complete(source, load, image))
					if (typeof cancel === 'function') {
						if (load.cancelled) cancel()
						else if (pending.get(source) === load) load.cancel = cancel
					}
				} catch {
					complete(source, load, null)
				}
			}
			let active = true
			return () => {
				if (!active) return
				active = false
				load.listeners.delete(deliver)
				if (pending.get(source) !== load || load.listeners.size) return
				pending.delete(source)
				load.cancelled = true
				const cancel = load.cancel
				load.cancel = undefined
				try { cancel?.() } catch (error) { report(error) }
			}
		},
	}
}
