import { describe, expect, it } from 'vitest'
import { appKitFileTypeClass, appKitFileTypeFilter, appKitTypesForMIME, applyAppKitFileTypeFilter } from './file-pick-filter.macos'

// Pure/native-bridge models only; no framework/panel is loaded or run here.
describe('AppKit picker type filters', () => {
	it('explicit any-type requests override mixed restrictions and skip type bridge access', () => {
		let reads = 0
		const host = Object.defineProperty({}, 'UTType', { get() { reads++; throw Error('unloaded lazy symbol') } })
		for (const accept of ['', ' , ', '*/*', '.png,*/*']) {expect(appKitFileTypeFilter(accept, host)).toBeNull()}
		expect(reads).toBe(0)
	})

	it('normalizes and deduplicates explicit extension hints without requiring a type bridge', () => {
		expect(appKitFileTypeFilter(' .PDF, .pdf, .docx, .tar.gz, .文件 ', {})).toEqual({ legacy: ['pdf', 'docx', 'tar.gz', '文件'] })
	})

	it('wildcard families use native conformance identifiers rather than finite extension lists', () => {
		expect(appKitFileTypeFilter('image/*,audio/*,video/*,text/*', {})).toEqual({
			legacy: ['public.image', 'public.audio', 'public.movie', 'public.video', 'public.text'],
		})
	})

	it('MIME lookup retains every declared native result and declines dynamic-only guesses', () => {
		const values = [{ identifier: 'org.example.document', dynamic: false }, { identifier: 'org.example.alternate' }, { identifier: 'dyn.guess', dynamic: true }]
		const Type = { typesWithTagTagClassConformingToType(mime, tag, parent) {
			expect(this).toBe(Type); expect([mime, tag, parent]).toEqual(['application/x-example', 'public.mime-type', null])
			return { count: values.length, objectAtIndex: index => values[index] }
		} }
		expect(appKitTypesForMIME(Type, 'application/x-example')).toEqual(values.slice(0, 2))
		expect(appKitFileTypeFilter('application/x-example', { UTType: Type })).toEqual({ legacy: values.slice(0, 2).map(value => value.identifier), contentTypes: values.slice(0, 2) })
	})

	it('complete native resolution selects modern types and deduplicates aliases', () => {
		const pdf = { identifier: 'com.adobe.pdf' }
		const Type = { typeWithFilenameExtension: () => pdf, typeWithMIMEType: () => pdf }
		const panel = { allowedContentTypes: [] as any[], allowsOtherFileTypes: true }
		applyAppKitFileTypeFilter(panel, '.pdf,application/pdf', { UTType: Type })
		expect(panel.allowedContentTypes).toEqual([pdf]); expect(panel.allowsOtherFileTypes).toBe(false)
	})

	it('partial native resolution preserves the full union through existing extension/UTI filters', () => {
		const panel: any = { allowedContentTypes: [] }
		applyAppKitFileTypeFilter(panel, '.custom,image/*', { UTType: { typeWithIdentifier: id => ({ identifier: id }) } })
		expect(panel.allowedFileTypes).toEqual(['custom', 'public.image'])
		expect(panel.allowedContentTypes, 'a partial modern list must not drop the extension').toEqual([])
		const legacy: any = { allowedFileTypes: ['old'] }
		applyAppKitFileTypeFilter(legacy, '*/*', {})
		expect(legacy.allowedFileTypes).toBeNull()
		const modern: any = { allowedContentTypes: [{ identifier: 'old' }] }
		applyAppKitFileTypeFilter(modern, '', {})
		expect(modern.allowedContentTypes).toEqual([])
	})

	it('unresolved MIME members reject the entire filter before panel mutation', () => {
		for (const accept of ['application/x-not-known', '.pdf,application/x-not-known', 'application/*']) {
			const panel: any = { allowedFileTypes: ['old'], allowsOtherFileTypes: true }
			expect(() => applyAppKitFileTypeFilter(panel, accept, {})).toThrowError(expect.objectContaining({ name: 'UnsupportedFileTypeError' }))
			expect(panel).toEqual({ allowedFileTypes: ['old'], allowsOtherFileTypes: true })
		}
		expect(appKitFileTypeFilter('application/pdf', { UTType: { typeWithMIMEType() { throw Error('bridge unavailable') } } })!.legacy).toEqual(['pdf'])
	})

	it('malformed restrictions fail explicitly without coercing objects or prototype keys', () => {
		for (const accept of ['*', 'image/png,*', '.', '..png', '.foo/bar', '.foo\\bar', 'constructor', 'text/plain; charset=utf-8', 'application/*+json', { toString() { throw Error('private payload') } }]) {
			expect(() => appKitFileTypeFilter(accept as string, {})).toThrowError(expect.objectContaining({ name: 'UnsupportedFileTypeError' }))
		}
	})

	it('loads only UniformTypeIdentifiers before materializing a lazy class and caches successful loading', () => {
		let ready = false, loads = 0, reads = 0
		const Type = {}, host: any = { objc: { import(name) { expect(this).toBe(host.objc); expect(name).toBe('UniformTypeIdentifiers'); ready = true; loads++ } } }
		Object.defineProperty(host, 'UTType', { get() { expect(ready).toBe(true); reads++; return Type } })
		expect(appKitFileTypeClass(host)).toBe(Type); expect(appKitFileTypeClass(host)).toBe(Type)
		expect([loads, reads]).toEqual([1, 2])
	})

	it('failed loading never dereferences a lazy class, can retry, and has a narrow dlopen path', () => {
		let reads = 0, fail = true
		const Type = {}, host: any = { objc: { import() { if (fail) {throw Error('private load payload')} } } }
		Object.defineProperty(host, 'UTType', { get() { reads++; return Type } })
		expect(appKitFileTypeClass(host)).toBeUndefined(); expect(reads).toBe(0)
		fail = false; expect(appKitFileTypeClass(host)).toBe(Type)
		const direct: any = { dlopen(path, flags) { expect(this).toBe(direct); expect(path).toBe('/System/Library/Frameworks/UniformTypeIdentifiers.framework/UniformTypeIdentifiers'); expect(flags).toBe(2); return {} } }
		Object.defineProperty(direct, 'UTType', { get: () => Type })
		expect(appKitFileTypeClass(direct)).toBe(Type)
	})
})
