import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createHash } from 'node:crypto'
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	renameSync,
	rmSync,
	writeFileSync,
} from 'node:fs'

import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { zipSync, strToU8 } from 'fflate/browser'
import { createClient } from '../src/client.ts'
import { createUpdates } from '../src/index.web.ts'

const options = { endpoint: 'https://ota.example.test', embeddedVersion: '1.0.0' }
function fixture(t, extra = {}) {
	const root = mkdtempSync(join(tmpdir(), 'xplat-ota-client-'))
	t.after(() => rmSync(root, { recursive: true, force: true }))
	writeFileSync(join(root, 'native.txt'), 'native-binary')
	const archive = zipSync({
		'package.json': strToU8('{"main":"bundle"}'),
		'bundle.mjs': strToU8('globalThis.version = 2'),
		...extra,
	})

	const sha256 = createHash('sha256').update(archive).digest('hex')
	const manifest = {
		version: '2.0.0',
		minNativeVersion: '1.0.0',
		sha256,
		size: archive.length,
		url: `${options.endpoint}/bundles/${sha256}`,
	}

	const storage = {
		exists: (name) => existsSync(join(root, name)),
		read: (name) => readFileSync(join(root, name), 'utf8'),
		write(name, bytes) {
			mkdirSync(dirname(join(root, name)), { recursive: true })
			writeFileSync(join(root, name), bytes)
		},
		remove: (name) => rmSync(join(root, name), { recursive: true, force: true }),
		move: (from, to) => renameSync(join(root, from), join(root, to)),
	}

	const env = {
		platform: 'ios',
		nativeVersion: '1.0.0',
		storage,
		request: async (url) => ({
			status: 200,
			bytes: url.includes('/manifest?')
				? strToU8(
						JSON.stringify({
							...manifest,
							updateAvailable: true,
							channel: 'stable',
							platform: 'ios',
						}),
					)
				: archive,
		}),
	}

	return { root, archive, manifest, env, storage, client: createClient(options, env) }
}

test('checks and stages without touching running bundle; confirmation cannot confirm staged code', async (t) => {
	const f = fixture(t)
	f.storage.write('active/app/bundle.mjs', 'old bundle')
	assert.deepEqual(await f.client.check(), { available: true, manifest: f.manifest })
	await f.client.install(f.manifest)
	assert.equal(f.storage.read('active/app/bundle.mjs'), 'old bundle')
	assert.equal(f.storage.read('next/app/bundle.mjs'), 'globalThis.version = 2')
	f.client.markHealthy()
	assert.deepEqual(f.client.status(), {
		currentVersion: '1.0.0',
		stagedVersion: '2.0.0',
		needsConfirmation: false,
	})

	await assert.rejects(f.client.install(f.manifest), /already staged/)
})

test('corrupted download never reaches staging', async (t) => {
	const f = fixture(t)
	f.env.request = async () => ({ status: 200, bytes: new Uint8Array(f.archive.length) })
	await assert.rejects(f.client.install(f.manifest), /integrity/)
	assert.equal(f.storage.exists('next'), false)
	assert.equal(f.storage.exists('staging'), false)
})

test('rejects traversal, absolute paths, backslashes and case collisions', async (t) => {
	for (const name of ['../escape', '/escape', 'dir\\escape', 'BUNDLE.mjs']) {
		const f = fixture(t, { [name]: strToU8('unsafe') })
		await assert.rejects(f.client.install(f.manifest), /Unsafe path|Duplicate path/)
		assert.equal(f.storage.exists('next'), false)
	}
})

test('caps expanded bytes before writing any archive file', async (t) => {
	const f = fixture(t, { large: new Uint8Array(4096) })
	const client = createClient({ ...options, maxExpandedBytes: 1024 }, f.env)
	await assert.rejects(client.install(f.manifest), /storage limit/)
	assert.equal(f.storage.exists('next'), false)
})

test('requires the real boot entry and a newer-enough native binary', async (t) => {
	const f = fixture(t)
	await assert.rejects(
		f.client.install({ ...f.manifest, minNativeVersion: '1.1.0' }),
		/newer native binary/,
	)

	await assert.rejects(
		f.client.install({ ...f.manifest, url: 'https://other.example/bundle' }),
		/Invalid update manifest/,
	)

	const missing = fixture(t, { 'package.json': strToU8('{"main":"missing"}') })
	await assert.rejects(missing.client.install(missing.manifest), /entry point missing/)
})

test('native guard rejection prevents both automatic and explicit reinstall', async (t) => {
	const f = fixture(t)
	f.storage.write('rejected.txt', f.manifest.sha256)
	assert.deepEqual(await f.client.check(), { available: false, reason: 'rejected' })
	await assert.rejects(f.client.install(f.manifest), /failed a previous boot/)
})

test('confirms only matching running code and schedules rollback without swapping files', (t) => {
	const f = fixture(t)
	f.storage.write('current.json', JSON.stringify(f.manifest))
	f.storage.write('pending.txt', f.manifest.sha256)
	assert.equal(f.client.status().needsConfirmation, true)
	f.client.markHealthy()
	assert.equal(f.storage.exists('pending.txt'), false)
	f.client.rollback()
	assert.equal(f.storage.read('rollback.txt'), '1')
	assert.equal(f.client.status().currentVersion, '2.0.0')
})

test('serializes installation and recovers from failed storage writes', async (t) => {
	const f = fixture(t)
	let complete
	f.env.request = () =>
		new Promise((resolve) => {
			complete = resolve
		})

	const first = f.client.install(f.manifest)
	await assert.rejects(f.client.install(f.manifest), /being installed/)
	complete({ status: 200, bytes: f.archive })
	const original = f.storage.write
	f.storage.write = () => {
		throw new Error('disk full')
	}

	await assert.rejects(first, /disk full/)
	assert.equal(f.storage.exists('next'), false)
	f.storage.write = original
	f.env.request = async () => ({ status: 200, bytes: f.archive })
	await f.client.install(f.manifest)
})

test('missing wiring and malformed manifests fail explicitly', async (t) => {
	const f = fixture(t)
	f.storage.remove('native.txt')
	assert.throws(() => createClient(options, f.env), /boot wiring missing/)
	f.env.request = async () => ({ status: 200, bytes: strToU8('{"updateAvailable":true}') })
	await assert.rejects(f.client.check(), /Invalid update response/)
})

test('unsupported target has identical API and performs no installation', async () => {
	const client = createUpdates(options)
	assert.equal(client.supported, false)
	assert.deepEqual(await client.check(), { available: false, reason: 'unsupported' })
	await assert.rejects(client.install({}), /iOS or Android release build/)
})
