import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

async function load(name, globals) {
	const source = await readFile(new URL(`../src/${name}.ts`, import.meta.url), 'utf8')
	const exports = {}
	vm.runInNewContext(
		ts.transpile(source, { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }),
		{ exports, ...globals },
	)

	return exports.media
}

test('web failed batch and capture ref creation revoke the allocated object URLs', async () => {
	const created = []
	const revoked = []
	let input
	const media = await load('media.web', {
		document: { createElement: () => (input = { click() {} }) },
		navigator: {},
		URL: {
			createObjectURL(file) {
				if (file.bad) {
					throw new Error('preview failed')
				}

				created.push(file)
				return 'blob:test'
			},
			revokeObjectURL(url) {
				revoked.push(url)
			},
		},
	})

	let pending = media.pickImages()
	input.files = [{ name: 'one.jpg' }, { name: 'two.jpg', bad: true }]
	input.onchange()
	await assert.rejects(pending)
	assert.equal(created.length, 1)
	assert.equal(revoked.length, 1)
	pending = media.capturePhoto()
	input.files = [{ name: 'bad.jpg', bad: true }]
	input.onchange()
	assert.equal(await pending, null)
	assert.equal(revoked.length, 1)
})

test('native failed conversion removes the JPEG created by the current selection', async () => {
	const removed = []
	const core = {
		Application: { ios: false },
		File: { fromPath: (uri) => ({ removeSync: () => removed.push(uri) }) },
		knownFolders: { temp: () => ({ path: '/temp' }) },
		path: { join: (...args) => args.join('/') },
		ImageSource: {
			fromAsset: async () => ({
				saveToFileAsync: async () => {
					throw new Error('conversion failed')
				},
			}),
		},
	}

	const media = await load('media', {
		require(name) {
			if (name === '@nativescript/core') {
				return core
			}

			if (name === '@nativescript/camera') {
				return {}
			}

			return {
				create: () => ({ authorize: async () => true, present: async () => [{ asset: {} }] }),
			}
		},
	})

	await assert.rejects(media.pickImage(), /conversion failed/)
	assert.equal(removed.length, 1)
	assert.match(removed[0], /^\/temp\/octane-image-.*\.jpg$/)
})
