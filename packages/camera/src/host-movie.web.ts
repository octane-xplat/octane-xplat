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
		/** Optional chunked variants — a multi-hundred-MB movie must not
		 *  round-trip through the bridge as one base64 payload. Absent on
		 *  hosts built before the chunked contract; detected per client. */
		writeMovieFileChunk?(options: {
			fileUrl: string
			base64: string
			final?: boolean
		}): Promise<{ file: { name: string; uri: string } | { ok: boolean } | null }>
		readMovieFileChunk?(options: {
			fileUrl: string
			offset: number
			length: number
		}): Promise<{ base64: string | null }>
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

const probeHost = async (): Promise<CameraHost | null> => {
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
}

/** The camera-capable desktop host client, or null outside a qualified host.
 *  Only a confirmed client stays cached — a null result may be a transient
 *  transport or capabilities failure, so the next call probes again rather
 *  than sticking 'absent' for the page lifetime. */
export async function cameraHost(): Promise<CameraHost | null> {
	hostProbe ??= probeHost()
	const host = await hostProbe
	if (!host) {
		hostProbe = probeHost()
		return hostProbe
	}

	return host
}

const error = (kind: 'destinationUnavailable' | 'storageFailed' | 'unavailable', message: string) =>
	new CameraCaptureError({ kind, operation: 'storage', message })

const dataToBase64 = (data: Uint8Array): string => {
	let binary = ''
	const chunk = 0x8000
	for (let offset = 0; offset < data.length; offset += chunk) {
		binary += String.fromCharCode(...data.subarray(offset, offset + chunk))
	}

	return btoa(binary)
}

const blobToBase64 = async (bytes: Blob): Promise<string> =>
	dataToBase64(new Uint8Array(await bytes.arrayBuffer()))

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

/** Bytes bridged per call when the host exposes the chunked movie contract —
 *  large enough to amortize IPC, small enough to keep peak copies bounded. */
const MOVIE_CHUNK_BYTES = 4 * 1024 * 1024

const chunkedSupport = new WeakMap<CameraHost, Promise<boolean>>()

/** A host built before the chunked contract lacks the methods entirely —
 *  the capabilities probe answers that without a probe call. */
const supportsChunkedMovies = (host: CameraHost): Promise<boolean> => {
	let probe = chunkedSupport.get(host)
	if (!probe) {
		probe = host
			.capabilities()
			.then((capabilities) => {
				const methods = (capabilities as { camera?: string[] }).camera ?? []
				return (
					methods.includes('writeMovieFileChunk') &&
					methods.includes('readMovieFileChunk')
				)
			})
			.catch(() => false)

		chunkedSupport.set(host, probe)
	}

	return probe
}

/** Commit finalized movie bytes to host-side app-private storage. Hosts
 *  with the chunked contract stream 4MB slices — a multi-hundred-MB
 *  recording no longer materializes ~3-4x its size across the bridge. */
export const commitHostMovie = async (
	host: CameraHost,
	fileUrl: string,
	bytes: Blob,
): Promise<MovieOutput> => {
	if (await supportsChunkedMovies(host)) {
		for (let offset = 0; ; offset += MOVIE_CHUNK_BYTES) {
			const slice = bytes.slice(offset, offset + MOVIE_CHUNK_BYTES)
			const final = offset + MOVIE_CHUNK_BYTES >= bytes.size
			const { file } = await host.call('camera', 'writeMovieFileChunk', {
				fileUrl,
				base64: dataToBase64(new Uint8Array(await slice.arrayBuffer())),
				final,
			})

			if (final) {
				const committed = file && 'uri' in file ? file : null
				if (!committed?.uri) {
					throw error('storageFailed', 'The host could not write the recorded movie')
				}

				return { kind: 'nativeFile', resourceId: committed.uri, fileUrl: committed.uri }
			}

			if (!file || !('ok' in file) || file.ok !== true) {
				throw error('storageFailed', 'The host could not write a recorded movie chunk')
			}
		}
	}

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

	const size = Number(info.size ?? -1)
	if (size > 0 && (await supportsChunkedMovies(host))) {
		const data = new Uint8Array(size)
		for (let offset = 0; offset < size; offset += MOVIE_CHUNK_BYTES) {
			const { base64: chunk } = await host.call('camera', 'readMovieFileChunk', {
				fileUrl: output.fileUrl,
				offset,
				length: Math.min(MOVIE_CHUNK_BYTES, size - offset),
			})

			if (chunk == null) {
				throw error('unavailable', `Movie file could not be read at ${output.fileUrl}`)
			}

			let decoded: string
			try {
				decoded = atob(chunk)
			} catch {
				throw error('unavailable', 'The host returned invalid movie bytes')
			}

			if (decoded.length !== Math.min(MOVIE_CHUNK_BYTES, size - offset)) {
				throw error('unavailable', 'The stored movie changed or could not be read completely')
			}

			for (let index = 0; index < decoded.length; index += 1) {
				data[offset + index] = decoded.charCodeAt(index)
			}
		}

		const url = URL.createObjectURL(new Blob([data], { type: mimeForFileUrl(output.fileUrl) }))
		return {
			url,
			fileUrl: output.fileUrl,
			release: () => URL.revokeObjectURL(url),
		}
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
