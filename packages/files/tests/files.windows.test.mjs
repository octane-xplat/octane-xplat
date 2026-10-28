import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

// Projected-host contracts only: no Windows/WinRT objects or real files are used.
const compile = (name) =>
	ts.transpile(readFileSync(new URL(`../src/${name}.ts`, import.meta.url), 'utf8'), {
		module: ts.ModuleKind.CommonJS,
		target: ts.ScriptTarget.ES2022,
	})

const source = compile('files.windows')
const helpers = compile('file-bytes')
class UnavailabilityError extends Error {}

function fixture(bytes = new Uint8Array([1, 2, 3])) {
	const state = {
		bytes,
		size: bytes.length,
		reads: [],
		closed: [],
		created: [],
		deleted: [],
		writes: [],
		text: 'line one\r\nΩ',
		flushOK: true,
		partialWrite: false,
		writeError: null,
		deleteError: null,
		beforeLoad: null,
		cancelled: 0,
	}
	const op = (value, kind) => ({ value, kind })
	const file = (path) => ({
		Path: path,
		DeleteAsync() {
			state.deleted.push(path)
			if (state.deleteError) {
				throw state.deleteError
			}
			return op(undefined)
		},
		GetBasicPropertiesAsync: () => op({ Size: state.size }),
		OpenSequentialReadAsync: () =>
			op({
				position: 0,
				Close: () => state.closed.push('input'),
				ReadAsync(buffer, count, options) {
					assert.equal(buffer.Capacity, count)
					assert.equal(options, 0)
					state.reads.push(count)
					const bytes = state.bytes.slice(this.position, this.position + count)
					this.position += bytes.length
					return {
						...op({ bytes, Length: bytes.length }, 'load'),
						Cancel() {
							state.cancelled++
						},
					}
				},
			}),
		OpenAsync: () =>
			op({
				WriteAsync(buffer) {
					state.writes.push(buffer)
					return op(buffer.length - (state.partialWrite ? 1 : 0))
				},
				FlushAsync: () => op(state.flushOK),
				Close: () => state.closed.push('write'),
			}),
	})
	const Windows = {
		Security: {
			Cryptography: {
				CryptographicBuffer: {
					EncodeToHexString: (buffer) => Buffer.from(buffer.bytes ?? buffer).toString('hex'),
					DecodeFromHexString: (hex) => new Uint8Array(Buffer.from(hex, 'hex')),
				},
			},
		},
		Storage: {
			StorageFile: { GetFileFromPathAsync: (path) => op(file(path)) },
			CreationCollisionOption: { GenerateUniqueName: 0 },
			FileAccessMode: { ReadWrite: 1 },
			ApplicationData: {
				Current: {
					TemporaryFolder: {
						CreateFileAsync(name, collision) {
							assert.equal(collision, 0)
							const path = `C:\\temporary\\${state.created.length}-${name}`
							state.created.push(path)
							return op(file(path))
						},
					},
				},
			},
			FileIO: {
				ReadTextAsync: () => op(state.text),
				WriteTextAsync(_file, text) {
					if (state.writeError) {
						throw state.writeError
					}
					state.text = text
					return op(undefined)
				},
			},
			Streams: {
				InputStreamOptions: { None: 0 },
				Buffer: class {
					constructor(capacity) {
						this.Capacity = capacity
					}
				},
			},
		},
	}
	const helperExports = {}
	vm.runInNewContext(helpers, { exports: helperExports, Uint8Array })
	const exports = {}
	vm.runInNewContext(source, {
		exports,
		Uint8Array,
		require(id) {
			if (id === './file-bytes') {
				return helperExports
			}
			if (id === '@octane-xplat/lib/capability') {
				return { UnavailabilityError }
			}
			assert.equal(id, '@octane-xplat/platform/windows', 'mobile dependencies must not load')
			return {
				Windows,
				NSWinRT: {
					toPromise(operation) {
						if (operation.kind === 'load') {
							state.beforeLoad?.()
						}
						return Promise.resolve(operation.value)
					},
				},
			}
		},
	})
	return { files: exports.files, state }
}

const ref = { name: 'source.bin', uri: 'C:\\source.bin' }
const settled = () => new Promise((resolve) => setImmediate(resolve))

test('Windows file import avoids mobile plugins and reports picker/export unavailability explicitly', async () => {
	const { files } = fixture()
	await assert.rejects(files.pick(), UnavailabilityError)
	await assert.rejects(files.pickMultiple(), UnavailabilityError)
	assert.equal(await files.export('out.bin', new Uint8Array()), 'unavailable')
})

test('Windows binary reads are chunked, preserve bytes and close each owned stream', async () => {
	const bytes = Uint8Array.from({ length: 70000 }, (_, index) => index % 256)
	const { files, state } = fixture(bytes)
	assert.deepEqual(await files.readBytes(ref), bytes)
	assert.deepEqual(state.reads, [65536, 65536, 65536])
	assert.deepEqual(state.closed, ['input'])
	assert.equal(await files.readText(ref), 'line one\r\nΩ')
})

test('Windows binary size bounds reject before loading oversized files and catch growth', async () => {
	const { files, state } = fixture()
	await assert.rejects(files.readBytes(ref, { maxBytes: 2 }), /exceeds/)
	assert.deepEqual(state.reads, [])
	assert.deepEqual(state.closed, [])
	state.size = 1 // The file grew after its size was reported.
	await assert.rejects(files.readBytes(ref, { maxBytes: 2 }), /exceeds/)
	assert.deepEqual(state.reads, [3])
	await assert.rejects(files.readBytes(ref, { maxBytes: -1 }), /safe integer/)
	await assert.rejects(files.readBytes(ref, { maxBytes: NaN }), /safe integer/)
	const empty = fixture(new Uint8Array())
	assert.deepEqual(await empty.files.readBytes(ref, { maxBytes: 0 }), new Uint8Array())
})

test('Windows reads cancel an active operation and close resources on abort', async () => {
	const { files, state } = fixture()
	const controller = new AbortController()
	state.beforeLoad = () => controller.abort()
	await assert.rejects(files.readBytes(ref, { signal: controller.signal }), { name: 'AbortError' })
	assert.equal(state.cancelled, 1)
	assert.deepEqual(state.closed, ['input'])
	const already = new AbortController()
	already.abort()
	const other = fixture()
	await assert.rejects(other.files.readBytes(ref, { signal: already.signal }), {
		name: 'AbortError',
	})
	assert.deepEqual(other.state.closed, [])
})

test('Windows sandbox writes preserve offset byte views, reject incomplete writes and delete failed copies', async () => {
	const { files, state } = fixture()
	const input = new Uint8Array([0, 4, 5, 6, 0]).subarray(1, 4)
	const saved = await files.writeBytes('out.bin', input)
	assert.equal(saved.name, 'out.bin')
	assert.deepEqual(state.writes[0], new Uint8Array([4, 5, 6]))
	assert.deepEqual(state.closed, ['write'])
	state.partialWrite = true
	await assert.rejects(files.writeBytes('partial.bin', input), /incomplete native write/)
	assert.equal(state.deleted.length, 1)
	state.partialWrite = false
	state.flushOK = false
	await assert.rejects(files.writeBytes('flush.bin', input), /flush failed/)
	assert.equal(state.deleted.length, 2)
	state.writeError = new Error('write denied')
	await assert.rejects(files.writeText('denied.txt', 'draft'), /write denied/)
	assert.equal(state.deleted.length, 3)
	await assert.rejects(files.writeText('../outside.txt', 'draft'), /Unsafe file name/)
	assert.equal(state.created.length, 4)
})

test('Windows release deletes only owned copies and permits retry after failed cleanup', async () => {
	const { files, state } = fixture()
	const saved = await files.writeText('draft.txt', 'new text')
	assert.equal(await files.readText(saved), 'new text')
	files.release(ref)
	assert.deepEqual(state.deleted, [])
	state.deleteError = new Error('busy')
	files.release(saved)
	files.release(saved)
	await settled()
	assert.equal(state.deleted.length, 1)
	state.deleteError = null
	files.release(saved)
	await settled()
	assert.equal(state.deleted.length, 2)
	files.release(saved)
	await settled()
	assert.equal(state.deleted.length, 2)
})
