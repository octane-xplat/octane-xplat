import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import http from 'node:http'
import { chromium } from 'playwright'
import ts from 'typescript'

const modules = {
	media: 'media/src/media.web.ts',
	session: 'platform/src/auth-session.web.ts',
	apple: 'auth/src/apple.web.ts',
	google: 'auth/src/google.web.ts',
	audio: 'audio/src/audio.web.ts',
	sounds: 'sounds/src/sounds.web.ts',
	haptics: 'haptics/src/haptics.web.ts',
}

const compiled = Object.fromEntries(
	await Promise.all(
		Object.entries(modules).map(async ([name, file]) => [
			name,
			ts.transpile(await readFile(new URL(`../../../packages/${file}`, import.meta.url), 'utf8'), {
				module: ts.ModuleKind.ESNext,
				target: ts.ScriptTarget.ES2022,
			}),
		]),
	),
)
// Synthetic PCM measures browser playback state, not audible output.
const samples = 80000
const wav = Buffer.alloc(44 + samples * 2)
wav.write('RIFF')
wav.writeUInt32LE(wav.length - 8, 4)
wav.write('WAVEfmt ', 8)
wav.writeUInt32LE(16, 16)
wav.writeUInt16LE(1, 20)
wav.writeUInt16LE(1, 22)
wav.writeUInt32LE(8000, 24)
wav.writeUInt32LE(16000, 28)
wav.writeUInt16LE(2, 32)
wav.writeUInt16LE(16, 34)
wav.write('data', 36)
wav.writeUInt32LE(samples * 2, 40)
for (let i = 0; i < samples; i++) {
	wav.writeInt16LE(Math.round(Math.sin((i * 2 * Math.PI * 220) / 8000) * 1000), 44 + i * 2)
}
const server = http.createServer((request, response) => {
	const name = request.url?.slice(1).replace('.js', '')
	if (request.url === '/tone.wav') {
		response.setHeader('Content-Type', 'audio/wav')
		response.setHeader('Accept-Ranges', 'bytes')
		const range = request.headers.range?.match(/^bytes=(\d+)-(\d*)$/)
		if (range) {
			const start = Number(range[1])
			const end = range[2] ? Math.min(Number(range[2]), wav.length - 1) : wav.length - 1
			response.statusCode = 206
			response.setHeader('Content-Range', `bytes ${start}-${end}/${wav.length}`)
			response.setHeader('Content-Length', end - start + 1)
			response.end(wav.subarray(start, end + 1))
		} else {
			response.setHeader('Content-Length', wav.length)
			response.end(wav)
		}
	} else if (compiled[name]) {
		response.setHeader('Content-Type', 'text/javascript')
		response.end(compiled[name])
	} else {
		response.setHeader('Content-Type', 'text/html')
		response.end('<button id="play">Play probe</button>')
	}
})

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
let browser
try {
	browser = await chromium.launch({ headless: true })
	const page = await browser.newPage()
	await page.goto(`http://127.0.0.1:${server.address().port}`)
	const errors = []
	page.on('pageerror', (error) => errors.push(error.message))
	const fallbacks = await page.evaluate(async () => {
		const [{ authSession }, { appleAuth }, { googleAuth }] = await Promise.all([
			import('/session.js'),
			import('/apple.js'),
			import('/google.js'),
		])
		return {
			hostedSupported: authSession.supported,
			hostedEnsure: await authSession.ensure(),
			apple: (await appleAuth.signIn()).status,
			google: (await googleAuth.signIn()).status,
		}
	})

	assert.equal(fallbacks.hostedSupported, false)
	assert.equal(fallbacks.hostedEnsure, 'unsupported')
	assert.equal(fallbacks.apple, 'error')
	assert.equal(fallbacks.google, 'error')
	const chooser = page.waitForEvent('filechooser')
	await page.evaluate(async () => {
		const { media } = await import('/media.js')
		window.selection = media.pickImage()
	})
	await (
		await chooser
	).setFiles({
		name: 'probe.jpg',
		mimeType: 'image/jpeg',
		buffer: Buffer.from('synthetic file-input payload; never rendered'),
	})
	const selected = await page.evaluate(async () => {
		const ref = await window.selection
		const bytes = await (await fetch(ref.uri)).text()
		URL.revokeObjectURL(ref.uri)
		return { name: ref.name, dataUrl: ref.dataUrl.startsWith('data:image/jpeg;base64,'), bytes }
	})

	assert.equal(selected.name, 'probe.jpg')
	assert.equal(selected.dataUrl, true)
	assert.equal(selected.bytes, 'synthetic file-input payload; never rendered')
	await page.evaluate(async () => {
		window.audioElements = []
		window.effectVoices = []
		window.mediaActions = new Map()
		if (navigator.mediaSession) {
			const register = navigator.mediaSession.setActionHandler.bind(navigator.mediaSession)
			navigator.mediaSession.setActionHandler = (action, handler) => {
				window.mediaActions.set(action, handler)
				register(action, handler)
			}
		}

		const NativeAudio = window.Audio
		window.Audio = function (...args) {
			const audio = new NativeAudio(...args)
			window.audioElements.push(audio)
			const clone = audio.cloneNode.bind(audio)
			audio.cloneNode = () => {
				const voice = clone()
				window.effectVoices.push(voice)
				window.audioElements.push(voice)
				return voice
			}
			return audio
		}

		const [{ createAudioPlayer }, { createSoundBank }] = await Promise.all([
			import('/audio.js'),
			import('/sounds.js'),
		])
		window.player = createAudioPlayer()
		window.bank = createSoundBank({ maxVoices: 1 })
		window.states = []
		window.player.subscribe((snapshot) =>
			window.states.push({
				state: snapshot.state,
				track: snapshot.track?.id,
				time: snapshot.currentTime,
			}),
		)
		await window.player.setQueue([
			{ id: 'one', source: '/tone.wav' },
			{ id: 'two', source: '/tone.wav' },
		])
		await window.bank.load('effect', '/tone.wav')
		document.querySelector('#play').onclick = async () => {
			await window.player.play()
			window.effectPlayed = await window.bank.play('effect', { volume: 0.2 })
		}
	})

	await page.click('#play')
	await page.waitForFunction(
		() => window.effectPlayed === true && window.states.some((s) => s.state === 'playing'),
		null,
		{ timeout: 5000 },
	)
	const effects = await page.evaluate(async () => {
		const before = window.player.snapshot().state
		await window.bank.play('effect')
		await window.bank.play('effect')
		const active = window.effectVoices.filter(
			(voice) => !voice.paused && voice.getAttribute('src'),
		).length
		window.bank.stop()
		const stopped = window.effectVoices.every((voice) => voice.paused)
		return { before, after: window.player.snapshot().state, active, stopped }
	})

	assert.equal(effects.active, 1)
	assert.equal(effects.stopped, true)
	assert.equal(effects.before, 'playing')
	assert.equal(effects.after, 'playing')
	const controls = await page.evaluate(async () => {
		await window.player.pause()
		await new Promise((resolve) => setTimeout(resolve, 50))
		const seeked = new Promise((resolve) =>
			window.audioElements[0].addEventListener('seeked', resolve, { once: true }),
		)
		await window.player.seek(0.2)
		await seeked
		const paused = window.player.snapshot()
		await window.player.play()
		return {
			paused: paused.state,
			time: paused.currentTime,
			capabilities: window.player.capabilities(),
		}
	})

	assert.equal(controls.paused, 'paused')
	assert.ok(controls.time >= 0.19)
	assert.equal(controls.capabilities.backgroundPlayback, false)
	await page.evaluate(() => window.player.seek(9.8))
	await page.waitForFunction(
		() => window.states.some((s) => s.track === 'two' && s.state === 'playing'),
		null,
		{ timeout: 5000 },
	)
	await page.evaluate(() => window.player.seek(9.8))
	await page.waitForFunction(() => window.player.snapshot().state === 'ended', null, {
		timeout: 5000,
	})
	const cleanup = await page.evaluate(() => {
		window.bank.stop()
		window.bank.dispose()
		window.player.dispose()
		return {
			released: window.audioElements.every((audio) => audio.paused && !audio.getAttribute('src')),
			metadataCleared: !navigator.mediaSession || navigator.mediaSession.metadata === null,
			controlsReleased: [...window.mediaActions.values()].every((handler) => handler === null),
		}
	})

	assert.equal(cleanup.released, true)
	assert.equal(cleanup.metadataCleared, true)
	assert.equal(cleanup.controlsReleased, true)
	assert.deepEqual(errors, [])
	console.log(
		JSON.stringify({
			target: 'web',
			fallbacks,
			fileInput: selected.name,
			audio: {
				pause: controls.paused,
				seek: controls.time,
				queueAdvanced: true,
				ended: true,
				effectsPlayed: true,
				voiceCap: effects.active,
				effectsStopped: effects.stopped,
				cleanup,
			},
			limitations: [
				'headless Chromium state only; no audible output or route measurement',
				'unconfigured SDK errors are not provider authentication',
				'no push credentials, hosted ceremony, camera hardware, or physical haptics',
			],
		}),
	)
} finally {
	await browser?.close()
	await new Promise((resolve) => server.close(resolve))
}
