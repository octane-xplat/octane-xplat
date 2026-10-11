import { describe, expect, it } from 'vitest'
import { commitHostMovie, openHostMovie } from '../src/host-movie.web'

// Host service stubs — call records each method's args and replies from a
// scripted implementation. `capabilities` controls whether the chunked
// contract is advertised.
const stubHost = (
	methods: string[],
	impl: Record<string, (options: any) => any>,
	calls: { method: string; options: any }[],
) =>
	({
		call: async (_service: string, method: string, options: any) => {
			calls.push({ method, options })
			return impl[method]?.(options)
		},
		capabilities: async () => ({ camera: methods }),
		on: () => () => {},
		dispose: () => {},
	}) as any

const CHUNK = 4 * 1024 * 1024

const sourceBytes = (size: number) => {
	const data = new Uint8Array(size)
	for (let index = 0; index < size; index += 1) {
		data[index] = index % 251
	}

	return data
}

const decodeBase64 = (base64: string): Uint8Array => {
	const binary = atob(base64)
	const data = new Uint8Array(binary.length)
	for (let index = 0; index < binary.length; index += 1) {
		data[index] = binary.charCodeAt(index)
	}

	return data
}

describe('host movie transport', () => {
	it('streams a large movie through writeMovieFileChunk in 4MB slices', async () => {
		const calls: { method: string; options: any }[] = []
		const staged: number[] = []
		const host = stubHost(
			['writeMovieFileChunk', 'readMovieFileChunk'],
			{
				writeMovieFileChunk: ({ base64, final }: any) => {
					for (const byte of decodeBase64(base64)) {
						staged.push(byte)
					}

					return {
						file: final ? { name: 'clip.mp4', uri: 'file:///clips/clip.mp4' } : { ok: true },
					}
				},
			},
			calls,
		)

		const input = sourceBytes(CHUNK * 2 + 17)
		const output = await commitHostMovie(host, 'file:///clips/clip.mp4', new Blob([input]))

		expect(output).toEqual({
			kind: 'nativeFile',
			resourceId: 'file:///clips/clip.mp4',
			fileUrl: 'file:///clips/clip.mp4',
		})

		// 3 chunks: two full, one partial; only the last is flagged final.
		expect(calls.map((call) => call.method)).toEqual([
			'writeMovieFileChunk',
			'writeMovieFileChunk',
			'writeMovieFileChunk',
		])

		expect(calls.map((call) => call.options.final)).toEqual([false, false, true])
		expect(calls.every((call) => call.options.fileUrl === 'file:///clips/clip.mp4')).toBe(true)
		expect(staged).toEqual([...input])
	})

	it('falls back to the single writeMovieFile payload on hosts without the chunked contract', async () => {
		const calls: { method: string; options: any }[] = []
		const host = stubHost(
			['writeMovieFile'],
			{ writeMovieFile: () => ({ file: { name: 'c.mov', uri: 'file:///c.mov' } }) },
			calls,
		)

		const output = await commitHostMovie(host, 'file:///c.mov', new Blob([sourceBytes(64)]))
		expect(output.resourceId).toBe('file:///c.mov')
		expect(calls.map((call) => call.method)).toEqual(['writeMovieFile'])
	})

	it('reads a stored movie back through readMovieFileChunk ranges', async () => {
		const stored = sourceBytes(CHUNK + 3)
		const calls: { method: string; options: any }[] = []
		const host = stubHost(
			['movieFileInfo', 'writeMovieFileChunk', 'readMovieFileChunk'],
			{
				movieFileInfo: () => ({ info: { exists: true, size: stored.length } }),
				readMovieFileChunk: ({ offset, length }: any) => {
					const slice = stored.subarray(offset, offset + length)
					let binary = ''
					for (const byte of slice) {
						binary += String.fromCharCode(byte)
					}

					return { base64: btoa(binary) }
				},
			},
			calls,
		)

		const handle = await openHostMovie(host, {
			kind: 'nativeFile',
			resourceId: 'file:///clips/clip.mp4',
			fileUrl: 'file:///clips/clip.mp4',
		})

		expect(handle.fileUrl).toBe('file:///clips/clip.mp4')
		expect(calls[0].method).toBe('movieFileInfo')
		expect(calls.slice(1).map((call) => call.options)).toEqual([
			{ fileUrl: 'file:///clips/clip.mp4', offset: 0, length: CHUNK },
			{ fileUrl: 'file:///clips/clip.mp4', offset: CHUNK, length: 3 },
		])

		// The reassembled bytes must match the stored movie exactly.
		const response = await fetch(handle.url)
		const data = new Uint8Array(await response.arrayBuffer())
		expect([...data]).toEqual([...stored])
		handle.release()
	})
})
