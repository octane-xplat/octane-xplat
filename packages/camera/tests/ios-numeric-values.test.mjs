import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = await readFile(new URL('../src/session-backend.ios.ts', import.meta.url), 'utf8')
const start = source.indexOf('const numericValue =')
const end = source.indexOf('/** iOS adapter:', start)
assert.ok(start >= 0 && end > start)
const compiled = ts.transpile(source.slice(start, end) + '\nglobalThis.readDisk = freeDiskBytes; globalThis.readNumber = numericValue', {
	module: ts.ModuleKind.CommonJS,
	target: ts.ScriptTarget.ES2022,
})

const load = (value) => {
	const context = vm.createContext({
		NSFileSystemFreeSize: 'free',
		knownFolders: { documents: () => ({ path: '/documents' }) },
		NSFileManager: { defaultManager: { attributesOfFileSystemForPathError: () => ({ objectForKey: () => value }) } },
	})
	vm.runInContext(compiled, context)
	return context
}

test('disk space remains correct for unboxed and boxed id returns', () => {
	for (const value of [128 * 1024 * 1024, { longLongValue: 128 * 1024 * 1024 }, { doubleValue: 128 * 1024 * 1024 }]) {
		assert.equal(load(value).readDisk(), 128 * 1024 * 1024)
	}
	assert.equal(load(0).readDisk(), 0)
	assert.equal(load(undefined).readDisk(), Number.MAX_SAFE_INTEGER)
	assert.equal(load({ get longLongValue() { throw new Error('bridge failure') } }).readDisk(), Number.MAX_SAFE_INTEGER)
})

test('interruption reasons and recording-success flags accept both bridge shapes', () => {
	const { readNumber } = load(undefined)
	for (const value of [3, { longLongValue: 3 }, { doubleValue: 3 }]) {
		assert.equal(readNumber(value), 3)
	}
	for (const value of [true, 1, { longLongValue: 1 }]) {
		assert.equal(readNumber(value), 1)
	}
	assert.equal(readNumber(false), 0)
	assert.equal(readNumber(null), undefined)
})
