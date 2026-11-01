import { afterEach, expect, it, vi } from 'vitest'

interface HostOptions {
	att?: boolean
	adSupport?: boolean
	mainThread?: boolean
	extension?: boolean
	purpose?: string
	applicationState?: number
	status?: number
	completion?: 'auto' | 'manual' | 'never'
	enabled?: boolean
	identifier?: string
}

const uuid = 'A1B2C3D4-1234-4A5B-9C8D-7E6F5A4B3C2D'
let pendingCompletion: ((status: number) => void) | undefined

function stubHost(options: HostOptions = {}) {
	const {
		att = true,
		adSupport = true,
		mainThread = true,
		extension = false,
		applicationState = 0,
		status = 0,
		completion = 'auto',
		enabled = true,
		identifier = uuid,
	} = options
	const purpose = 'purpose' in options ? options.purpose : 'Fixture tracking purpose'
	pendingCompletion = undefined
	vi.stubGlobal('NSBundle', {
		bundleWithPath: (path: string) => {
			const present = path.includes('AppTrackingTransparency') ? att : adSupport
			return present ? { load: () => true } : null
		},
		mainBundle: {
			bundlePath: extension ? '/Applications/Fixture.appex' : '/Applications/Fixture.app',
			objectForInfoDictionaryKey: (key: string) =>
				key === 'NSUserTrackingUsageDescription' ? purpose : undefined,
		},
	})
	vi.stubGlobal('NSThread', { isMainThread: mainThread })
	vi.stubGlobal('UIApplication', { sharedApplication: { applicationState } })
	vi.stubGlobal(
		'ATTrackingManager',
		att
			? {
					trackingAuthorizationStatus: status,
					requestTrackingAuthorizationWithCompletionHandler: (done: (status: number) => void) => {
						if (completion === 'auto') {
							done(status)
						} else if (completion === 'manual') {
							pendingCompletion = done
						}
					},
				}
			: undefined,
	)
	vi.stubGlobal('ASIdentifierManager', {
		sharedManager: () => ({
			advertisingTrackingEnabled: enabled,
			advertisingIdentifier: { UUIDString: identifier },
		}),
	})
	vi.stubGlobal('NSOperationQueue', {
		mainQueue: { addOperationWithBlock: (block: () => void) => block() },
	})
}

afterEach(() => {
	vi.unstubAllGlobals()
	vi.resetModules()
})

it('reports a host without ATT as an unavailable no-gate platform', async () => {
	stubHost({ att: false })
	const { backend } = await import('../src/backend.ios')
	expect(backend.capabilities()).toEqual({
		prompt: false,
		advertisingId: true,
		advertisingIdAsync: true,
	})
	expect(backend.read()).toBe(-1)
	await expect(backend.request()).resolves.toBe(-1)
})

it('keeps the legacy advertising identifier path on hosts without ATT', async () => {
	stubHost({ att: false })
	const { backend } = await import('../src/backend.ios')
	expect(backend.advertisingId()).toBe(uuid)
	stubHost({ att: false, enabled: false })
	vi.resetModules()
	const legacy = await import('../src/backend.ios')
	expect(legacy.backend.advertisingId()).toBe(null)
})

it('rejects requests that fail native guards before prompting', async () => {
	stubHost({ purpose: undefined as unknown as string })
	let { backend } = await import('../src/backend.ios')
	await expect(backend.request()).rejects.toThrow('NSUserTrackingUsageDescription')

	stubHost({ applicationState: 2 })
	vi.resetModules()
	;({ backend } = await import('../src/backend.ios'))
	await expect(backend.request()).rejects.toThrow('active foreground app action')

	stubHost({ mainThread: false })
	vi.resetModules()
	;({ backend } = await import('../src/backend.ios'))
	await expect(backend.request()).rejects.toThrow('main thread')

	stubHost({ extension: true })
	vi.resetModules()
	;({ backend } = await import('../src/backend.ios'))
	await expect(backend.request()).rejects.toThrow('app extensions')
})

it('short-circuits a determined status and serializes a single pending request', async () => {
	stubHost({ status: 2 })
	let { backend } = await import('../src/backend.ios')
	await expect(backend.request()).resolves.toBe(2)

	stubHost({ status: 0, completion: 'manual' })
	vi.resetModules()
	;({ backend } = await import('../src/backend.ios'))
	const first = backend.request()
	await expect(backend.request()).rejects.toThrow('already pending')
	pendingCompletion?.(3)
	await expect(first).resolves.toBe(3)
	const second = backend.request()
	pendingCompletion?.(2)
	await expect(second).resolves.toBe(2)
})

it('normalizes advertising identifiers behind the authorization gate', async () => {
	stubHost({ status: 3 })
	const { backend } = await import('../src/backend.ios')
	expect(backend.advertisingId()).toBe(uuid)
	await expect(backend.advertisingIdAsync()).resolves.toBe(uuid)

	stubHost({ status: 2 })
	vi.resetModules()
	const denied = await import('../src/backend.ios')
	expect(denied.backend.advertisingId()).toBe(null)

	stubHost({ status: 3, identifier: '00000000-0000-0000-0000-000000000000' })
	vi.resetModules()
	const zero = await import('../src/backend.ios')
	expect(zero.backend.advertisingId()).toBe(null)
})
