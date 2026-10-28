/** Recording Foundation objects only. No disk, network or AppKit work occurs. */
export function imageCacheFixture(disk = new Map<string, any>()) {
	const queue: (() => void)[] = [], tasks: any[] = [], configurations: any[] = [], stores: any[] = []
	let failStart = false, failResume = false, writable = true, readable = true, directory = true
	const cache = {
		cachedResponseForRequest(request: any) { if (!readable) throw Error('cache unavailable'); return disk.get(request.URL) },
		storeCachedResponseForRequest(entry: any, request: any) { if (writable) { stores.push(entry); disk.set(request.URL, entry) } },
		removeCachedResponseForRequest(request: any) { if (!writable) throw Error('cache unavailable'); disk.delete(request.URL) },
		removeAllCachedResponses() { if (!writable) throw Error('cache unavailable'); disk.clear() },
	}
	const url = (path: string): any => ({ path, URLByAppendingPathComponentIsDirectory: (child: string) => url(path + '/' + child) })
	const native: any = {
		NSBundle: { mainBundle: { bundleIdentifier: 'test.image-cache' } },
		NSFileManager: { defaultManager: {
			URLForDirectoryInDomainAppropriateForURLCreateError: () => url('/cache'),
			createDirectoryAtURLWithIntermediateDirectoriesAttributesError: () => directory,
		} },
		NSURL: { URLWithString: (source: string) => source.endsWith('/invalid') ? null : source },
		NSURLRequest: { requestWithURLCachePolicyTimeoutInterval: (URL: string, cachePolicy: number, timeoutInterval: number) => ({ URL, cachePolicy, timeoutInterval }) },
		NSURLCache: { alloc: () => ({ initWithMemoryCapacityDiskCapacityDirectoryURL(memory: number, capacity: number, directory: any) { configurations.push({ memory, capacity, path: directory.path }); return cache } }) },
		NSCachedURLResponse: { alloc: () => ({ initWithResponseDataUserInfoStoragePolicy: (response: any, data: any, _: unknown, storagePolicy: number) => ({ response, data, storagePolicy }) }) },
		NSURLSessionConfiguration: { get ephemeralSessionConfiguration() { return {} } },
		NSOperationQueue: { mainQueue: { addOperationWithBlock: (block: () => void) => queue.push(block) } },
		NSURLSession: { sessionWithConfiguration(configuration: any) {
			configurations.push(configuration)
			return { dataTaskWithRequestCompletionHandler(request: any, handler: any) {
				if (failStart) throw Error('setup failed')
				const task = { request, handler, cancelled: 0,
					resume() { if (failResume) throw Error('resume failed') }, cancel() { this.cancelled++ },
				}
				tasks.push(task); return task
			} }
		} },
	}
	return { native, disk, cache, tasks, configurations, stores,
		start: async () => { await new Promise((resolve) => setTimeout(resolve, 0)) },
		flush: () => { while (queue.length) queue.shift()!() },
		failStart: (value: boolean) => { failStart = value }, failResume: (value: boolean) => { failResume = value },
		writable: (value: boolean) => { writable = value }, readable: (value: boolean) => { readable = value }, directory: (value: boolean) => { directory = value },
	}
}
