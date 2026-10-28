import { expect, it } from 'vitest'
import { appKitDroppedFiles } from './file-input-drop.macos'
function fixture() {
	const starts: string[] = [], stops: string[] = []
	const native = { NSURL: { URLWithString: (uri: string) => ({ isFileURL: true, path: uri, lastPathComponent: uri.split('/').pop(), absoluteString: uri,
		startAccessingSecurityScopedResource: () => { starts.push(uri); return true }, stopAccessingSecurityScopedResource: () => stops.push(uri) }) },
		NSFileManager: { defaultManager: { attributesOfItemAtPathError: (path: string) => ({ objectForKey: (key: string) => key === 'NSFileType' ?
			(path.endsWith('.txt') ? 'NSFileTypeRegular' : 'NSFileTypeDirectory') : { unsignedLongLongValue: () => 12 } }) } } }
	return { native, starts, stops }
}
it('dropped local regular files receive portable metadata, deduplicate, and balance scoped inspection', () => {
	const f = fixture()
	expect(appKitDroppedFiles(['file:///a.txt', 'file:///a.txt', 'file:///folder', 'https://example.test/a.txt'], undefined, f.native)).toEqual([
		{ name: 'a.txt', uri: 'file:///a.txt', size: 12, mimeType: 'text/plain' },
	])
	expect(f.starts).toEqual(['file:///a.txt', 'file:///folder']); expect(f.stops).toEqual(f.starts)
})
it('uninspectable payloads and native inspection failures decline rather than claiming directory/file support', () => {
	const f = fixture(); f.native.NSFileManager.defaultManager.attributesOfItemAtPathError = () => { throw new Error('no access') }
	expect(appKitDroppedFiles(['file:///a.txt'], undefined, f.native)).toEqual([])
	expect(f.stops).toEqual(['file:///a.txt'])
	expect(appKitDroppedFiles(['file:///a.txt'], undefined, {})).toEqual([])
})
