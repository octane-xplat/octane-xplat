import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const compile = async (name) => {
	const source = await readFile(new URL(`../src/${name}`, import.meta.url), 'utf8')
	return ts.transpile(source, {
		module: ts.ModuleKind.CommonJS,
		target: ts.ScriptTarget.ES2022,
	})
}

const load = (compiled, host) => {
	const context = {
		exports: {},
		require: () => ({}),
		ArrayBuffer,
		Array,
		Uint8Array,
		DataView,
		Number,
		TypeError,
		RangeError,
		...host,
	}

	vm.runInNewContext(compiled, context)
	return context.exports
}

// NSMutableData stub: dataWithLength owns an ArrayBuffer; mutableBytes is a
// token the SecRandomCopyBytes stub uses to find the buffer to fill.
const appleHost = ({ status = 0, seed = 7 } = {}) => ({
	kSecRandomDefault: {},
	NSMutableData: {
		dataWithLength(length) {
			const data = { __bytes: new ArrayBuffer(length), length }
			data.mutableBytes = { data }
			return data
		},
	},
	SecRandomCopyBytes(_rnd, count, ptr) {
		const bytes = new Uint8Array(ptr.data.__bytes)
		for (let i = 0; i < count; i++) {
			bytes[i] = (seed + i * 31) & 0xff
		}

		return status
	},
	interop: { bufferFromData: (data) => data.__bytes },
})

const expected = (length, seed = 7) => {
	const out = new Uint8Array(length)
	for (let i = 0; i < length; i++) {
		out[i] = (seed + i * 31) & 0xff
	}

	return out
}

const macosCompiled = await compile('random.macos.ts')
const webCompiled = await compile('random.web.ts')
const nativeCompiled = await compile('random.ts')

test('macOS random fills typed arrays and DataViews through SecRandomCopyBytes', () => {
	const { random } = load(macosCompiled, appleHost())
	assert.equal(random.supported, true)

	const buffer = new ArrayBuffer(40)
	const view = new Uint8Array(buffer, 8, 16)
	assert.equal(random.fill(view), view)
	assert.deepEqual(new Uint8Array(buffer), new Uint8Array([...new Uint8Array(8), ...expected(16), ...new Uint8Array(16)]))

	const dataView = new DataView(new ArrayBuffer(4))
	random.fill(dataView)
	assert.deepEqual(new Uint8Array(dataView.buffer), expected(4))

	assert.deepEqual(random.bytes(10), expected(10))
	assert.throws(() => random.bytes(-1), RangeError)
	assert.throws(() => random.bytes(1.5), RangeError)
	assert.throws(() => random.fill({}), TypeError)
})

test('macOS random throws on a nonzero SecRandomCopyBytes status and reports unsupported without symbols', () => {
	const { random: failing } = load(macosCompiled, appleHost({ status: -1 }))
	assert.equal(failing.supported, true)
	assert.throws(() => failing.bytes(4), /SecRandomCopyBytes failed/)

	const { random: missing } = load(macosCompiled, {})
	assert.equal(missing.supported, false)
	assert.throws(() => missing.bytes(4), /unavailable/)
})

test('web random chunks fills past the 64 KiB getRandomValues quota', () => {
	const calls = []
	const crypto = {
		getRandomValues(view) {
			calls.push(view.byteLength)
			view.fill(0xa5)
			return view
		},
	}

	const { random } = load(webCompiled, { crypto })
	assert.equal(random.supported, true)

	const view = new Uint8Array(200_000)
	random.fill(view)
	assert.deepEqual(calls, [65536, 65536, 65536, 3392])
	assert.equal(view.every((byte) => byte === 0xa5), true)

	assert.equal(random.bytes(0).length, 0)
	assert.throws(() => random.bytes(-1), RangeError)
})

test('web random reports unsupported when crypto is absent', () => {
	const { random } = load(webCompiled, { crypto: undefined })
	assert.equal(random.supported, false)
	assert.throws(() => random.bytes(4), /unavailable/)
})

test('native random dispatches to SecRandomCopyBytes under Application.ios', () => {
	const require = (name) =>
		name === '@nativescript/core' ? { Application: { ios: {} } } : {}

	const { random } = load(nativeCompiled, { ...appleHost(), require })
	assert.equal(random.supported, true)
	assert.deepEqual(random.bytes(8), expected(8))
})

test('native random dispatches to SecureRandom under Application.android', () => {
	const FakeArray = function () {}
	FakeArray.create = () => {
		const bytes = []
		bytes.length = 32
		return bytes
	}

	const java = {
		security: {
			SecureRandom: class {
				nextBytes(buffer) {
					for (let i = 0; i < buffer.length; i++) {
						buffer[i] = i & 0xff
					}
				}
			},
		},
	}

	const require = (name) =>
		name === '@nativescript/core' ? { Application: { android: {} } } : {}

	const { random } = load(nativeCompiled, { require, java, Array: FakeArray })
	assert.equal(random.supported, true)

	const view = new Uint8Array(4)
	random.fill(view)
	assert.deepEqual([...view], [0, 1, 2, 3])
})

test('native random reports unsupported without an OS binding', () => {
	const require = (name) => (name === '@nativescript/core' ? { Application: {} } : {})
	const { random } = load(nativeCompiled, { require })
	assert.equal(random.supported, false)
	assert.throws(() => random.bytes(4), /no OS CSPRNG/)
})
