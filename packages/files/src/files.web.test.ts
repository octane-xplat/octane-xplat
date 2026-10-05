// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { files } from './files.web'

beforeEach(() => {
	let counter = 0
	vi.stubGlobal('URL', {
		...URL,
		createObjectURL: (_blob: Blob) => `blob:mock/${counter++}`,
		revokeObjectURL: vi.fn(),
	})
})

afterEach(() => {
	vi.unstubAllGlobals()
	vi.restoreAllMocks()
	delete (window as any).showSaveFilePicker
})

describe('files.writeBytes (web)', () => {
	it('starts a download and returns a readable ref', async () => {
		const ref = await files.writeBytes('report.bin', new Uint8Array([1, 2, 3, 255]))
		expect(ref.name).toBe('report.bin')
		expect(ref.uri).toMatch(/^blob:/)

		const back = await files.readBytes(ref)
		expect([...back]).toEqual([1, 2, 3, 255])
	})

	it('rejects path-traversal names', async () => {
		await expect(files.writeBytes('../escape.bin', new Uint8Array(1))).rejects.toThrow(
			/Unsafe file name/,
		)
	})
})

describe('files.readBytes (web)', () => {
	it('enforces maxBytes without returning truncated data', async () => {
		const ref = await files.writeBytes('big.bin', new Uint8Array(1024))
		await expect(files.readBytes(ref, { maxBytes: 512 })).rejects.toThrow(/exceeds/)
	})

	it('rejects on an aborted signal', async () => {
		const ref = await files.writeBytes('a.bin', new Uint8Array([1]))
		const controller = new AbortController()
		controller.abort()
		await expect(files.readBytes(ref, { signal: controller.signal })).rejects.toThrowError(
			expect.objectContaining({ name: 'AbortError' }),
		)
	})

	it('reads foreign URLs through fetch with the cap applied', async () => {
		const body = new Uint8Array([1, 2, 3, 4])
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response(body)),
		)

		const back = await files.readBytes({ name: 'remote.bin', uri: 'https://x/remote.bin' })
		expect([...back]).toEqual([1, 2, 3, 4])
		expect(fetch).toHaveBeenCalledWith('https://x/remote.bin', { signal: undefined })

		await expect(
			files.readBytes({ name: 'remote.bin', uri: 'https://x/remote.bin' }, { maxBytes: 2 }),
		).rejects.toThrow(/exceeds/)
	})

	it('revokes the object URL on release', async () => {
		const ref = await files.writeBytes('gone.bin', new Uint8Array([1]))
		files.release(ref)
		expect(URL.revokeObjectURL).toHaveBeenCalledWith(ref.uri)
	})
})

describe('files.export (web)', () => {
	it('returns unavailable without the File System Access API', async () => {
		expect(await files.export('a.bin', new Uint8Array([1]))).toBe('unavailable')
	})

	it('writes bytes through a save picker and reports saved', async () => {
		const write = vi.fn()
		const close = vi.fn(async () => {})
		const showSaveFilePicker = vi.fn(async () => ({
			createWritable: async () => ({ write, close }),
		}))

		;(window as any).showSaveFilePicker = showSaveFilePicker

		const result = await files.export('dump.bin', new Uint8Array([7, 8]))
		expect(result).toBe('saved')
		expect(write).toHaveBeenCalledWith(new Uint8Array([7, 8]))
		expect(close).toHaveBeenCalled()
	})

	it('maps picker dismissal to cancelled', async () => {
		const showSaveFilePicker = vi.fn(async () => {
			throw new DOMException('dismissed', 'AbortError')
		})

		;(window as any).showSaveFilePicker = showSaveFilePicker

		expect(await files.export('dump.bin', new Uint8Array([7]))).toBe('cancelled')
	})
})
