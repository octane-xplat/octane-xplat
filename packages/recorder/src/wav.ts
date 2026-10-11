// RIFF/WAVE framing for 16-bit little-endian PCM. Shared by the web encoder
// and the Android file writer so every target emits the same byte layout.
const ascii = (view: DataView, at: number, text: string) => {
	for (let i = 0; i < text.length; i++) {
		view.setUint8(at + i, text.charCodeAt(i))
	}
}

/** The 44-byte canonical WAV header for 16-bit PCM. `dataLength` is the
 *  number of PCM bytes that follow. */
export function wavHeader(dataLength: number, sampleRate: number, channels: number): Uint8Array {
	const bytes = new Uint8Array(44)
	const view = new DataView(bytes.buffer)
	ascii(view, 0, 'RIFF')
	view.setUint32(4, 36 + dataLength, true)
	ascii(view, 8, 'WAVE')
	ascii(view, 12, 'fmt ')
	view.setUint32(16, 16, true)
	view.setUint16(20, 1, true)
	view.setUint16(22, channels, true)
	view.setUint32(24, sampleRate, true)
	view.setUint32(28, sampleRate * channels * 2, true)
	view.setUint16(32, channels * 2, true)
	view.setUint16(34, 16, true)
	ascii(view, 36, 'data')
	view.setUint32(40, dataLength, true)
	return bytes
}

/** Interleave Float32 channel data into a complete WAV file. Channels may
 *  hold different lengths — missing frames read as silence. */
export function encodeWavFloat32(channelData: Float32Array[], sampleRate: number): Uint8Array {
	const channels = Math.max(1, channelData.length)
	const frames = channelData.reduce((max, data) => Math.max(max, data.length), 0)
	const dataLength = frames * channels * 2
	const out = new Uint8Array(44 + dataLength)
	out.set(wavHeader(dataLength, sampleRate, channels))
	const view = new DataView(out.buffer)
	for (let frame = 0; frame < frames; frame++) {
		for (let channel = 0; channel < channels; channel++) {
			const sample = Math.max(-1, Math.min(1, channelData[channel]?.[frame] ?? 0))
			view.setInt16(
				44 + (frame * channels + channel) * 2,
				sample < 0 ? sample * 0x8000 : sample * 0x7fff,
				true,
			)
		}
	}

	return out
}

/** Base64 → bytes. Native read-backs cross the bridge as base64 strings
 *  (one JNI/ObjC call instead of per-byte marshalling). */
export function decodeBase64(value: string): Uint8Array {
	const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
	const out = new Uint8Array(Math.ceil((value.length * 3) / 4))
	let buffer = 0
	let bits = 0
	let at = 0
	for (const char of value) {
		const index = alphabet.indexOf(char)
		if (index < 0) {
			continue
		}

		buffer = (buffer << 6) | index
		bits += 6
		if (bits >= 8) {
			bits -= 8
			out[at++] = (buffer >> bits) & 0xff
		}
	}

	return out.subarray(0, at)
}

/** Validate finalized native WAV bytes and derive metadata from the file,
 * including noncanonical AVFoundation chunk layouts. */
export function inspectPcmWav(bytes: Uint8Array): {
	sampleRate: number
	channels: number
	durationSeconds: number
} {
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
	const text = (at: number) => String.fromCharCode(...bytes.subarray(at, at + 4))
	const invalid = () => new Error('Recording is not a finalized 16-bit PCM WAV')
	if (
		bytes.length < 44 ||
		text(0) !== 'RIFF' ||
		text(8) !== 'WAVE' ||
		view.getUint32(4, true) !== bytes.length - 8
	) {
		throw invalid()
	}

	let sampleRate = 0
	let channels = 0
	let dataLength: number | undefined
	let at = 12
	while (at + 8 <= bytes.length) {
		const kind = text(at)
		const length = view.getUint32(at + 4, true)
		const end = at + 8 + length
		if (end > bytes.length) {
			throw invalid()
		}

		if (kind === 'fmt ') {
			if (sampleRate || length < 16) {
				throw invalid()
			}

			channels = view.getUint16(at + 10, true)
			sampleRate = view.getUint32(at + 12, true)
			if (
				view.getUint16(at + 8, true) !== 1 ||
				view.getUint16(at + 22, true) !== 16 ||
				(channels !== 1 && channels !== 2) ||
				!sampleRate ||
				view.getUint16(at + 20, true) !== channels * 2 ||
				view.getUint32(at + 16, true) !== sampleRate * channels * 2
			) {
				throw invalid()
			}
		} else if (kind === 'data') {
			if (dataLength !== undefined) {
				throw invalid()
			}

			dataLength = length
		}

		at = end + (length % 2)
	}

	if (at !== bytes.length || !sampleRate || !dataLength || dataLength % (channels * 2)) {
		throw invalid()
	}

	return { sampleRate, channels, durationSeconds: dataLength / (sampleRate * channels * 2) }
}
