// camera-conformance.linux.js — evaluated inside the packaged WebKitGTK
// webview by the GJS host self-test mechanism. Drives the real shipped
// engine: getUserMedia + MediaRecorder through the host permission flow and
// app-private file storage. Reports per-check over xplatLog and finishes with
// SELFTEST_RESULT. Failure names persist across the same-page reload leg via
// localStorage so the final result covers both legs.
;(async () => {
	const log = (m) => webkit.messageHandlers.xplatLog.postMessage(m)
	const params = new URLSearchParams(location.search)
	const phase = params.get('phase') || 'record'
	const FAILED_KEY = 'xplat.camera.failed'
	const failedNames = () => JSON.parse(localStorage.getItem(FAILED_KEY) || '[]')

	const errors = []
	addEventListener('error', (event) => errors.push(event.message))
	addEventListener('unhandledrejection', (event) => errors.push(String(event.reason)))

	const wait = async (predicate, timeout, label) => {
		const deadline = Date.now() + (timeout ?? 15000)
		let lastError
		while (Date.now() < deadline) {
			try {
				if (await predicate()) {return}
			} catch (e) {
				lastError = e
			}

			await new Promise((resolve) => setTimeout(resolve, 100))
		}

		throw new Error(`timeout waiting for ${label}: ${lastError ?? 'unsettled'}`)
	}

	const check = async (name, fn) => {
		try {
			const value = await fn()
			log(`CHECK ${name}=${typeof value === 'object' ? JSON.stringify(value) : (value ?? 'ok')}`)
		} catch (e) {
			failedNames().push(name)
			localStorage.setItem(FAILED_KEY, JSON.stringify(failedNames()))
			log(`CHECK ${name}!=>${e.message}`)
		}
	}

	const call = (service, method, args) => window.__xplatBridge.call(service, method, args)
	const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
	const finish = () => {
		if (errors.length) {
			failedNames().push(`pageErrors:${errors.join(';')}`)
			localStorage.setItem(FAILED_KEY, JSON.stringify(failedNames()))
		}

		log('SELFTEST_RESULT ' + JSON.stringify({ failed: failedNames() }))
	}

	try {
		await wait(() => window.testReady, 15000, 'harness page')
	} catch {
		failedNames().push('harnessReady')
		finish()
		return
	}

	if (phase === 'deny') {
		// XPLAT_MEDIA_POLICY=deny is a host policy refusal — it reports the
		// shared contract's 'restricted' status.
		await check('deny.query', async () => {
			const status = (await window.session.permissions()).camera
			if (status !== 'restricted') {
				throw new Error(`expected restricted, got ${status}`)
			}

			return status
		})

		await check('deny.request', async () => {
			const status = await window.session.requestPermission('camera')
			if (status !== 'restricted') {
				throw new Error(`expected restricted, got ${status}`)
			}

			return status
		})

		finish()
		return
	}

	if (phase === 'reopen') {
		const output = JSON.parse(decodeURIComponent(params.get('output')))
		await check('reopen.afterRestart', async () => {
			const opened = await window.session.openOutput(output)
			const bytes = await fetch(opened.url).then((r) => r.blob())
			opened.release()
			if (!bytes.size) {throw new Error('reopened movie is empty')}
			return bytes.size
		})

		finish()
		return
	}

	const stored = localStorage.getItem('xplat.camera.output')
	if (stored) {
		// Second leg after the in-page reload: reopen the stored reference
		// through a fresh session without touching the camera.
		await check('reopen.afterReload', async () => {
			window.createTestSession()
			const opened = await window.session.openOutput(JSON.parse(stored))
			const bytes = await fetch(opened.url).then((r) => r.blob())
			opened.release()
			if (!bytes.size) {throw new Error('reopened movie is empty')}
			return bytes.size
		})

		localStorage.removeItem('xplat.camera.output')
		finish()
		return
	}

	await check('permissions.initial', async () => {
		const status = (await window.session.permissions()).camera
		if (status !== 'notDetermined' && status !== 'granted') {
			throw new Error(`unexpected initial status ${status}`)
		}

		return status
	})

	await check('permission.request', async () => {
		const status = await window.session.requestPermission('camera')
		if (status !== 'granted') {throw new Error(`expected granted, got ${status}`)}
		return status
	})

	await check('permission.persistedQuery', async () => {
		const status = (await window.session.permissions()).camera
		if (status !== 'granted') {throw new Error(`expected granted, got ${status}`)}
		return status
	})

	await check('preview.attach', async () => {
		window.attach()
		await wait(() => window.session.snapshot().previewAttached, 5000, 'previewAttached')
		await wait(() => document.querySelector('video').readyState >= 2, 15000, 'preview frames')
		return 'frames'
	})

	let caps
	await check('capabilities', async () => {
		caps = await window.session.capabilities()
		if (!caps.supported) {throw new Error(`unsupported: ${caps.reason}`)}
		if (!caps.available) {throw new Error(`unavailable: ${caps.reason}`)}
		if (caps.output.storage !== 'appPrivateFile') {throw new Error(caps.output.storage)}
		if (!caps.output.destinationFileUrl) {throw new Error('destinationFileUrl false')}
		if (!caps.cameras.length) {throw new Error('no cameras reported')}
		if (!caps.output.mimeType) {throw new Error('no recorder MIME')}
		return {
			mime: caps.output.mimeType,
			container: caps.output.container,
			cameras: caps.cameras.map((c) => c.label),
			audio: caps.audio,
			profiles: caps.profiles,
		}
	})

	// Race the take's own completion so a failed take surfaces its real
	// outcome instead of a bare 'recording' timeout. Short takes (<~1s) may
	// finalize as noMedia on this host — GStreamer needs enough samples for a
	// parseable MP4 — so checks that need a clip give the recorder time.
	const begin = async (options) => {
		const take = window.session.startRecording(options)
		const outcome = await Promise.race([
			take.completion.then(window.serialize),
			wait(() => take.state === 'recording', 12000, 'recording').then(() => null),
		])

		if (outcome) {
			throw new Error(`take ended before recording: ${JSON.stringify(outcome)}`)
		}

		return take
	}

	const record = async (audio = false, ms = 1300) => {
		await window.session.configure({ audio })
		await wait(async () => (await window.session.capabilities()).available, 10000, 'available')
		const take = await begin()
		await sleep(ms)
		return window.serialize(await take.stop())
	}

	let clip
	await check('record.silent', async () => {
		const outcome = await record()
		if (outcome.kind !== 'clip') {throw new Error(JSON.stringify(outcome))}
		if (outcome.clip.hasAudio) {throw new Error('unexpected audio track')}
		if (outcome.partial) {throw new Error('unexpected partial')}
		const output = outcome.clip.output
		if (output.kind !== 'nativeFile' || !output.fileUrl.startsWith('file://')) {
			throw new Error(`output ${JSON.stringify(output)}`)
		}

		if (!(outcome.clip.durationMs > 0) || !(outcome.clip.width > 0)) {
			throw new Error(`no media metadata ${JSON.stringify(outcome.clip)}`)
		}

		clip = outcome.clip
		return {
			mime: outcome.clip.mimeType,
			ms: Math.round(outcome.clip.durationMs),
			size: outcome.clip.width + 'x' + outcome.clip.height,
			output,
		}
	})

	await check('storage.committed', async () => {
		const { info } = await call('camera', 'movieFileInfo', [{ fileUrl: clip.output.fileUrl }])
		if (!info?.exists || !(info.size > 0)) {throw new Error(JSON.stringify(info))}
		return info.size
	})

	await check('record.audio', async () => {
		const status = await window.session.requestPermission('microphone')
		if (status !== 'granted') {
			throw new Error(`microphone ${status}`)
		}

		const outcome = await record(true, 1500)
		await window.session.configure({ audio: false })
		if (outcome.kind !== 'clip') {
			const dumped = await window.dumpLastBlob?.()
			log('DUMP ' + JSON.stringify(dumped))
			throw new Error(JSON.stringify(outcome))
		}

		if (!outcome.clip.hasAudio) {
			throw new Error('finalized movie has no audio track')
		}

		return { mime: outcome.clip.mimeType, audio: outcome.clip.hasAudio }
	})

	await check('record.limit', async () => {
		const take = await begin({ maximumDurationMs: 1500 })
		const outcome = window.serialize(await take.completion)
		if (outcome.kind !== 'clip' || outcome.endReason !== 'maximumDuration') {
			throw new Error(JSON.stringify(outcome))
		}

		if (!(outcome.clip.durationMs > 0)) {
			throw new Error('no duration')
		}

		return outcome.endReason
	})

	await check('record.repeatStop', async () => {
		const take = await begin()
		const first = take.stop()
		const second = take.stop()
		if (first !== second) {
			throw new Error('stop returned a different completion')
		}

		const outcome = window.serialize(await first)
		// An immediate stop may legitimately produce no parseable media; what
		// this check proves is both stops join one completion.
		if (outcome.kind !== 'clip' && outcome.error?.kind !== 'noMedia') {
			throw new Error(JSON.stringify(outcome))
		}

		return outcome.kind
	})

	await check('hidden.interrupt', async () => {
		const take = await begin()
		await sleep(1300)
		Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' })
		document.dispatchEvent(new Event('visibilitychange'))
		const outcome = window.serialize(await take.completion)
		delete document.visibilityState
		document.dispatchEvent(new Event('visibilitychange'))
		if (outcome.kind !== 'clip' || outcome.endReason !== 'backgrounded' || !outcome.partial) {
			throw new Error(JSON.stringify(outcome))
		}

		return { endReason: outcome.endReason, partial: outcome.partial }
	})

	await check('preview.release', async () => {
		const take = await begin()
		await sleep(1300)
		window.detach()
		const outcome = window.serialize(await take.completion)
		if (outcome.kind !== 'clip' || outcome.endReason !== 'previewReleased') {
			throw new Error(JSON.stringify(outcome))
		}

		return outcome.endReason
	})

	await check('destination.fileUrl', async () => {
		window.attach()
		await wait(() => window.session.snapshot().previewAttached, 5000, 'preview reattach')
		await wait(async () => (await window.session.capabilities()).available, 10000, 'available')
		// App-supplied destinations are confined to the app-private data root —
		// the movie directory sits under it, so a sibling name qualifies.
		const { fileUrl: movieDir } = await call('camera', 'movieDirectory', [])
		const root = movieDir.replace(/\/media\/?$/, '')
		const dest = `${root}/custom-${crypto.randomUUID().slice(0, 8)}.mp4`
		const take = await begin({ destinationFileUrl: dest })
		await sleep(1200)
		const outcome = window.serialize(await take.stop())
		if (outcome.kind !== 'clip') {
			throw new Error(JSON.stringify(outcome))
		}

		if (outcome.clip.output.fileUrl !== dest) {
			throw new Error(`committed elsewhere: ${outcome.clip.output.fileUrl}`)
		}

		const { info } = await call('camera', 'movieFileInfo', [{ fileUrl: dest }])
		if (!info?.exists) {
			throw new Error('destination missing after commit')
		}

		// An existing destination rejects the take before capture.
		const refused = window.serialize(
			await window.session.startRecording({ destinationFileUrl: dest }).completion,
		)

		if (refused.kind !== 'failed' || refused.error.kind !== 'destinationUnavailable') {
			throw new Error(JSON.stringify(refused))
		}

		// A destination outside the private root is refused identically.
		const outside = window.serialize(
			await window.session
				.startRecording({ destinationFileUrl: 'file:///tmp/xplat-outside.mp4' })
				.completion,
		)

		if (outside.kind !== 'failed' || outside.error.kind !== 'destinationUnavailable') {
			throw new Error(JSON.stringify(outside))
		}

		await call('camera', 'deleteMovieFile', [{ fileUrl: dest }])
		return 'ok'
	})

	await check('openOutput.fetch', async () => {
		const opened = await window.session.openOutput(clip.output)
		const bytes = await fetch(opened.url).then((r) => r.blob())
		if (!bytes.size) {
			throw new Error('reopened movie is empty')
		}

		// In-webview playback of the file is informative only — decoding needs
		// its own GStreamer plugins, independent of recording support.
		const video = document.createElement('video')
		video.src = opened.url
		video.muted = true
		const played = await new Promise((resolve) => {
			video.onplaying = () => resolve(true)
			video.onerror = () => resolve(false)
			setTimeout(() => resolve(false), 8000)
			video.play().catch(() => resolve(false))
		})

		opened.release()
		log(`NOTE playback=${played}`)
		return bytes.size
	})

	await check('dispose.duringRecord', async () => {
		const take = await begin()
		const disposing = window.session.dispose()
		const outcome = window.serialize(await take.completion)
		await disposing
		// Disposal mid-take may not leave a parseable clip; the contract is the
		// endReason and terminal session state, not the media.
		if (outcome.endReason !== 'disposed') {
			throw new Error(JSON.stringify(outcome))
		}

		if (window.session.snapshot().state !== 'disposed') {
			throw new Error('session not disposed')
		}

		return 'disposed'
	})

	// Persist the first clip for the reload leg (in-page reload) and for the
	// process-restart phase (the runner reads this line for the next launch).
	localStorage.setItem('xplat.camera.output', JSON.stringify(clip.output))
	log('CAMERA_OUTPUT ' + JSON.stringify(clip.output))
	location.reload()
})()
