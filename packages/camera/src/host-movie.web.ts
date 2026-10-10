import { createHostClient, type HostClient } from '@octane-xplat/platform/host'
import { createWebKitTransport } from '@octane-xplat/platform/host/web'
import { CameraCaptureError } from './types'
import type { MovieOutput, MovieOutputHandle } from './types'

// Inside a desktop native webview the typed host channel may expose a
// `camera` service: truthful macOS privacy status plus app-private durable
// file storage. Outside a host — or when the service is absent — every probe
// resolves absent and the adapter keeps its browser storage behavior.

export interface CameraHostServices {
	camera: {
		permissionStatus(options: { kind: string }): Promise<{ status: string }>
		requestPermission(options: { kind: string }): Promise<{ status: string }>
		movieDirectory(): Promise<{ fileUrl: string | null }>
		reserveMoviePath(options: {
			fileUrl?: string
			container?: string
		}): Promise<{ reservation: { fileUrl: string } | null }>
		writeMovieFile(options: {
			fileUrl: string
			base64: string
		}): Promise<{ file: { name: string; uri: string } | null }>
		movieFileInfo(options: {
			fileUrl: string
		}): Promise<{ info: { exists: boolean; fileUrl?: string; size?: number } | null }>
		readMovieFile(options: { fileUrl: string }): Promise<{ base64: string | null }>
		deleteMovieFile(options: { fileUrl: string }): Promise<{ removed: boolean }>
	}
}

const requiredMethods = [
	'permissionStatus',
	'requestPermission',
	'movieDirectory',
	'reserveMoviePath',
	'writeMovieFile',
	'movieFileInfo',
	'readMovieFile',
	'deleteMovieFile',
]

export type CameraHost = HostClient<CameraHostServices>

let hostProbe: Promise<CameraHost | null> | undefined

/** The camera-capable desktop host client, or null outside a qualified host. */
export function cameraHost(): Promise<CameraHost | null> {
	hostProbe ??= (async () => {
		try {
			const transport = createWebKitTransport()
			if (!transport) {
				return null
			}

			const client = createHostClient<CameraHostServices>(transport)
			const capabilities = (await client.capabilities().catch(() => null)) as {
				camera?: string[]
			} | null

			const methods = capabilities?.camera
			if (Array.isArray(methods) && requiredMethods.every((name) => methods.includes(name))) {
				return client
			}

			client.dispose()
			return null
		} catch {
			return null
		}
	})()

	return hostProbe
}

const error = (kind: 'destinationUnavailable' | 'storageFailed' | 'unavailable', message: string) =>
	new CameraCaptureError({ kind, operation: 'storage', message })

const blobToBase64 = async (bytes: Blob): Promise<string> => {
	const data = new Uint8Array(await bytes.arrayBuffer())
	let binary = ''
	const chunk = 0x8000
	for (let offset = 0; offset < data.length; offset += chunk) {
		binary += String.fromCharCode(...data.subarray(offset, offset + chunk))
	}

	return btoa(binary)
}

const base64ToBlob = (base64: string, type: string): Blob => {
	const binary = atob(base64)
	const data = new Uint8Array(binary.length)
	for (let index = 0; index < binary.length; index++) {
		data[index] = binary.charCodeAt(index)
	}

	return new Blob([data], { type })
}

const mimeForFileUrl = (fileUrl: string): string =>
	fileUrl.endsWith('.webm')
		? 'video/webm'
		: fileUrl.endsWith('.mov')
			? 'video/quicktime'
			: 'video/mp4'

/** Reserve a host-side movie file. `destinationFileUrl` is validated
 *  host-side: it must be a new file inside the app-private storage root. */
export const reserveHostMovie = async (
	host: CameraHost,
	options: { destinationFileUrl?: string; container?: string },
): Promise<{ fileUrl: string }> => {
	const { reservation } = await host.call('camera', 'reserveMoviePath', {
		fileUrl: options.destinationFileUrl,
		container: options.container,
	})

	if (!reservation?.fileUrl) {
		throw error(
			'destinationUnavailable',
			options.destinationFileUrl
				? 'destinationFileUrl must be a new file inside the app-private recordings directory'
				: 'The host could not allocate a movie recording file',
		)
	}

	return reservation
}

/** Commit finalized movie bytes to host-side app-private storage. */
export const commitHostMovie = async (
	host: CameraHost,
	fileUrl: string,
	bytes: Blob,
): Promise<MovieOutput> => {
	const base64 = await blobToBase64(bytes)
	const { file } = await host.call('camera', 'writeMovieFile', { fileUrl, base64 })
	if (!file?.uri) {
		throw error('storageFailed', 'The host could not write the recorded movie')
	}

	return { kind: 'nativeFile', resourceId: file.uri, fileUrl: file.uri }
}

/** Drop an uncommitted host reservation after a failed attempt. */
export const removeHostReservation = async (host: CameraHost, fileUrl: string): Promise<void> => {
	await host.call('camera', 'deleteMovieFile', { fileUrl }).catch(() => {})
}

/** Reopen a host-stored movie as a temporary playback URL. The durable
 *  reference remains `fileUrl`; the returned url lives until `release()`. */
export const openHostMovie = async (
	host: CameraHost,
	output: MovieOutput,
): Promise<MovieOutputHandle> => {
	if (output.kind !== 'nativeFile' || !output.fileUrl) {
		throw new CameraCaptureError({
			kind: 'invalidArgument',
			operation: 'openOutput',
			message: 'Only file-backed output can be opened through the desktop host',
		})
	}

	const { info } = await host.call('camera', 'movieFileInfo', { fileUrl: output.fileUrl })
	if (!info?.exists) {
		throw error('unavailable', `Movie file is missing at ${output.fileUrl}`)
	}

	const { base64 } = await host.call('camera', 'readMovieFile', { fileUrl: output.fileUrl })
	if (!base64) {
		throw error('unavailable', `Movie file could not be read at ${output.fileUrl}`)
	}

	const url = URL.createObjectURL(base64ToBlob(base64, mimeForFileUrl(output.fileUrl)))
	return {
		url,
		fileUrl: output.fileUrl,
		release: () => URL.revokeObjectURL(url),
	}
}
