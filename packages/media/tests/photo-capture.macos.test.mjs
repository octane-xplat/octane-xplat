import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'
import { UnavailabilityError } from '@octane-xplat/lib/capability'

const requireShim = (id, context) => {
	if (id === '@octane-xplat/lib/capability') {
		return { UnavailabilityError }
	}
	const leaf = /^\.(\/file-pick-filter\.macos|\/file-types\.macos|\/file-bytes)$/.exec(id)
	if (leaf) {
		const parentExports = context.exports
		context.exports = {}
		try {
			const source = readFileSync(
				new URL(`../../files/src${leaf[1]}.ts`, import.meta.url),
				'utf8',
			)
			vm.runInContext(ts.transpile(source, { module: ts.ModuleKind.CommonJS }), context)
			return context.exports
		} finally {
			context.exports = parentExports
		}
	}
	throw new Error(`unexpected require: ${id}`)
}

async function load(overrides = {}) {
	const events = []
	const hosts = []
	const exports = {}
	const source = await readFile(new URL('../src/photo-capture.macos.ts', import.meta.url), 'utf8')
	const context = {
		exports,
		setTimeout,
		clearTimeout,
		NSFileManager: {
			defaultManager: {
				temporaryDirectory: { path: '/temp' },
			},
		},
		XplatPhotoCaptureSheet: {
			alloc: () => ({
				init() {
					const host = {
						permissionStatus() {
							return 'notDetermined'
						},
						requestPermissionReply(reply) {
							events.push('camera permission')
							reply('granted')
						},
						presentReply(options, reply) {
							events.push('present')
							this.reply = reply
						},
						dispose() {
							events.push('dispose')
						},
						discard(uri) {
							events.push(`discard ${uri}`)
						},
						...overrides,
					}

					hosts.push(host)
					return host
				},
			}),
		},
	}

	vm.runInNewContext(ts.transpile(source, { module: ts.ModuleKind.CommonJS }), context)
	return { ...exports, events, hosts, context }
}

const image = {
	name: 'shot.jpg',
	uri: '/temp/octane-capture-1.jpg',
	// The sheet reply still carries the data payload; the leaf strips it —
	// the public ref is the file handle only.
	dataUrl: 'data:image/jpeg;base64,AA',
}

const imageRef = { name: image.name, uri: image.uri }

test('import is passive; the first capture allocates the sheet', async () => {
	const api = await load()
	assert.deepEqual(api.events, [])
	const pending = api.capturePhoto()
	assert.deepEqual(api.events, ['present'])
	api.hosts[0].reply(null)
	assert.equal(await pending, null)
})

test('saveToGallery requests an add-only Photos write for the captured file', async () => {
	const api = await load()
	const saves = []
	api.context.PHAccessLevelAddOnly = 1
	api.context.NSURL = { fileURLWithPath: (path) => ({ path }) }
	api.context.PHPhotoLibrary = {
		sharedPhotoLibrary: () => ({
			performChangesCompletionHandler: (change, reply) => {
				change()
				reply(true, null)
			},
		}),
		authorizationStatusForAccessLevel: (level) => {
			saves.push(level)
			return 3
		},
	}
	api.context.PHAssetChangeRequest = {
		creationRequestForAssetFromImageAtFileURL: (url) => saves.push(url),
	}
	const pending = api.capturePhoto({ saveToGallery: true })
	api.hosts[0].reply(JSON.stringify(image))
	assert.deepEqual(JSON.parse(JSON.stringify(await pending)), imageRef)
	assert.equal(saves[0], 1)
	assert.deepEqual(saves[1], { path: image.uri })
})

test('cancel, denied, missing camera and failure retain null; a retry is admitted', async () => {
	for (const reason of ['cancel', 'denied', 'no camera', 'busy timeout', 'close', 'disposed']) {
		const api = await load()
		const pending = api.capturePhoto()
		assert.deepEqual(api.events, ['present'], reason)
		api.hosts[0].reply(null)
		assert.equal(await pending, null, reason)
		assert.deepEqual(api.events, ['present', 'dispose'])
		const retry = api.capturePhoto()
		api.hosts[1].reply(null)
		assert.equal(await retry, null)
	}
})

test('overlap does not steal ownership; completion disposes and returns JPEG reference', async () => {
	const api = await load()
	const options = { width: 800, height: 600, saveToGallery: false }
	const pending = api.capturePhoto(options)
	assert.equal(await api.capturePhoto(), null)
	assert.equal(api.hosts.length, 1)
	api.hosts[0].reply(JSON.stringify(image))
	assert.deepEqual(JSON.parse(JSON.stringify(await pending)), imageRef)
	assert.deepEqual(api.events, ['present', 'dispose'])
	assert.equal(api.context.__xplatTemporaryFiles.has(image.uri), true)
	api.hosts[0].reply(JSON.stringify(image))
	assert.deepEqual(api.events, ['present', 'dispose'])
})

test('late result after cancel is discarded and cannot settle or reopen a newer sheet', async () => {
	const api = await load()
	const pending = api.capturePhoto()
	api.hosts[0].reply(null)
	assert.equal(await pending, null)
	const retry = api.capturePhoto()
	api.hosts[0].reply(JSON.stringify(image))
	assert.equal(api.hosts.length, 2)
	assert.deepEqual(api.events, [
		'present',
		'dispose',
		'present',
		'discard /temp/octane-capture-1.jpg',
	])

	api.hosts[1].reply(null)
	assert.equal(await retry, null)
})

test('launch throw and malformed host result release the active slot', async () => {
	const api = await load({
		presentReply() {
			throw new Error('host unavailable')
		},
	})

	assert.equal(await api.capturePhoto(), null)
	assert.deepEqual(api.events, ['dispose'])
	const malformed = await load()
	const pending = malformed.capturePhoto()
	malformed.hosts[0].reply('broken json')
	assert.equal(await pending, null)
	assert.deepEqual(malformed.events, ['present', 'dispose'])
})

test('ensure queries permission without prompting, including before the first capture', async () => {
	for (const [status, expected] of [
		['granted', 'granted'],
		['denied', 'denied'],
		['restricted', 'denied'],
		['undeclared', 'unsupported'],
		['notDetermined', 'unsupported'],
		['unknown', 'unsupported'],
	]) {
		const api = await load({
			permissionStatus() {
				return status
			},
		})

		assert.equal(await api.ensureCamera(), expected)
		assert.deepEqual(api.events, ['dispose'])
	}
})

test('successful shots participate in the AppKit files.release ownership registry', async () => {
	const api = await load()
	const pending = api.capturePhoto()
	api.hosts[0].reply(JSON.stringify(image))
	const result = await pending
	const removed = []
	api.context.NSFileManager = {
		defaultManager: {
			fileExistsAtPath: () => true,
			removeItemAtPathError(uri) {
				removed.push(uri)
				return true
			},
		},
	}

	api.context.exports = {}
	api.context.require = (id) => requireShim(id, api.context)
	const source = await readFile(new URL('../../files/src/files.macos.ts', import.meta.url), 'utf8')
	vm.runInNewContext(ts.transpile(source, { module: ts.ModuleKind.CommonJS }), api.context)
	api.context.exports.files.release(result)
	assert.deepEqual(removed, [image.uri])
	assert.equal(api.context.__xplatTemporaryFiles.size, 0)
	api.context.exports.files.release(result)
	assert.deepEqual(removed, [image.uri])
})

test('a host uri outside the temp captures prefix resolves but never registers', async () => {
	const api = await load()
	const pending = api.capturePhoto()
	const foreign = {
		name: 'shot.jpg',
		uri: '/Users/shared/keep.jpg',
		dataUrl: 'data:image/jpeg;base64,AA',
	}

	const foreignRef = { name: foreign.name, uri: foreign.uri }

	api.hosts[0].reply(JSON.stringify(foreign))
	assert.deepEqual(JSON.parse(JSON.stringify(await pending)), foreignRef)
	assert.equal(api.context.__xplatTemporaryFiles?.has(foreign.uri) ?? false, false)

	const stray = { ...foreign, uri: '/temp/shot.jpg' }

	const wrongName = await load()
	const pending2 = wrongName.capturePhoto()
	wrongName.hosts[0].reply(JSON.stringify(stray))
	assert.ok(await pending2)
	assert.equal(wrongName.context.__xplatTemporaryFiles?.has(stray.uri) ?? false, false)
})
