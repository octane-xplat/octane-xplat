import { createHostClient } from '@octane-xplat/platform/host'
import { createWebKitTransport } from '@octane-xplat/platform/host/web'
import { createCameraSession } from '@octane-xplat/camera'
import type {
	CameraProofEvents,
	CameraProofResult,
	CameraProofServices,
} from '../src/webview-camera-proof-contracts'

import type { HostClient } from '@octane-xplat/platform/host'

const output = document.querySelector<HTMLPreElement>('#result')!

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) {
		throw new Error(message)
	}
}

interface CameraServiceClient {
	call(service: 'camera', method: string, options?: object): Promise<any>
	call(service: 'application', method: 'report', result: CameraProofResult): Promise<boolean>
}

async function runProof(client: HostClient<CameraProofServices, CameraProofEvents>) {
	const host = client as unknown as CameraServiceClient
	const capabilities = await client.capabilities()
	const required = [
		'permissionStatus',
		'requestPermission',
		'movieDirectory',
		'reserveMoviePath',
		'writeMovieFile',
		'movieFileInfo',
		'readMovieFile',
		'deleteMovieFile',
	] as const

	for (const method of required) {
		assert(capabilities.camera?.includes(method), `host did not report camera.${method}`)
	}

	const mediaPermission = (await host.call('camera', 'permissionStatus', { kind: 'camera' })).status

	const microphonePermission = (
		await host.call('camera', 'permissionStatus', { kind: 'microphone' })
	).status

	assert(mediaPermission !== 'undeclared', 'camera usage description missing from bundle')
	assert(
		(await host.call('camera', 'requestPermission', { kind: 'camera' })).status === 'granted',
		'camera permission request did not return granted',
	)

	// Durable app-private storage: reserve → commit → inspect → reopen →
	// reject outside-root → delete → confirm gone. Works without camera
	// hardware because it exercises the storage service directly.
	const { fileUrl: directory } = await host.call('camera', 'movieDirectory')
	assert(
		typeof directory === 'string' && directory.startsWith('file://'),
		'movieDirectory did not return a file URL',
	)

	const { reservation } = await host.call('camera', 'reserveMoviePath', {
		container: 'mp4',
	})

	assert(
		reservation?.fileUrl?.startsWith(directory),
		`reservation escaped the app-private recordings directory: ${JSON.stringify(reservation)} vs ${directory}`,
	)

	const payload = btoa('xplat-camera-proof')
	const { file } = await host.call('camera', 'writeMovieFile', {
		fileUrl: reservation.fileUrl,
		base64: payload,
	})

	assert(file?.uri === reservation.fileUrl, 'committed movie URI mismatch')
	const { info } = await host.call('camera', 'movieFileInfo', {
		fileUrl: reservation.fileUrl,
	})

	assert(info?.exists === true && Number(info.size) > 0, 'committed movie is missing')
	const { base64 } = await host.call('camera', 'readMovieFile', {
		fileUrl: reservation.fileUrl,
	})

	assert(base64 === payload, 'movie bytes did not round-trip')
	const { reservation: outside } = await host.call('camera', 'reserveMoviePath', {
		fileUrl: 'file:///tmp/octane-camera-outside.mp4',
	})

	assert(!outside, 'destination outside the app-private root was accepted')
	const { removed } = await host.call('camera', 'deleteMovieFile', {
		fileUrl: reservation.fileUrl,
	})

	assert(removed === true, 'movie delete failed')
	const { info: gone } = await host.call('camera', 'movieFileInfo', {
		fileUrl: reservation.fileUrl,
	})

	assert(gone?.exists === false, 'movie survived deleteMovieFile')

	// The shared session backend must pick the host storage/permission seam
	// over browser storage inside this webview.
	const session = createCameraSession()
	const permissions = await session.permissions()
	const sessionCapabilities = await session.capabilities()
	assert(
		sessionCapabilities.output.storage === 'appPrivateFile',
		'session did not switch to host app-private storage',
	)

	assert(
		sessionCapabilities.output.destinationFileUrl === true,
		'session did not advertise app-supplied destinations',
	)

	await session.dispose()

	const result: CameraProofResult = {
		ok: true,
		cameraService: true,
		mediaPermission,
		microphonePermission,
		storageRoundTrip: true,
		sessionStorageKind: sessionCapabilities.output.storage,
		sessionCameras: sessionCapabilities.cameras.length,
	}

	output.textContent = JSON.stringify(
		{ ...result, permissions, capabilities: sessionCapabilities },
		null,
		2,
	)

	await host.call('application', 'report', result)
	client.dispose()
}

const transport = createWebKitTransport()
if (!transport) {
	output.textContent = 'This camera proof page is open outside its WKWebView host.'
} else {
	const client = createHostClient<CameraProofServices, CameraProofEvents>(transport)
	window.addEventListener('pagehide', () => client.dispose(), { once: true })
	void runProof(client).catch(async (error: unknown) => {
		const result: CameraProofResult = {
			ok: false,
			cameraService: false,
			mediaPermission: '',
			microphonePermission: '',
			storageRoundTrip: false,
			sessionStorageKind: '',
			sessionCameras: -1,
			error: error instanceof Error ? error.message : String(error),
		}

		output.textContent = JSON.stringify(result, null, 2)
		try {
			await client.call('application', 'report', result as never)
		} catch {
			console.error('[camera-proof] host report failed', result.error)
		}

		client.dispose()
	})
}
