import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const code = ts.transpileModule(
	readFileSync(new URL('../src/app-info.windows.ts', import.meta.url), 'utf8'),
	{ compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText

function load(Windows) {
	const exports = {}
	vm.runInNewContext(code, {
		exports,
		require(id) {
			assert.equal(id, '@octane-xplat/platform/windows')
			return { Windows }
		},
	})
	return exports.appInfo
}

const identity = () => ({
	Name: 'org.octane.windows61',
	Version: { Major: 2, Minor: 5, Build: 13, Revision: 7 },
})

const snapshot = (info) => ({ ...info })

test('Windows app info preserves package identity and every package-version component', () => {
	const id = identity()
	const info = load({ ApplicationModel: { Package: { Current: { Id: id } } } })
	assert.deepEqual(snapshot(info), {
		supported: true,
		version: '2.5.13.7',
		build: '13',
		bundleId: id.Name,
	})
	id.Version = { Major: 0, Minor: 65535, Build: 0, Revision: 65535 }
	assert.equal(info.version, '0.65535.0.65535')
	assert.equal(info.build, '0')
})

test('Windows app info does not read package identity during module evaluation or cache failure', () => {
	let reads = 0
	let ready = false
	const info = load({
		ApplicationModel: {
			Package: {
				get Current() {
					reads++
					if (!ready) {
						throw new Error('host not ready')
					}
					return { Id: identity() }
				},
			},
		},
	})
	assert.equal(reads, 0)
	assert.equal(info.supported, false)
	ready = true
	assert.equal(info.supported, true)
	assert.equal(info.version, '2.5.13.7')
	ready = false
	assert.equal(info.bundleId, null)
})

test('Windows app info reports absent, unpackaged and malformed identities without leaking errors', () => {
	const unavailable = { supported: false, version: null, build: null, bundleId: null }
	for (const Windows of [
		undefined,
		{},
		{
			ApplicationModel: {
				Package: {
					get Current() {
						throw new Error('private native details')
					},
				},
			},
		},
	]) {
		assert.deepEqual(snapshot(load(Windows)), unavailable)
	}
	for (const Name of [undefined, null, '', '  ', 123, {}]) {
		assert.deepEqual(
			snapshot(load({ ApplicationModel: { Package: { Current: { Id: { Name } } } } })),
			unavailable,
		)
	}
})

test('Windows app info retains usable identity when version fields cannot be trusted', () => {
	const id = identity()
	const info = load({ ApplicationModel: { Package: { Current: { Id: id } } } })
	for (const field of ['Major', 'Minor', 'Build', 'Revision']) {
		for (const value of [undefined, null, -1, 65536, 1.5, NaN, Infinity, '1']) {
			id.Version = { ...identity().Version, [field]: value }
			assert.equal(info.supported, true)
			assert.equal(info.bundleId, id.Name)
			assert.equal(info.version, null)
			assert.equal(info.build, null)
		}
	}
	Object.defineProperty(id, 'Version', {
		get() {
			throw new Error('unavailable projection')
		},
	})
	assert.equal(info.supported, true)
	assert.equal(info.version, null)
	assert.equal(info.build, null)
})
