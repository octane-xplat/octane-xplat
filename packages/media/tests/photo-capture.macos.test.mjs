import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

async function load(overrides = {}) {
	const events = []
	const hosts = []
	const exports = {}
	const source = await readFile(new URL('../src/photo-capture.macos.ts', import.meta.url), 'utf8')
	const context = {
		exports,
		setTimeout,
		clearTimeout,
		XplatPhotoCaptureSheet: {
			alloc: () => ({
				init() {
					const host = {
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

const image = { name: 'shot.jpg', uri: '/temp/shot.jpg', dataUrl: 'data:image/jpeg;base64,AA' }

test('import is passive; gallery save rejects before allocation, permission or UI', async () => {
	const api = await load()
	assert.deepEqual(api.events, [])
	await assert.rejects(api.capturePhoto({ saveToGallery: true }), /unsupported.*saveToGallery/)
	assert.equal(api.hosts.length, 0)
	assert.deepEqual(api.events, [])
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
	assert.deepEqual(JSON.parse(JSON.stringify(await pending)), image)
	assert.deepEqual(api.events, ['present', 'dispose'])
	assert.equal(api.context.__xplatMediaTemporaryFiles.has(image.uri), true)
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
	assert.deepEqual(api.events, ['present', 'dispose', 'present', 'discard /temp/shot.jpg'])
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

test('explicit ensure requests camera only and always disposes its helper', async () => {
	const api = await load()
	assert.equal(await api.ensureCamera(), 'granted')
	assert.deepEqual(api.events, ['camera permission', 'dispose'])
	for (const [status, expected] of [
		['denied', 'denied'],
		['restricted', 'denied'],
		['undeclared', 'unsupported'],
	]) {
		const other = await load({
			requestPermissionReply(reply) {
				reply(status)
			},
		})

		assert.equal(await other.ensureCamera(), expected)
		assert.deepEqual(other.events, ['dispose'])
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
	const source = await readFile(new URL('../../files/src/files.macos.ts', import.meta.url), 'utf8')
	vm.runInNewContext(ts.transpile(source, { module: ts.ModuleKind.CommonJS }), api.context)
	api.context.exports.files.release(result)
	assert.deepEqual(removed, [image.uri])
	assert.equal(api.context.__xplatMediaTemporaryFiles.size, 0)
	api.context.exports.files.release(result)
	assert.deepEqual(removed, [image.uri])
})
