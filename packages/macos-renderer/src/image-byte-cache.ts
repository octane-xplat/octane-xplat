import { createImageRequests } from './image-requests.ts'

interface ImageBytes { data: any; stored: boolean; source: 'network' | 'disk' }
/** Image-owned encoded bytes. URLCache has zero memory capacity; decoded
 * bitmaps remain owned by image-requests. No shared URL cache is modified. */
export function createImageByteCache(native: () => Record<string, any>) {
	let storage: any, session: any
	let epoch: object = {}, versions = new Map<string, object>()
	const version = (source: string) => {
		let value = versions.get(source)
		if (!value) { value = {}; versions.set(source, value) }
		return value
	}
	const requestFor = (source: string) => {
		if (!/^https?:\/\//i.test(source)) return null
		const host = native(), url = host.NSURL?.URLWithString(source)
		return url ? host.NSURLRequest?.requestWithURLCachePolicyTimeoutInterval(url, 1, 60) : null
	}
	const ensureSession = () => {
		const host = native()
		if (!session) {
			const configuration = host.NSURLSessionConfiguration?.ephemeralSessionConfiguration
			if (!configuration || !host.NSOperationQueue?.mainQueue?.addOperationWithBlock) return false
			configuration.URLCache = null; configuration.HTTPCookieStorage = null
			configuration.URLCredentialStorage = null; configuration.HTTPShouldSetCookies = false
			configuration.requestCachePolicy = 1
			session = host.NSURLSession?.sessionWithConfiguration(configuration)
			if (!session) return false
		}
		return true
	}
	const initialize = () => {
		if (!ensureSession()) return false
		const host = native()
		if (storage) return true
		try {
			const manager = host.NSFileManager?.defaultManager
			// NSSearchPathDirectory.Caches (13), user domain (1).
			const base = manager?.URLForDirectoryInDomainAppropriateForURLCreateError(13, 1, null, true, null)
			const identifier = host.NSBundle?.mainBundle?.bundleIdentifier
			if (!base || typeof identifier !== 'string' || !/^[a-z\d][a-z\d._-]*$/i.test(identifier)) return false
			const directory = base.URLByAppendingPathComponentIsDirectory('octane-xplat-images-v1', true)
				?.URLByAppendingPathComponentIsDirectory(identifier, true)
			if (!directory || !manager.createDirectoryAtURLWithIntermediateDirectoriesAttributesError(directory, true, null, null)) return false
			storage = host.NSURLCache?.alloc().initWithMemoryCapacityDiskCapacityDirectoryURL(0, 64 * 1024 * 1024, directory)
		} catch { return false }
		return !!storage
	}
	const cached = (request: any): ImageBytes | null => {
		const response = storage?.cachedResponseForRequest(request)
		return response?.data && Number(response.storagePolicy) === 0 ? { data: response.data, stored: true, source: 'disk' } : null
	}
	const canStore = (response: any) => {
		const headers = response?.allHeaderFields
		const read = (name: string): string => {
			const keys: any = headers?.allKeys
			if (keys?.count != null) {
				for (let index = 0; index < Number(keys.count); index++) {
					const key = keys.objectAtIndex(index)
					if (String(key).toLowerCase() === name) return String(headers.objectForKey(key) ?? '')
				}
			}
			for (const key of Object.keys(headers ?? {})) if (key.toLowerCase() === name) return String(headers[key] ?? '')
			return ''
		}
		// URL-only identity cannot safely persist Vary/protected responses. A
		// later header-aware engine must give them separate cache identities.
		return !/(?:^|,)\s*(?:no-store|no-cache|private)(?:\s|,|=|$)/i.test(read('cache-control')) && !read('vary') && !read('set-cookie')
	}
	const load = (source: string, complete: (result: ImageBytes | null) => void, cacheAllowed: boolean) => {
		const request = requestFor(source)
		if (!request) { complete(null); return }
		const ownedEpoch = epoch, ownedVersion = cacheAllowed ? version(source) : undefined
		const current = () => cacheAllowed && epoch === ownedEpoch && versions.get(source) === ownedVersion
		const settle = (result: ImageBytes | null) => {
			if (cacheAllowed && versions.get(source) === ownedVersion) versions.delete(source)
			complete(result)
		}
		const host = native(), queue = host.NSOperationQueue?.mainQueue
		if (!queue?.addOperationWithBlock) { settle(null); return }
		let active = true, task: any, timer: ReturnType<typeof setTimeout> | undefined
		timer = setTimeout(() => {
			timer = undefined
			if (!active) return
			try {
				if (cacheAllowed) initialize(); else ensureSession()
				if (!session) { settle(null); return }
				let hit: ImageBytes | null = null
				try { if (cacheAllowed) hit = cached(request) } catch {}
				if (hit) { settle({ ...hit, stored: current() }); return }
				task = session.dataTaskWithRequestCompletionHandler(request, (data: any, response: any, error: any) => {
					if (!active) return
					const deliver = () => {
						if (!active) return
						const status = Number(response?.statusCode ?? 0)
						if (!data || error || status < 200 || status >= 300) { settle(null); return }
						let stored = false
						if (current() && storage) {
							try {
								if (canStore(response)) {
									const entry = host.NSCachedURLResponse.alloc().initWithResponseDataUserInfoStoragePolicy(response, data, null, 0)
									storage.storeCachedResponseForRequest(entry, request)
									const saved = cached(request)
									stored = !!saved && (saved.data === data || saved.data.isEqualToData?.(data) === true)
								}
							} catch { /* Display may continue when disk storage fails. */ }
						}
						settle({ data, stored, source: 'network' })
					}
					try { queue.addOperationWithBlock(deliver) } catch {
						timer = setTimeout(() => { timer = undefined; if (active) settle(null) }, 0)
					}
				})
				task.resume()
			} catch { active = false; try { task?.cancel() } catch {}; settle(null) }
		}, 0)
		return () => { active = false; if (cacheAllowed && versions.get(source) === ownedVersion) versions.delete(source); if (timer !== undefined) clearTimeout(timer); task?.cancel() }
	}
	const requests = createImageRequests<ImageBytes>((source, complete) => load(source, complete, true), 0)
	const bypass = createImageRequests<ImageBytes>((source, complete) => load(source, complete, false), 0)
	return {
		initialize,
		subscribe(source: string, listener: (result: ImageBytes | null) => void, policy: 'memory-disk' | 'none' = 'memory-disk') {
			return (policy === 'none' ? bypass : requests).subscribe(source, listener)
		},
		prefetch(source: string): Promise<boolean> {
			return new Promise((resolve) => { requests.subscribe(source, (result) => resolve(result?.stored === true)) })
		},
		isCached(source: string): boolean {
			const request = requestFor(source)
			return !!request && initialize() && !!cached(request)
		},
		evict(source: string): boolean {
			versions.delete(source); requests.evict(source)
			const request = requestFor(source)
			if (!request) return !/^https?:\/\//i.test(source)
			if (!initialize()) return false
			storage.removeCachedResponseForRequest(request)
			return !cached(request)
		},
		clear(): boolean {
			epoch = {}; versions = new Map(); requests.clear()
			if (!initialize()) return false
			storage.removeAllCachedResponses()
			return true
		},
	}
}
