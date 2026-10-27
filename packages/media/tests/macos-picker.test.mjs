import assert from 'node:assert/strict'
import test from 'node:test'
import { createDriver } from './fixtures/macos-driver.mjs'

const driver = (options) =>
	createDriver({
		mediaRoot: process.env.XPLAT_MEDIA_TEST_PACKAGE,
		filesRoot: process.env.XPLAT_FILES_TEST_PACKAGE,
		...options,
	})

const copy = (value) => JSON.parse(JSON.stringify(value))
const outputs = (d) => [...d.disk.keys()].filter((path) => path.startsWith('/temp/'))

test('macOS cancellation returns null/[] and allocates no output or source access', async () => {
	const d = driver()
	d.selections.push({ cancel: true }, { cancel: true })
	assert.equal(await d.media.pickImage(), null)
	assert.deepEqual(copy(await d.media.pickImages()), [])
	assert.deepEqual(d.events, [])
	assert.equal(d.panels[0].allowsMultipleSelection, false)
	assert.equal(d.panels[1].allowsMultipleSelection, true)
})

test('macOS empty successful panels return null/[]', async () => {
	const d = driver()
	d.selections.push({ urls: [] }, { urls: [] })
	assert.equal(await d.media.pickImage(), null)
	assert.deepEqual(copy(await d.media.pickImages()), [])
	assert.deepEqual(d.events, [])
})

test('single selection returns a readable app-owned JPEG before source release', async () => {
	const d = driver()
	const selected = d.source('my holiday.heic')
	d.selections.push({ urls: [selected] })
	const result = await d.media.pickImage()
	assert.deepEqual(copy(result), {
		name: 'my holiday.heic',
		uri: '/temp/octane-image-1.jpg',
	})

	assert.deepEqual(
		d.events.map(([event]) => event),
		['start', 'read-source', 'write', 'read-output', 'stop'],
	)

	assert.equal(d.disk.get(result.uri).width, 1200)
	assert.equal(d.disk.get(result.uri).height, 800)
	assert.equal(d.panels[0].canChooseFiles, true)
	assert.equal(d.panels[0].canChooseDirectories, false)
	assert.deepEqual(d.panels[0].allowedFileTypes, d.host.NSBitmapImageRep.imageTypes)
	assert.equal((await d.media.requestPermissions('photos')).status, 'unsupported')
	assert.equal((await d.media.requestPermissions('camera')).status, 'unsupported')
	assert.equal(selected.active, false)
	d.files.release(result)
	d.files.release(result)
	assert.deepEqual(outputs(d), [])
	assert.ok(d.disk.has(selected.path), 'release preserves originals')
})

test('multiple selection preserves order, dimensions and each original name', async () => {
	const d = driver()
	const selected = [
		d.source('portrait.png', { width: 640, height: 960 }),
		d.source('wide.jpg', { width: 2048, height: 512 }),
	]

	d.selections.push({ urls: selected })
	const results = await d.media.pickImages()
	assert.deepEqual(copy(results.map((r) => r.name)), ['portrait.png', 'wide.jpg'])
	assert.deepEqual(copy(results.map((r) => [d.disk.get(r.uri).width, d.disk.get(r.uri).height])), [
		[640, 960],
		[2048, 512],
	])

	assert.equal(new Set(results.map((r) => r.uri)).size, 2)
	for (const result of results) {
		d.files.release(result)
	}

	assert.deepEqual(outputs(d), [])
	assert.ok(selected.every((url) => d.disk.has(url.path) && !url.active))
})

test('repeated selections use distinct outputs; cancellation and failed later batches preserve prior picks', async () => {
	const d = driver()
	const selected = d.source()
	d.selections.push(
		{ urls: [selected] },
		{ urls: [selected] },
		{ cancel: true },
		{ urls: [selected, d.source('broken.png', { invalid: true })] },
	)

	const first = await d.media.pickImage()
	const second = await d.media.pickImage()
	assert.notEqual(first.uri, second.uri)
	assert.equal(await d.media.pickImage(), null)
	await assert.rejects(d.media.pickImages(), /Could not decode/)
	assert.deepEqual(outputs(d), [first.uri, second.uri])
	d.files.release(first)
	assert.ok(d.disk.has(second.uri))
	d.files.release(second)
	assert.deepEqual(outputs(d), [])
})

for (const [name, properties, error] of [
	['unreadable source', { unreadable: true }, /Could not decode/],
	['invalid bytes', { invalid: true }, /Could not decode/],
	['empty dimensions', { width: 0 }, /Could not decode/],
	['conversion failure', { conversionFailure: true }, /Could not convert/],
	['conversion exception', { conversionThrow: true }, /conversion threw/],
]) {
	test(`macOS ${name} rejects, releases source access and leaves originals intact`, async () => {
		const d = driver()
		const selected = d.source('bad.png', properties)
		d.selections.push({ urls: [selected] })
		await assert.rejects(d.media.pickImage(), error)
		assert.deepEqual(outputs(d), [])
		assert.ok(d.disk.has(selected.path))
		assert.equal(selected.active, false)
		assert.equal(d.events.at(-1)[0], 'stop')
	})
}

for (const [name, options, error] of [
	['partial write', { writeFailure: 2 }, /Could not save/],
	['write exception', { writeThrow: 2 }, /write threw/],
	['readback failure', { readFailure: true }, /Could not read/],
]) {
	test(`macOS ${name} cleans every output in the failed batch`, async () => {
		const d = driver(options)
		const selected = [d.source('first.png'), d.source('second.png')]
		d.selections.push({ urls: selected })
		await assert.rejects(d.media.pickImages(), error)
		assert.deepEqual(outputs(d), [])
		assert.equal(d.host.__xplatTemporaryFiles.size, 0)
		assert.ok(selected.every((url) => d.disk.has(url.path) && !url.active))
	})
}

test('macOS unscoped file URLs are readable without an unmatched stop call', async () => {
	const d = driver()
	d.selections.push({ urls: [d.source('direct.png', { scoped: false })] })
	const result = await d.media.pickImage()
	assert.ok(result)
	assert.equal(
		d.events.some(([event]) => event === 'stop'),
		false,
	)

	d.files.release(result)
})

test('macOS path collision never overwrites or deletes existing output', async () => {
	const d = driver()
	const existing = { marker: 'unrelated' }
	d.disk.set('/temp/octane-image-1.jpg', existing)
	d.selections.push({ urls: [d.source()] })
	await assert.rejects(d.media.pickImage(), /already exists/)
	assert.equal(d.disk.get('/temp/octane-image-1.jpg'), existing)
	assert.equal(
		d.events.some(([event]) => event === 'write' || event === 'remove'),
		false,
	)
})

test('macOS cleanup failures are reported and all batch outputs are attempted', async () => {
	const d = driver({ writeFailure: 2, cleanupFailure: true })
	d.selections.push({ urls: [d.source('first.png'), d.source('second.png')] })
	await assert.rejects(d.media.pickImages(), (error) => {
		assert.match(error.message, /temporary cleanup failed/)
		assert.equal(error.errors.length, 3)
		return true
	})

	assert.equal(d.events.filter(([event]) => event === 'remove').length, 2)
	assert.equal(d.host.__xplatTemporaryFiles.size, 2, 'failed cleanup retains ownership for retry')
})

test('files.release never removes an unregistered original and retains ownership on deletion failure', async () => {
	const d = driver({ cleanupFailure: true })
	const original = d.source()
	d.files.release({ name: original.lastPathComponent, uri: original.path })
	assert.ok(d.disk.has(original.path))
	d.selections.push({ urls: [original] })
	const result = await d.media.pickImage()
	// Best-effort cleanup: a failed delete stays registered for a later retry
	// instead of throwing from a void cleanup API.
	assert.doesNotThrow(() => d.files.release(result))
	assert.ok(d.disk.has(result.uri))
	assert.ok(d.host.__xplatTemporaryFiles.has(result.uri))
})

test('macOS public import remains safe without AppKit; picker reports unavailable', async () => {
	const d = driver()
	delete d.host.NSOpenPanel
	await assert.rejects(d.media.pickImage(), /NSOpenPanel is unavailable/)
	assert.equal(await d.media.capturePhoto(), null)
})
