import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const requireWeb = createRequire(new URL('../../../apps/web/package.json', import.meta.url))
const { chromium } = requireWeb('playwright')
const { createServer } = await import(requireWeb.resolve('vite'))
const root = fileURLToPath(new URL('..', import.meta.url))
const server = await createServer({
	root,
	configFile: `${root}/vite.config.ts`,
	server: { host: '127.0.0.1', port: 0 },
})

await server.listen()
const base = server.resolvedUrls.local[0]
const browser = await chromium.launch({
	args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
})

const context = await browser.newContext({ permissions: ['camera', 'microphone'] })
const page = await context.newPage()
const hostErrors = []
page.on('pageerror', (error) => hostErrors.push(error.message))
try {
	await page.goto(`${base}tests/browser/index.html`)
	await page.waitForFunction(() => window.testReady)
	const retention = await page.evaluate(async () => {
		const caps = await window.session.capabilities()
		return { persisted: await navigator.storage.persisted(), supported: caps.supported }
	})

	assert.equal(retention.supported, true)
	console.log('real host storage retention:', retention)
	// Deterministic retention seam: Chromium automation does not grant persistent storage.
	// MediaRecorder, camera/mic streams, finalized media parsing, and IndexedDB remain real.
	await page.evaluate(() => {
		navigator.storage.persist = async () => true
		navigator.storage.persisted = async () => true
	})

	await page.click('#permission')
	await page.waitForFunction(() => window.permissionResult)
	assert.deepEqual(await page.evaluate(() => window.permissionResult), {
		camera: 'granted',
		microphone: 'granted',
	})

	await page.evaluate(() => window.attach())
	await page.waitForFunction(
		() =>
			window.session.snapshot().previewAttached && document.querySelector('video').readyState >= 2,
	)

	await page.waitForFunction(async () => (await window.session.capabilities()).available)

	const record = async (audio = false, milliseconds = 450) => {
		await page.evaluate(async (audio) => {
			await window.session.configure({ audio })
		}, audio)

		await page.waitForFunction(async () => (await window.session.capabilities()).available)
		await page.evaluate(() => {
			window.take = window.session.startRecording()
		})

		await page.waitForFunction(() => window.take.state === 'recording')
		await page.waitForTimeout(milliseconds)
		return page.evaluate(async () => {
			const first = window.take.stop()
			const second = window.take.stop()
			const result = window.serialize(await first)
			return { result, same: first === second, events: window.events.map((e) => e.type) }
		})
	}

	const silent = await record()
	assert.equal(silent.result.kind, 'clip', JSON.stringify(silent.result))
	assert.equal(silent.same, true)
	assert.equal(silent.result.clip.hasAudio, false)
	assert.match(silent.result.clip.mimeType, /video\/webm.*vp8/)
	assert.ok(silent.result.clip.durationMs > 0)
	assert.ok(silent.events.indexOf('started') < silent.events.indexOf('finished'))
	const output = silent.result.clip.output
	assert.equal(output.retention, 'persistent')
	await page.evaluate(async (output) => {
		const opened = await window.session.openOutput(output)
		const bytes = await fetch(opened.url).then((response) => response.blob())
		if (!bytes.size) {
			throw new Error('Reopened output is empty')
		}

		opened.release()
		await window.session.dispose()
	}, output)

	await page.reload()
	await page.waitForFunction(() => window.testReady)
	assert.ok(
		await page.evaluate(async (output) => {
			const opened = await window.session.openOutput(output)
			const size = (await fetch(opened.url).then((response) => response.blob())).size
			opened.release()
			return size
		}, output),
		'output reopens after page reload through a fresh session',
	)

	const setup = async (config = {}, persistent = true) => {
		await page.evaluate(
			async ({ config, persistent }) => {
				await window.session.dispose()
				navigator.storage.persist = async () => persistent
				navigator.storage.persisted = async () => persistent
				window.createTestSession(config)
			},
			{ config, persistent },
		)

		await page.click('#permission')
		await page.waitForFunction(() => window.permissionResult)
		await page.evaluate(() => window.attach())
		await page.waitForFunction(() => document.querySelector('video').readyState >= 2)
		await page.waitForFunction(
			async () =>
				(await window.session.capabilities()).available === (await navigator.storage.persisted()),
		)
	}

	await setup({ audio: true })
	// Do not configure again: audio access is acquired explicitly, not during start.
	await page.evaluate(() => {
		window.take = window.session.startRecording()
	})

	await page.waitForFunction(() => window.take.state === 'recording')
	await page.waitForTimeout(500)
	const audible = await page.evaluate(() => window.take.stop().then(window.serialize))
	assert.equal(audible.kind, 'clip', JSON.stringify(audible))
	assert.equal(audible.clip.hasAudio, true)
	assert.match(audible.clip.mimeType, /opus/)

	await setup()
	const early = await page.evaluate(() => {
		const take = window.session.startRecording()
		return take.stop().then((outcome) => ({
			...outcome,
			error:
				outcome.kind === 'failed'
					? {
							kind: outcome.error.kind,
							message: outcome.error.message,
							cause: String(outcome.error.cause),
						}
					: undefined,
		}))
	})

	assert.ok(
		early.kind === 'clip' ||
			(early.kind === 'failed' && ['noMedia', 'finalizationFailed'].includes(early.error.kind)),
		JSON.stringify(early),
	)

	await setup()
	await page.evaluate(() => {
		window.take = window.session.startRecording({ maximumDurationMs: 500 })
	})

	await page.waitForFunction(() => window.take.state === 'recording')
	await page.waitForTimeout(350)
	await page.evaluate(() => {
		const until = performance.now() + 800
		while (performance.now() < until) {}
	})

	const limited = await page.evaluate(() => window.take.completion.then(window.serialize))
	assert.equal(limited.kind, 'clip', JSON.stringify(limited))
	assert.equal(limited.endReason, 'maximumDuration')
	assert.ok(
		limited.clip.durationMs > 0,
		'duration comes from finalized media despite delayed timer dispatch',
	)

	const elapsedAtStop = await page.evaluate(
		() =>
			window.events.find((e) => e.type === 'stateChanged' && e.snapshot.state === 'finalizing')
				?.snapshot.attempt.elapsedMs,
	)

	assert.ok(
		elapsedAtStop > 500,
		'best-effort stop timer overshoots when the main thread is blocked',
	)

	console.log('limit evidence:', { elapsedAtStop, mediaDurationMs: limited.clip.durationMs })

	await setup()
	await page.evaluate(() => {
		window.take = window.session.startRecording()
	})

	await page.waitForFunction(() => window.take.state === 'recording')
	await page.waitForTimeout(250)
	const hidden = await page.evaluate(async () => {
		Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' })
		document.dispatchEvent(new Event('visibilitychange'))
		return window.take.completion.then(window.serialize)
	})

	assert.equal(hidden.kind, 'clip', JSON.stringify(hidden))
	assert.equal(hidden.endReason, 'backgrounded')
	assert.equal(hidden.partial, true)
	await page.evaluate(() => {
		delete document.visibilityState
		document.dispatchEvent(new Event('visibilitychange'))
	})

	await setup({}, false)
	const refused = await page.evaluate(() => {
		try {
			window.session.startRecording()
			return null
		} catch (error) {
			return error.kind
		}
	})

	assert.equal(
		refused,
		'destinationUnavailable',
		'persistent retention failure rejects before admission',
	)

	assert.equal(await page.evaluate(() => window.session.snapshot().attempt), undefined)

	await setup()
	await page.evaluate(() => {
		window.originalPut = IDBObjectStore.prototype.put
		IDBObjectStore.prototype.put = function () {
			throw new DOMException('Quota test', 'QuotaExceededError')
		}

		window.take = window.session.startRecording()
	})

	await page.waitForFunction(() => window.take.state === 'recording')
	await page.waitForTimeout(250)
	const quota = await page.evaluate(() => window.take.stop().then(window.serialize))
	assert.equal(quota.kind, 'failed', JSON.stringify(quota))
	assert.equal(quota.stage, 'storage')
	assert.equal(quota.error.kind, 'insufficientStorage')
	await page.evaluate(() => {
		IDBObjectStore.prototype.put = window.originalPut
	})

	await setup()
	await page.evaluate(() => {
		window.take = window.session.startRecording()
	})

	await page.waitForFunction(() => window.take.state === 'recording')
	await page.waitForTimeout(250)
	const disposal = await page.evaluate(async () => {
		const disposing = window.session.dispose()
		const outcome = await window.take.completion
		await disposing
		return { outcome, state: window.session.snapshot().state }
	})

	assert.equal(disposal.outcome.kind, 'clip', JSON.stringify(disposal.outcome))
	assert.equal(disposal.outcome.endReason, 'disposed')
	assert.equal(disposal.state, 'disposed')
	assert.deepEqual(hostErrors, [])
	console.log(
		'camera web conformance: real Chromium MediaRecorder/WebM VP8+Opus, silent/audio, repeated and early stop, limit overshoot, hidden-page notification, quota failure, retention rejection, disposal, IndexedDB reopening after reload passed; persistent grant and visibility are injected seams',
	)
} finally {
	await browser.close()
	await server.close()
}
