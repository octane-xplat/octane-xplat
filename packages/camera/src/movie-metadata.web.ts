import { BlobSource, Input, MP4, WEBM } from 'mediabunny'
import { CameraCaptureError } from './types'

/** Read packet end timestamps and track metadata, never the wall-clock stop time. */
export async function inspectMovie(bytes: Blob, audioRequested: boolean) {
	if (!bytes.size) {
		throw new CameraCaptureError({
			kind: 'noMedia',
			operation: 'finalize',
			message: 'The recorder produced no movie bytes',
		})
	}

	const input = new Input({ source: new BlobSource(bytes), formats: [WEBM, MP4] })
	const read = async () => {
		const video = await input.getPrimaryVideoTrack()
		const audio = await input.getPrimaryAudioTrack()
		if (!video) {
			throw new CameraCaptureError({
				kind: 'noMedia',
				operation: 'finalize',
				message: 'The movie contains no video track',
			})
		}

		const videoDuration = await video.computeDuration()
		const hasAudio = audio !== null && (await audio.computeDuration()) > 0
		const durationMs = (await input.computeDuration()) * 1000
		const width = await video.getDisplayWidth()
		const height = await video.getDisplayHeight()
		if (
			!Number.isFinite(durationMs) ||
			durationMs <= 0 ||
			videoDuration <= 0 ||
			width <= 0 ||
			height <= 0
		) {
			throw new CameraCaptureError({
				kind: 'noMedia',
				operation: 'finalize',
				message: 'The movie has no usable video media',
			})
		}

		if (audioRequested && !hasAudio) {
			throw new CameraCaptureError({
				kind: 'captureFailed',
				operation: 'finalize',
				message: 'Requested audio is absent from the finalized movie',
			})
		}

		return {
			durationMs,
			width,
			height,
			hasAudio,
			mimeType: await input.getMimeType(),
			orientation: 'unspecified' as const,
		}
	}

	let timer: ReturnType<typeof setTimeout> | undefined
	try {
		return await Promise.race([
			read(),
			new Promise<never>((_resolve, reject) => {
				timer = setTimeout(() => {
					input.dispose()
					reject(
						new CameraCaptureError({
							kind: 'finalizationFailed',
							operation: 'metadata',
							message: 'Movie metadata verification timed out',
						}),
					)
				}, 30_000)
			}),
		])
	} finally {
		clearTimeout(timer)
		input.dispose()
	}
}
