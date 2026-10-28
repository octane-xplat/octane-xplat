import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

// Projected-host contract tests; these do not execute WinRT or prove OS access.
function load(name, imports = {}) {
	const source = readFileSync(new URL(`../src/${name}.windows.ts`, import.meta.url), 'utf8')
	const compiled = ts.transpile(source, {
		module: ts.ModuleKind.CommonJS,
		target: ts.ScriptTarget.ES2022,
	})
	const exports = {}
	vm.runInNewContext(compiled, {
		exports,
		ArrayBuffer,
		Uint8Array,
		require: (id) => {
			assert.ok(id in imports, `unexpected import: ${id}`)
			return imports[id]
		},
	})
	return exports
}

const win = (Windows = {}, NSWinRT = { toPromise: (op) => op }) => ({
	'@octane-xplat/platform/windows': { Windows, NSWinRT },
})

test('Windows clipboard preserves text, checks format, bridges async results and reports failures', async () => {
	let current = null
	let format = 'Text'
	let flushes = 0
	const api = {
		DataPackage: class {
			SetText(text) {
				this.text = text
			}
		},
		StandardDataFormats: { Text: 'Text' },
		Clipboard: {
			SetContent(value) {
				current = value.text
			},
			Flush() {
				flushes++
			},
			GetContent() {
				return {
					Contains: (value) => value === format,
					GetTextAsync: () => Promise.resolve(current),
				}
			},
		},
	}
	const { clipboard } = load('clipboard', win({ ApplicationModel: { DataTransfer: api } }))
	assert.equal(clipboard.canCopy, true)
	assert.equal(await clipboard.writeText('  copied Ω  '), true)
	assert.equal(flushes, 1)
	assert.equal(await clipboard.read(), '  copied Ω  ')
	format = 'Bitmap'
	assert.equal(await clipboard.readText(), null)
	format = 'Text'
	current = ''
	assert.equal(await clipboard.readText(), null)
	api.Clipboard.GetContent = () => {
		throw new Error('denied')
	}
	api.Clipboard.SetContent = () => {
		throw new Error('busy')
	}
	assert.equal(await clipboard.readText(), null)
	assert.equal(await clipboard.write('retry'), false)
	const { clipboard: absent } = load('clipboard', win())
	assert.equal(absent.canCopy, false)
	assert.equal(await absent.writeText('x'), false)
	assert.equal(await absent.readText(), null)
})

test('Windows random fills only the requested byte range, chunks large buffers and rejects malformed entropy', () => {
	const calls = []
	const api = {
		GenerateRandom(length) {
			calls.push(length)
			return length
		},
		EncodeToHexString(length) {
			return 'a7'.repeat(length)
		},
	}
	const { random } = load(
		'random',
		win({ Security: { Cryptography: { CryptographicBuffer: api } } }),
	)
	assert.equal(random.supported, true)
	const bytes = new Uint8Array(70004)
	const view = new DataView(bytes.buffer, 2, 70000)
	assert.equal(random.fill(view), view)
	assert.deepEqual(calls, [65536, 4464])
	assert.equal(bytes[0], 0)
	assert.equal(bytes[1], 0)
	assert.ok(bytes.subarray(2, 70002).every((byte) => byte === 167))
	assert.equal(bytes[70002], 0)
	assert.equal(bytes[70003], 0)
	assert.throws(() => random.bytes(-1), /non-negative integer/)
	assert.throws(() => random.bytes(1.5), /non-negative integer/)
	assert.throws(() => random.fill({}), /ArrayBufferView/)
	api.EncodeToHexString = () => 'xx'
	assert.throws(() => random.bytes(1), /invalid CryptographicBuffer/)
	const { random: absent } = load('random', win())
	assert.equal(absent.supported, false)
	assert.throws(() => absent.bytes(1), /no OS CSPRNG/)
	assert.equal(absent.bytes(0).length, 0)
})

test('Windows app settings require package identity and preserve the launcher outcome', async () => {
	const urls = []
	let accepted = true
	const Windows = {
		ApplicationModel: { Package: { Current: { Id: { FamilyName: 'sample_123' } } } },
	}
	const { openSettings, openUrl } = load('open-url', {
		...win(Windows),
		'@nativescript/core': {
			Utils: {
				openUrl(url) {
					urls.push(url)
					return accepted
				},
			},
		},
	})
	assert.equal(await openSettings.isAvailable(), true)
	assert.equal(openSettings.open(), true)
	assert.equal(urls[0], 'ms-settings:appsfeatures-app?PFN=sample_123')
	accepted = false
	assert.equal(openSettings.open(), false)
	assert.equal(openUrl('https://example.com'), false)
	Object.defineProperty(Windows.ApplicationModel.Package, 'Current', {
		get() {
			throw new Error('unpackaged')
		},
	})
	assert.equal(openSettings.supported, false)
	assert.equal(await openSettings.isAvailable(), false)
	assert.equal(openSettings.open(), false)
})

test('Windows auth does not load Android and rejects with the capability error', async () => {
	class UnavailabilityError extends Error {}
	const { authSession } = load('auth-session', {
		'@octane-xplat/lib/capability': { UnavailabilityError },
	})
	assert.equal(authSession.supported, false)
	assert.equal(await authSession.isAvailable(), false)
	await assert.rejects(
		authSession.open('https://example.com', { callbackScheme: 'sample' }),
		UnavailabilityError,
	)
})

test('Windows device identity stays Windows regardless of the core OS label', () => {
	const { device } = load('device', {
		'@nativescript/core': {
			Device: {
				os: 'Windows',
				osVersion: '11',
				model: 'Desktop',
				manufacturer: 'Example',
				language: 'en_US',
				region: 'US',
			},
		},
	})
	assert.equal(device.os, 'windows')
	assert.equal(device.osVersion, '11')
	assert.equal(device.language, 'en')
	assert.equal(device.region, 'US')
})

test('Windows preferences retain string semantics without claiming a blocking durable commit', () => {
	const data = new Map()
	const { storage } = load('storage', {
		'@nativescript/core': {
			ApplicationSettings: {
				getString: (key) => data.get(key),
				setString: (key, value) => data.set(key, value),
				remove: (key) => data.delete(key),
				flush: () => {
					throw new Error('must not present the core no-op as a commit')
				},
			},
		},
	})
	assert.equal(storage.getString('missing'), null)
	storage.setString('draft', '')
	assert.equal(storage.getString('draft'), '')
	storage.setString('draft', 'Passport')
	assert.equal(storage.getString('draft'), 'Passport')
	assert.equal(storage.flush(), false)
	storage.remove('draft')
	assert.equal(storage.getString('draft'), null)
})
