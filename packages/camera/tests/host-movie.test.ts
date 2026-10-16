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

const decodeBase64 = (base64: string): Uint8Array => Buffer.from(base64, 'base64')

describe('host movie transport', () => {
	it('streams a large movie through writeMovieFileChunk in 4MB slices', async () => {
		const calls: { method: string; options: any }[] = []
		const staged: Uint8Array[] = []
		const host = stubHost(
			['writeMovieFileChunk', 'readMovieFileChunk'],
			{
				writeMovieFileChunk: ({ base64, final }: any) => {
					staged.push(decodeBase64(base64))

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
		expect(Buffer.concat(staged).equals(Buffer.from(input))).toBe(true)
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
					return { base64: Buffer.from(slice).toString('base64') }
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
		expect(Buffer.from(data).equals(Buffer.from(stored))).toBe(true)
		handle.release()
	})

	it.each([null, { ok: false }, { uri: 'file:///unexpected.mp4' }])(
		'rejects an unacknowledged intermediate chunk (%j) before publishing a file',
		async (file) => {
			const calls: { method: string; options: any }[] = []
			const host = stubHost(
				['writeMovieFileChunk', 'readMovieFileChunk'],
				{ writeMovieFileChunk: () => ({ file }) },
				calls,
			)

			const pending = commitHostMovie(host, 'file:///c.mp4', new Blob([sourceBytes(CHUNK + 1)]))
			await expect(pending).rejects.toMatchObject({ kind: 'storageFailed' })
			expect(calls).toHaveLength(1)
		},
	)

	it.each(['', btoa('short'), btoa('too many bytes'), 'invalid base64!'])(
		'refuses incomplete or invalid movie bytes (%j)',
		async (base64) => {
			const host = stubHost(
				['writeMovieFileChunk', 'readMovieFileChunk'],
				{
					movieFileInfo: () => ({ info: { exists: true, size: 8 } }),
					readMovieFileChunk: () => ({ base64 }),
				},
				[],
			)

			await expect(
				openHostMovie(host, {
					kind: 'nativeFile',
					resourceId: 'file:///c.mp4',
					fileUrl: 'file:///c.mp4',
				}),
			).rejects.toMatchObject({ kind: 'unavailable' })
		},
	)
})
