import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { environment } from './environment.web'
vi.mock('./host-runtime.web', () => ({
	desktopHostBootstrap: () => null,
	desktopHostClient: () => null,
}))

beforeEach(() => {
	const browser = new EventTarget()
	const page = new EventTarget()
	Object.defineProperty(page, 'visibilityState', { get: () => 'visible', configurable: true })
	const network = Object.defineProperty({}, 'onLine', { get: () => true, configurable: true })
	vi.stubGlobal('window', browser)
	vi.stubGlobal('document', page)
	vi.stubGlobal('navigator', network)
})

afterEach(() => {
	vi.restoreAllMocks()
	vi.unstubAllGlobals()
})

describe('browser service environment', () => {
	it('reads visibility and connectivity, delivers changes, and releases listeners', () => {
		const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
		const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
		const snapshots: unknown[] = []
		const stop = environment.subscribe((snapshot) => snapshots.push(snapshot))
		expect(snapshots.at(-1)).toMatchObject({ online: true, active: true })
		online.mockReturnValue(false)
		window.dispatchEvent(new Event('offline'))
		expect(snapshots.at(-1)).toMatchObject({ online: false })
		visibility.mockReturnValue('hidden')
		document.dispatchEvent(new Event('visibilitychange'))
		expect(snapshots.at(-1)).toMatchObject({ active: false })
		stop()
		const count = snapshots.length
		window.dispatchEvent(new Event('online'))
		document.dispatchEvent(new Event('visibilitychange'))
		expect(snapshots).toHaveLength(count)
	})
	it('reports absent browser capabilities without blocking a server request', () => {
		vi.stubGlobal('navigator', undefined)
		vi.stubGlobal('document', undefined)
		expect(environment.getSnapshot()).toEqual({
			online: undefined,
			active: undefined,
			capabilities: { connectivity: false, activity: false },
		})
		const notify = vi.fn()
		environment.subscribe(notify)()
		expect(notify).toHaveBeenCalledOnce()
	})
})
