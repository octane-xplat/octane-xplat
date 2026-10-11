import { afterEach, describe, expect, it, vi } from 'vitest'

// The platform host channel is mocked so the probe's cache semantics run
// against controllable transport/capability outcomes.
const platform = vi.hoisted(() => ({
	transport: true,
	clients: [] as { capabilities: ReturnType<typeof vi.fn>; dispose: ReturnType<typeof vi.fn> }[],
	nextCapabilities: [] as unknown[],
}))

vi.mock('@octane-xplat/platform/host', () => ({
	createHostClient: () => {
		const client = {
			capabilities: vi.fn(async () => platform.nextCapabilities.shift() ?? null),
			dispose: vi.fn(),
		}

		platform.clients.push(client)
		return client
	},
}))

vi.mock('@octane-xplat/platform/host/web', () => ({
	createWebKitTransport: () => (platform.transport ? {} : null),
}))

// The module caches its probe at module scope — each test loads a fresh
// copy so cached outcomes cannot leak across cases.
const loadCameraHost = async () => {
	vi.resetModules()
	return (await import('../src/host-movie.web')).cameraHost
}

const fullService = {
	camera: [
		'permissionStatus',
		'requestPermission',
		'movieDirectory',
		'reserveMoviePath',
		'writeMovieFile',
		'movieFileInfo',
		'readMovieFile',
		'deleteMovieFile',
	],
}

afterEach(() => {
	platform.clients = []
	platform.nextCapabilities = []
	platform.transport = true
	vi.clearAllMocks()
})

describe('desktop host probe', () => {
	it('re-probes on the next call when the transport is absent', async () => {
		const cameraHost = await loadCameraHost()
		platform.transport = false
		expect(await cameraHost()).toBeNull()
		platform.transport = true
		platform.nextCapabilities = [fullService]
		expect(await cameraHost()).not.toBeNull()
	})

	it('a failed probe does not stick — later calls retry until confirmed', async () => {
		const cameraHost = await loadCameraHost()
		platform.transport = true
		// Probe: capabilities RPC fails → null; the same call already
		// re-probes and confirms a client.
		platform.nextCapabilities = [null, fullService]
		const host = await cameraHost()
		expect(host).not.toBeNull()
		expect(platform.clients).toHaveLength(2)
		expect(platform.clients[0].dispose).toHaveBeenCalled()

		// The confirmed client stays cached — no further probe attempts.
		expect(await cameraHost()).toBe(host)
		expect(platform.clients).toHaveLength(2)
	})
})
