import { Windows, NSWinRT } from '@octane-xplat/platform/windows'
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import { assertSafeFileName, concatBytes, fileTooLarge, throwIfAborted } from './file-bytes'
import type { FileReadBytesOptions, FileRef, Files } from './types'

const CHUNK_SIZE = 64 * 1024
const owned = new Map<string, { file: any; releasing: boolean }>()

function close(resource: any): void {
	try {
		resource?.Close()
	} catch {
		// Cleanup must not replace a read/write failure.
	}
}

function decode(buffer: any, length: number): Uint8Array {
	const hex = String(Windows.Security.Cryptography.CryptographicBuffer.EncodeToHexString(buffer))
	if (hex.length !== length * 2 || (length && !/^[\da-f]+$/i.test(hex))) {
		throw new Error('files.readBytes: invalid native buffer')
	}
	const bytes = new Uint8Array(length)
	for (let index = 0; index < length; index++) {
		bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16)
	}
	return bytes
}

function encode(bytes: Uint8Array): any {
	let hex = ''
	for (const byte of bytes) {
		hex += byte.toString(16).padStart(2, '0')
	}
	return Windows.Security.Cryptography.CryptographicBuffer.DecodeFromHexString(hex)
}

async function readBuffer(input: any, count: number, signal?: AbortSignal): Promise<any> {
	const streams = Windows.Storage.Streams
	const operation = input.ReadAsync(
		new streams.Buffer(count),
		count,
		streams.InputStreamOptions.None,
	)
	const cancel = () => {
		try {
			operation.Cancel?.()
		} catch {}
	}
	signal?.addEventListener('abort', cancel, { once: true })
	if (signal?.aborted) {
		cancel()
	}
	try {
		const result = await NSWinRT.toPromise(operation)
		throwIfAborted(signal)
		return result
	} catch (error) {
		throwIfAborted(signal)
		throw error
	} finally {
		signal?.removeEventListener('abort', cancel)
	}
}

async function readBytes(ref: FileRef, options: FileReadBytesOptions = {}): Promise<Uint8Array> {
	const { maxBytes, signal } = options
	if (maxBytes != null && (!Number.isSafeInteger(maxBytes) || maxBytes < 0)) {
		throw new RangeError('files.readBytes: maxBytes must be a non-negative safe integer')
	}
	throwIfAborted(signal)
	const file = await NSWinRT.toPromise(Windows.Storage.StorageFile.GetFileFromPathAsync(ref.uri))
	throwIfAborted(signal)
	if (maxBytes != null) {
		const properties = await NSWinRT.toPromise(file.GetBasicPropertiesAsync())
		throwIfAborted(signal)
		if (Number(properties.Size) > maxBytes) {
			throw fileTooLarge(ref.name, maxBytes)
		}
	}
	// OpenReadAsync projects IRandomAccessStreamWithContentType without inherited
	// stream methods in alpha.144. Request IInputStream directly instead.
	const input = await NSWinRT.toPromise(file.OpenSequentialReadAsync())
	try {
		throwIfAborted(signal)
		const chunks: Uint8Array[] = []
		let total = 0
		while (true) {
			throwIfAborted(signal)
			// One sentinel byte detects a file growing past the bound mid-read.
			const request = maxBytes == null ? CHUNK_SIZE : Math.min(CHUNK_SIZE, maxBytes - total + 1)
			// DataReader.LoadAsync's specialized async operation crashes the standalone
			// alpha.144 host. IInputStream.ReadAsync uses the working buffer projection.
			const buffer = await readBuffer(input, request, signal)
			const count = Number(buffer.Length)
			if (!Number.isInteger(count) || count < 0 || count > request) {
				throw new Error('files.readBytes: invalid native read length')
			}

			if (!count) {
				return concatBytes(chunks, total)
			}

			total += count
			if (maxBytes != null && total > maxBytes) {
				throw fileTooLarge(ref.name, maxBytes)
			}

			chunks.push(decode(buffer, count))
		}
	} finally {
		close(input)
	}
}

async function createOwned(name: string, write: (file: any) => Promise<void>): Promise<FileRef> {
	assertSafeFileName(name)
	const storage = Windows.Storage
	const file = await NSWinRT.toPromise(
		storage.ApplicationData.Current.TemporaryFolder.CreateFileAsync(
			name,
			storage.CreationCollisionOption.GenerateUniqueName,
		),
	)
	try {
		await write(file)
	} catch (error) {
		try {
			await NSWinRT.toPromise(file.DeleteAsync())
		} catch {}

		throw error
	}
	owned.set(file.Path, { file, releasing: false })
	return { name, uri: file.Path }
}

async function writeBytes(name: string, bytes: Uint8Array): Promise<FileRef> {
	return createOwned(name, async (file) => {
		const stream = await NSWinRT.toPromise(file.OpenAsync(Windows.Storage.FileAccessMode.ReadWrite))
		let output: any
		try {
			// IRandomAccessStream does not project inherited IOutputStream methods.
			output = stream.GetOutputStreamAt(0)
			for (let offset = 0; offset < bytes.byteLength; offset += CHUNK_SIZE) {
				const chunk = bytes.subarray(offset, offset + CHUNK_SIZE)
				const count = Number(await NSWinRT.toPromise(output.WriteAsync(encode(chunk))))
				if (count !== chunk.byteLength) {
					throw new Error('files.writeBytes: incomplete native write')
				}
			}

			if (!(await NSWinRT.toPromise(output.FlushAsync()))) {
				throw new Error('files.writeBytes: native stream flush failed')
			}
		} finally {
			close(output)
			close(stream)
		}
	})
}

/**
 * Experimental Windows file I/O through WinRT. Writes create owned temporary
 * copies; release schedules their deletion. Picker/export window interop is
 * unavailable: picking rejects and export returns `unavailable`.
 *
 * @example
 * import { files } from '@octane-xplat/files'
 * const draft = await files.writeText('draft.txt', 'Passport')
 * const text = await files.readText(draft)
 * files.release(draft)
 */
export const files: Files = {
	pick: async () => {
		throw new UnavailabilityError('files.pick')
	},
	pickMultiple: async () => {
		throw new UnavailabilityError('files.pickMultiple')
	},
	async readText(ref) {
		const file = await NSWinRT.toPromise(Windows.Storage.StorageFile.GetFileFromPathAsync(ref.uri))
		return NSWinRT.toPromise(Windows.Storage.FileIO.ReadTextAsync(file))
	},
	readBytes,
	writeText: (name, text) =>
		createOwned(name, async (file) => {
			await NSWinRT.toPromise(Windows.Storage.FileIO.WriteTextAsync(file, text))
		}),
	writeBytes,
	export: async () => 'unavailable',
	release(ref) {
		const entry = owned.get(ref.uri)
		if (!entry || entry.releasing) {
			return
		}
		entry.releasing = true
		void Promise.resolve()
			.then(() => NSWinRT.toPromise(entry.file.DeleteAsync()))
			.then(
				() => owned.delete(ref.uri),
				() => {
					entry.releasing = false
				},
			)
	},
}
