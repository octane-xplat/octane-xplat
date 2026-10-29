// Foundation bridge contract tests; these do not exercise AppKit or a real filesystem.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { files } from './files.macos'

describe('AppKit files bridge', () => {
	let source: Uint8Array
	let closed: ReturnType<typeof vi.fn>
	let stop: ReturnType<typeof vi.fn>
	let writes: Uint8Array[]
	let writeOK: boolean
	let response: number
	let destination: any

	beforeEach(() => {
		vi.stubGlobal('UTType', undefined); vi.stubGlobal('objc', undefined); vi.stubGlobal('dlopen', undefined)
		source = new Uint8Array([1, 2, 3])
		closed = vi.fn()
		stop = vi.fn()
		writes = []
		writeOK = true
		response = 1
		const url = (path: string): any => ({
			path,
			isFileURL: true,
			startAccessingSecurityScopedResource: () => true,
			stopAccessingSecurityScopedResource: stop,
			URLByAppendingPathComponent: (name: string) => url(`${path}/${name}`),
		})
		destination = url('/chosen/out.bin')
		vi.stubGlobal('NSURL', {
			fileURLWithPath: url,
			URLWithString: (uri: string) => url(decodeURIComponent(new URL(uri).pathname)),
		})
		vi.stubGlobal('NSFileManager', { defaultManager: {
			URLsForDirectoryInDomains: () => ({ firstObject: url('/Documents') }),
			createDirectoryAtURLWithIntermediateDirectoriesAttributesError: () => true,
		} })
		vi.stubGlobal('NSData', { dataWithBytesLength: (buffer: ArrayBuffer, length: number) => ({
			writeToURLAtomically: () => {
				if (writeOK) writes.push(new Uint8Array(buffer, 0, length).slice())
				return writeOK
			},
		}) })
		vi.stubGlobal('NSFileHandle', { fileHandleForReadingAtPath: () => {
			let offset = 0
			return {
				closeFile: closed,
				readDataOfLength: (length: number) => {
					const bytes = source.slice(offset, offset + length)
					offset += bytes.length
					return { length: bytes.length, bytes }
				},
			}
		} })
		vi.stubGlobal('interop', { bufferFromData: (data: any) => data.bytes.buffer })
		vi.stubGlobal('NSSavePanel', { savePanel: () => ({
			URL: destination,
			runModal: () => response,
		}) })
	})
	afterEach(() => vi.unstubAllGlobals())

	it('reads file URLs and closes the handle and security scope', async () => {
		expect(await files.readBytes({ name: 'a b', uri: 'file:///tmp/a%20b' })).toEqual(source)
		expect(closed).toHaveBeenCalledOnce()
		expect(stop).toHaveBeenCalledOnce()
	})

	it('rejects oversized data and still closes resources', async () => {
		await expect(files.readBytes({ name: 'a', uri: '/tmp/a' }, { maxBytes: 2 })).rejects.toThrow('2-byte limit')
		expect(closed).toHaveBeenCalledOnce()
		expect(stop).toHaveBeenCalledOnce()
	})

	it('observes cancellation between chunks and releases resources', async () => {
		source = new Uint8Array(131072)
		const controller = new AbortController()
		const read = files.readBytes({ name: 'a', uri: '/tmp/a' }, { signal: controller.signal })
		controller.abort()
		await expect(read).rejects.toMatchObject({ name: 'AbortError' })
		expect(closed).toHaveBeenCalledOnce()
		expect(stop).toHaveBeenCalledOnce()
	})

	it('writes only the supplied byte view and rejects atomic write failure', async () => {
		const bytes = new Uint8Array([9, 1, 2, 9]).subarray(1, 3)
		expect(await files.writeBytes('a.bin', bytes)).toEqual({ name: 'a.bin', uri: '/Documents/a.bin' })
		expect(writes).toEqual([new Uint8Array([1, 2])])
		writeOK = false
		await expect(files.writeBytes('a.bin', bytes)).rejects.toThrow('Failed to write')
		await expect(files.writeBytes('../escape', bytes)).rejects.toThrow('Unsafe file name')
	})

	it('saves, cancels and recovers after failed export', async () => {
		expect(await files.export('a.bin', source)).toBe('saved')
		response = 0
		expect(await files.export('a.bin', source)).toBe('cancelled')
		expect(writes).toHaveLength(1)
		response = 1
		writeOK = false
		await expect(files.export('a.bin', source)).rejects.toThrow('Failed to write')
		writeOK = true
		expect(await files.export('a.bin', source)).toBe('saved')
	})

	it('rejects overlapping exports without stealing the first result', async () => {
		const first = files.export('a.bin', source)
		await expect(files.export('b.bin', source)).rejects.toMatchObject({ name: 'ExportBusyError' })
		expect(await first).toBe('saved')
	})

	it('does not treat remote URLs or relative paths as local files', async () => {
		for (const uri of ['https://example.com/a', 'relative.txt']) {
			await expect(files.readBytes({ name: 'a', uri })).rejects.toThrow('Not a local file')
		}
	})

	it('single picking preserves extension/MIME restrictions and starting-folder options', async () => {
		const panel: any = { URL: { lastPathComponent: 'report.pdf', absoluteString: 'file:///tmp/report.pdf' }, runModal: vi.fn(() => 1) }
		vi.stubGlobal('NSOpenPanel', { openPanel: () => panel })
		expect(await files.pick('.PDF,application/json', { startingFolder: '/tmp' })).toEqual({ name: 'report.pdf', uri: 'file:///tmp/report.pdf' })
		expect(panel.allowedFileTypes).toEqual(['pdf', 'json']); expect(panel.allowsOtherFileTypes).toBe(false)
		expect(panel.directoryURL.path).toBe('/tmp'); expect(panel.allowsMultipleSelection).toBe(false)
	})

	it('multiple picking retains cancellation and clears a reused panel for any-type requests', async () => {
		const urls = [{ lastPathComponent: 'a.pdf', absoluteString: 'file:///a.pdf' }, { lastPathComponent: 'b.pdf', absoluteString: 'file:///b.pdf' }]
		const panel: any = { URLs: { count: urls.length, objectAtIndex: index => urls[index] }, runModal: () => response }
		vi.stubGlobal('NSOpenPanel', { openPanel: () => panel })
		expect(await files.pickMultiple('.pdf')).toHaveLength(2); expect(panel.allowedFileTypes).toEqual(['pdf'])
		response = 0
		expect(await files.pick('*/*,.png')).toBeNull(); expect(panel.allowedFileTypes).toBeNull()
		expect(await files.pickMultiple()).toEqual([])
	})

	it('registered MIME types outside the fallback table reach modern native panel filtering', async () => {
		const document = { identifier: 'org.example.document', dynamic: false }
		vi.stubGlobal('UTType', { typeWithMIMEType: mime => mime === 'application/x-example-document' ? document : null })
		const panel: any = { allowedContentTypes: [], runModal: () => 0 }
		vi.stubGlobal('NSOpenPanel', { openPanel: () => panel })
		expect(await files.pick('application/x-example-document')).toBeNull()
		expect(panel.allowedContentTypes).toEqual([document])
	})

	it('an unresolved filter rejects before modal presentation without becoming unrestricted', async () => {
		const panel: any = { allowedFileTypes: ['previous'], runModal: vi.fn(() => 1) }
		vi.stubGlobal('NSOpenPanel', { openPanel: () => panel })
		await expect(files.pick('.pdf,application/x-not-known')).rejects.toMatchObject({ name: 'UnsupportedFileTypeError' })
		expect(panel.runModal).not.toHaveBeenCalled(); expect(panel.allowedFileTypes).toEqual(['previous'])
	})
})
