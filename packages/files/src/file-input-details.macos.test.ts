import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { appKitFileInputDetails } from './file-input-details.macos'
import { fileAccepts, validateFiles } from './file-input-utils'
import { createAppKitFileInputState } from './file-input-state.macos'

afterEach(() => vi.unstubAllGlobals())
beforeEach(() => { vi.stubGlobal('UTType', undefined); vi.stubGlobal('objc', undefined); vi.stubGlobal('dlopen', undefined) })

function bridge(value: unknown, scoped = true) {
	const stop = vi.fn(), start = vi.fn(() => scoped)
	const attributes = vi.fn(() => ({ objectForKey: (key: string) => { expect(key).toBe('size-key'); return value } }))
	const url = (path: string) => ({ path, isFileURL: true, startAccessingSecurityScopedResource: start, stopAccessingSecurityScopedResource: stop })
	vi.stubGlobal('NSFileSize', 'size-key')
	vi.stubGlobal('NSURL', { fileURLWithPath: url, URLWithString: (uri: string) => url(decodeURIComponent(new URL(uri).pathname)) })
	vi.stubGlobal('NSFileManager', { defaultManager: { attributesOfItemAtPathError: attributes } })
	return { start, stop, attributes }
}

it('default metadata makes common picker images usable with the demo MIME accept filter and maxSize', () => {
	const f = bridge({ unsignedLongLongValue: 2048 })
	const original = { name: 'Photo.JPEG', uri: 'file:///tmp/Photo%20one.JPEG' }
	const result = appKitFileInputDetails(original)
	expect(result).toEqual({ ...original, mimeType: 'image/jpeg', size: 2048 })
	expect(original).not.toHaveProperty('size')
	expect(fileAccepts(result, 'image/*,.pdf')).toBe(true)
	expect(validateFiles([result], { accept: 'image/*,.pdf', maxSize: 1024 }).valid).toEqual([])
	expect(f.attributes).toHaveBeenCalledWith('/tmp/Photo one.JPEG', null)
	expect(f.start).toHaveBeenCalledOnce(); expect(f.stop).toHaveBeenCalledOnce()
})

it('zero-byte/unwrapped metadata is valid, while failed/invalid metadata remains absent', () => {
	for (const value of [0, { unsignedLongLongValue: () => 0 }]) {
		const f = bridge(value, false)
		expect(appKitFileInputDetails({ name: 'empty.txt', uri: '/tmp/empty.txt' }).size).toBe(0)
		expect(f.stop).not.toHaveBeenCalled()
	}
	for (const value of [null, -1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, {}]) {
		const f = bridge(value)
		expect(appKitFileInputDetails({ name: 'file.txt', uri: '/tmp/file.txt' })).not.toHaveProperty('size')
		expect(f.stop).toHaveBeenCalledOnce()
	}
	const f = bridge(10); f.attributes.mockImplementation(() => { throw new Error('denied') })
	expect(appKitFileInputDetails({ name: 'file.txt', uri: '/tmp/file.txt' })).toEqual({ name: 'file.txt', uri: '/tmp/file.txt', mimeType: 'text/plain' })
	expect(f.stop).toHaveBeenCalledOnce()
})

it('preserves supplied metadata and keeps unknown extension/remote refs optional', () => {
	const f = bridge(99), supplied = { name: 'renamed.png', uri: '/tmp/renamed.png', size: 7, mimeType: 'application/x-custom' }
	expect(appKitFileInputDetails(supplied)).toEqual(supplied)
	expect(f.attributes).not.toHaveBeenCalled()
	expect(appKitFileInputDetails({ name: 'unknown.custom', uri: 'https://example.test/unknown.custom' })).toEqual({ name: 'unknown.custom', uri: 'https://example.test/unknown.custom' })
	expect(f.start).not.toHaveBeenCalled()
	vi.stubGlobal('NSURL', undefined)
	expect(appKitFileInputDetails({ name: 'photo.png', uri: '/tmp/photo.png' })).toEqual({ name: 'photo.png', uri: '/tmp/photo.png', mimeType: 'image/png' })
})


it('the default adapter metadata participates in controller accept/size validation before emitting a value', async () => {
	bridge(2048)
	const change = vi.fn(), publish = vi.fn(), file = { name: 'photo.png', uri: '/tmp/photo.png' }
	const state = createAppKitFileInputState({
		props: () => ({ value: null, onChange: change, accept: 'image/*,.pdf', maxSize: 1024 }),
		pick: async () => appKitFileInputDetails(file), publish,
	})
	state.attach(); state.open()
	await vi.waitFor(() => expect(publish.mock.lastCall?.[0]).toBe(false))
	expect(change).not.toHaveBeenCalled()
	expect(publish.mock.lastCall?.[1][0]).toContain('exceeds')
	bridge(512); state.open()
	await vi.waitFor(() => expect(change).toHaveBeenCalledWith({ ...file, mimeType: 'image/png', size: 512 }))
	state.detach()
})


it('known concrete MIME aliases remain usable instead of being replaced by a different canonical hint', () => {
	vi.stubGlobal('NSURL', undefined)
	for (const [name, accept] of [['file.xml', 'application/xml'], ['audio.wav', 'audio/x-wav'], ['archive.zip', 'application/x-zip-compressed']]) {
		const file = appKitFileInputDetails({ name, uri: '/tmp/' + name }, accept)
		expect(file.mimeType).toBe(accept)
		expect(fileAccepts(file, accept)).toBe(true)
	}
})

it('OS filename types outside the table supply MIME hints for family validation', () => {
	vi.stubGlobal('UTType', { typeWithFilenameExtension: extension => extension === 'avif' ? { identifier: 'public.avif', preferredMIMEType: 'image/avif' } : null })
	const file = appKitFileInputDetails({ name: 'photo.avif', uri: '/tmp/photo.avif', size: 10 }, 'image/*')
	expect(file.mimeType).toBe('image/avif')
	expect(validateFiles([file], { accept: 'image/*', maxSize: 20 }).valid).toEqual([file])
})

it('registered concrete aliases reach controller validation without replacing the native type', async () => {
	const type = { identifier: 'org.example.document', preferredMIMEType: 'application/x-example' }
	vi.stubGlobal('UTType', { typeWithFilenameExtension: () => type, typeWithMIMEType: () => type })
	const accept = 'application/vnd.example-document', change = vi.fn()
	const state = createAppKitFileInputState({
		props: () => ({ value: null, accept, onChange: change }),
		pick: async () => appKitFileInputDetails({ name: 'document.custom', uri: '/tmp/document.custom', size: 5 }, accept), publish() {},
	})
	state.attach()
	try { state.open(); await vi.waitFor(() => expect(change).toHaveBeenCalledWith(expect.objectContaining({ mimeType: accept }))) }
	finally { state.detach() }
})

it('a MIME supertype cannot relabel a concrete file and supplied metadata bypasses discovery', () => {
	const lookup = vi.fn(() => ({ identifier: 'public.avif', preferredMIMEType: 'image/avif' }))
	vi.stubGlobal('UTType', { typeWithFilenameExtension: lookup, typeWithMIMEType: () => ({ identifier: 'public.data' }) })
	const result = appKitFileInputDetails({ name: 'image.avif', uri: '/tmp/image.avif', size: 5 }, 'application/octet-stream')
	expect(result.mimeType).toBe('image/avif'); expect(fileAccepts(result, 'application/octet-stream')).toBe(false)
	lookup.mockClear()
	const supplied = { name: 'image.avif', uri: '/tmp/image.avif', size: 5, mimeType: 'application/x-owned' }
	expect(appKitFileInputDetails(supplied)).toEqual(supplied); expect(lookup).not.toHaveBeenCalled()
})

it('failed native MIME discovery keeps finite hints and unknown metadata optional', () => {
	vi.stubGlobal('UTType', { typeWithFilenameExtension() { throw Error('private bridge payload') } })
	expect(appKitFileInputDetails({ name: 'image.png', uri: '/tmp/image.png', size: 5 }).mimeType).toBe('image/png')
	expect(appKitFileInputDetails({ name: 'unknown.custom', uri: '/tmp/unknown.custom', size: 5 })).not.toHaveProperty('mimeType')
})
