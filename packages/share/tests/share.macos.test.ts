// Facade contract only; fake metadata does not establish AppKit/OS behavior.
import { afterEach, expect, it } from 'vitest'
import { share } from '../src/share.macos'
const globals = globalThis as any
afterEach(() => { delete globals.XplatShare; delete globals.__xplatAppKit })

it('missing/stale native metadata is unavailable without a harness fallback', async () => {
	globals.__xplatAppKit = { shareContent() { throw Error('must not use old host seam') } }
	for (const bridge of [undefined, {}]) {
		globals.XplatShare = bridge
		expect(await share.text('hello')).toBe('unavailable')
		expect(await share.url('https://example.com')).toBe('unavailable')
		expect(await share.file('/tmp/report.txt')).toBe('unavailable')
	}
})
it('keeps the promise pending until the native completion and settles only once', async () => {
	let done!: (result: string) => void
	globals.XplatShare = { shareKindValueSubjectCompletion(_k: string, _v: string, _s: string, callback: typeof done) { done = callback } }
	let settled = false
	const result = share.text('hello').then((value) => { settled = true; return value })
	await Promise.resolve(); expect(settled).toBe(false)
	done('cancelled'); done('shared')
	expect(await result).toBe('cancelled')
})
it('forwards text subjects and URL titles without duplicate body items', async () => {
	const calls: unknown[] = []
	globals.XplatShare = { shareKindValueSubjectCompletion(k: string, v: string, s: string, done: (result: string) => void) { calls.push([k, v, s]); done('shared') } }
	expect(await share.text('body', 'Subject')).toBe('shared')
	expect(await share.url('https://example.com', 'Title')).toBe('shared')
	expect(await share.text('plain')).toBe('shared')
	expect(calls).toEqual([['text', 'body', 'Subject'], ['url', 'https://example.com', 'Title'], ['text', 'plain', '']])
})
it('maps only terminal native outcomes and does not invent a clipboard fallback', async () => {
	for (const result of ['shared', 'cancelled', 'unavailable', 'future', 'copied']) {
		globals.XplatShare = { shareKindValueSubjectCompletion(_k: string, _v: string, _s: string, done: (result: string) => void) { done(result) } }
		expect(await share.text('body')).toBe(result === 'shared' || result === 'cancelled' ? result : 'unavailable')
	}
})
it('normalizes absolute paths and encoded local file URLs; ignores Android-only file options', async () => {
	const paths: string[] = []
	globals.XplatShare = { shareKindValueSubjectCompletion(k: string, v: string, s: string, done: (result: string) => void) { expect(k).toBe('file'); expect(s).toBe(''); paths.push(v); done('shared') } }
	for (const path of ['/tmp/a b.txt', 'file:///tmp/a%20b.txt', 'FILE://LOCALHOST/tmp/a%20b.txt', 'file:///tmp/a%23b%3Fc.txt']) {await share.file(path, { subject: 'Android chooser', mimeType: 'text/plain' })}
	expect(paths).toEqual(['/tmp/a b.txt', '/tmp/a b.txt', '/tmp/a b.txt', '/tmp/a#b?c.txt'])
})
it('rejects unsupported/malformed file paths before native presentation', async () => {
	globals.XplatShare = { shareKindValueSubjectCompletion() { throw Error('native must not run') } }
	for (const path of ['', 'relative.txt', 'https://example.com/a', 'content://example/a', 'file://remote/tmp/a', 'file://%2Ftmp/a', 'file://localhost', 'file:///tmp/%ZZ', 'file:///tmp/a?query', 'file:///tmp/a#fragment', 'file:///tmp/a%00b', '/tmp/a\0b']) {await expect(share.file(path)).rejects.toThrow()}
})
it('native invocation failures reject instead of claiming an outcome', async () => {
	globals.XplatShare = { shareKindValueSubjectCompletion() { throw Error('bridge failure') } }
	await expect(share.text('body')).rejects.toThrow('bridge failure')
	await expect(share.file('/tmp/report.txt')).rejects.toThrow('bridge failure')
})

it('rejects metadata access failures through the promise contract', async () => {
	globals.XplatShare = { get shareKindValueSubjectCompletion() { throw Error('metadata failure') } }
	await expect(share.text('body')).rejects.toThrow('metadata failure')
	await expect(share.url('https://example.com')).rejects.toThrow('metadata failure')
})
