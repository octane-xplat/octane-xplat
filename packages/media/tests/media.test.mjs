import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

// Sandbox the nativescript leaf like the photo-capture harness: CJS-transpile
// the source and intercept its module imports with platform mocks.
async function load({ camera = {}, imagePicker = {}, application = {}, globals = {} } = {}) {
	const exports = {}
	const source = await readFile(new URL('../src/media.ts', import.meta.url), 'utf8')
	const modules = {
		'@nativescript/camera': {
			isAvailable: () => true,
			takePicture: async () => ({}),
			...camera,
		},
		'@nativescript/imagepicker': {
			create: () => ({ authorize: async () => true }),
			...imagePicker,
		},
		'@nativescript/core': {
			Application: application,
			File: { fromPath: () => ({ removeSync() {} }) },
			ImageSource: {},
			knownFolders: { temp: () => ({ path: '/tmp' }) },
			path: { join: (...parts) => parts.join('/') },
		},
		'@octane-xplat/platform/android': { android: globals.android },
		'./types': {},
	}

	const context = {
		exports,
		console,
		setTimeout,
		clearTimeout,
		require: (name) => {
			if (!(name in modules)) {
				throw new Error('unexpected import: ' + name)
			}

			return modules[name]
		},
		...globals,
	}

	vm.runInNewContext(ts.transpile(source, { module: ts.ModuleKind.CommonJS }), context)
	return { exports, context }
}

test('photos ensure maps plugin absence to unsupported and keeps denial', async () => {
	const missing = await load({
		imagePicker: {
			create() {
				throw new Error('plugin absent')
			},
		},
	})

	assert.equal((await missing.exports.media.requestPermissions('photos')).status, 'unsupported')

	for (const [authorize, expected] of [
		[async () => true, 'granted'],
		[async () => ({ authorized: true }), 'granted'],
		[async () => ({ authorized: false }), 'denied'],
		[
			async () => {
				throw new Error('bridge down')
			},
			'denied',
		],
	]) {
		const { exports } = await load({ imagePicker: { create: () => ({ authorize }) } })
		assert.equal((await exports.media.requestPermissions('photos')).status, expected)
	}
})

test('ios camera ensure reports unsupported when AVFoundation is not exposed', async () => {
	const { exports } = await load({ application: { ios: {} } })
	assert.equal((await exports.media.requestPermissions('camera')).status, 'unsupported')
})

test('ios camera ensure maps authorization status and the prompt result', async () => {
	for (const [status, expected] of [
		[3, 'granted'],
		[1, 'denied'],
		[2, 'denied'],
	]) {
		const { exports } = await load({
			application: { ios: {} },
			globals: { AVCaptureDevice: { authorizationStatusForMediaType: () => status } },
		})

		assert.equal((await exports.media.requestPermissions('camera')).status, expected)
	}

	const prompted = await load({
		application: { ios: {} },
		globals: {
			AVCaptureDevice: {
				authorizationStatusForMediaType: () => 0,
				requestAccessForMediaTypeCompletionHandler: (_video, reply) => reply(false),
			},
		},
	})

	assert.equal((await prompted.exports.media.requestPermissions('camera')).status, 'denied')
})

function androidApp(requestPermissions) {
	const listeners = new Map()
	return {
		listeners,
		application: {
			android: {
				foregroundActivity: {
					checkSelfPermission: () => 0,
					requestPermissions,
				},
				activityRequestPermissionsEvent: 'perm-result',
				on: (_event, fn) => listeners.set(fn, true),
				off: (_event, fn) => listeners.delete(fn),
			},
		},
		globals: { android: { content: { pm: { PackageManager: { PERMISSION_GRANTED: 1 } } } } },
	}
}

test('android permission request throw settles denied and drops the listener', async () => {
	const app = androidApp(() => {
		throw new Error('Can not perform this action after onSaveInstanceState')
	})

	const { exports } = await load(app)

	assert.equal((await exports.media.requestPermissions('camera')).status, 'denied')
	assert.equal(app.listeners.size, 0)
})

test('android grant result resolves granted and unregisters', async () => {
	let deliver
	const app = androidApp((_perms, code) => {
		deliver = () => {
			for (const fn of app.listeners.keys()) {
				fn({ requestCode: code, grantResults: [1] })
			}
		}
	})

	const { exports } = await load(app)
	const pending = exports.media.requestPermissions('camera')
	deliver()
	assert.equal((await pending).status, 'granted')
	assert.equal(app.listeners.size, 0)
})
