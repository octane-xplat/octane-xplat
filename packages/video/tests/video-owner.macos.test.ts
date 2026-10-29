import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createAppKitVideoOwner, type AppKitVideoNative, type AppKitVideoState } from '../src/video-owner.macos.ts'
import type { VideoProps } from '../src/props.ts'

function native() {
	const calls: any[] = [], value = { status: 'loading', position: 0, duration: 0, playing: false, requestedPlaying: false, seeking: false, message: '' }
	const view: AppKitVideoNative = {
		setSource(source) { calls.push(['source', source]); value.status = source ? 'loading' : 'idle'; value.position = 0; value.duration = 0; value.playing = false; value.requestedPlaying = false },
		setMuted(value) { calls.push(['muted', value]) }, setLooping(value) { calls.push(['loop', value]) }, setFit(value) { calls.push(['fit', value]) },
		play() { calls.push(['play']); value.requestedPlaying = true }, pause() { calls.push(['pause']); value.requestedPlaying = false; value.playing = false },
		seekToMS(ms) { calls.push(['seek', ms]); value.position = ms; value.status = 'ready' }, snapshot() { return JSON.stringify(value) },
		clear() { calls.push(['clear']); value.status = 'idle' }, dispose() { calls.push(['dispose']) },
	}
	return { view, calls, value }
}
function fixture(input: Partial<VideoProps> = {}) {
	let props: VideoProps = { src: '/clip.mp4', ...input }, nextID = 0
	const timers = new Map<number, { callback(): void; delay: number }>(), states: AppKitVideoState[] = [], errors: unknown[] = []
	const owner = createAppKitVideoOwner({ props: () => props, publish: (state) => states.push(state), report: (error) => errors.push(error),
		schedule: (callback, delay) => { const id = ++nextID; timers.set(id, { callback, delay }); return id }, cancel: (id) => { timers.delete(id) },
	})
	const n = native(); owner.attach(n.view)
	const tick = () => { const first = timers.entries().next().value; assert.ok(first, 'expected scheduled video work'); timers.delete(first[0]); first[1].callback() }
	return { owner, n, timers, states, errors, tick, update(next: Partial<VideoProps>) { props = { ...props, ...next }; owner.sync() } }
}

test('source flags land before load, ready is deferred/once and unchanged paused sync does not spin', () => {
	const ready: number[] = [], env = fixture({ muted: true, loop: true, fit: 'cover', onReady: (event) => ready.push(event.duration!) })
	try {
		assert.deepEqual(env.n.calls.slice(0, 4), [['muted', true], ['loop', true], ['fit', 'cover'], ['source', '/clip.mp4']]); assert.deepEqual(ready, [])
		env.n.value.status = 'ready'; env.n.value.duration = 3000; env.tick(); assert.deepEqual(ready, [3000]); assert.equal(env.timers.size, 0)
		for (let i = 0; i < 20; i++) env.owner.sync()
		assert.equal(env.timers.size, 0); assert.equal(env.n.calls.filter(([name]) => name === 'source').length, 1)
		env.n.value.position = 1250; assert.equal(env.owner.handle.currentTime(), 1250); assert.equal(env.owner.handle.duration(), 3000)
	} finally { env.owner.dispose() }
})
test('loading/playing poll at 250ms; a paused ready surface stops and current play/pause callbacks follow intent', () => {
	const changes: boolean[] = [], env = fixture({ onPlayingChange: (value) => changes.push(value) })
	try {
		env.tick(); assert.equal([...env.timers.values()][0].delay, 250)
		env.n.value.status = 'ready'; env.tick(); assert.equal(env.timers.size, 0)
		env.owner.handle.play(); env.n.value.playing = true; env.tick(); assert.equal(env.states.at(-1)!.started, true); assert.equal([...env.timers.values()][0].delay, 250)
		env.owner.handle.pause(); assert.equal([...env.timers.values()][0].delay, 0); env.tick(); assert.equal(env.timers.size, 0); assert.deepEqual(changes, [true, false])
	} finally { env.owner.dispose() }
})
test('ready callback source replacement retires an old ended event and owns subsequent metadata', () => {
	let env: ReturnType<typeof fixture>, ends = 0
	const ready: number[] = []
	env = fixture({ onReady: (event) => { ready.push(event.duration!); if (ready.length === 1) env.update({ src: '/next.mp4' }) }, onEnded: () => ends++ })
	try {
		env.n.value.status = 'ended'; env.n.value.duration = 1000; env.tick(); assert.deepEqual(ready, [1000]); assert.equal(ends, 0)
		env.n.value.status = 'ready'; env.n.value.duration = 2000; env.tick(); assert.deepEqual(ready, [1000, 2000]); assert.equal(ends, 0)
	} finally { env.owner.dispose() }
})
test('current callbacks replace old ones and consumer exceptions do not become playback errors', () => {
	const calls: string[] = [], env = fixture({ autoPlay: true, onReady: () => calls.push('old'), onError: () => calls.push('false error') })
	try {
		env.update({ onReady: () => { calls.push('current'); throw Error('consumer failed') } }); env.n.value.status = 'ready'; env.n.value.playing = true; env.tick()
		assert.deepEqual(calls, ['current']); assert.equal(env.errors.length, 1); assert.equal([...env.timers.values()][0].delay, 250)
	} finally { env.owner.dispose() }
})
test('native failure reports once; explicit play retries while rerenders do not, and source replacement can recover', () => {
	const errors: string[] = [], env = fixture({ onError: (event) => errors.push(event.message!) })
	try {
		env.n.value.status = 'failed'; env.n.value.message = 'private source URI'; env.tick(); if (env.timers.size) env.tick()
		assert.deepEqual(errors, ['Video playback failed']); assert.equal(env.timers.size, 0); env.owner.sync(); assert.equal(env.timers.size, 0)
		env.owner.handle.play(); assert.equal(env.n.calls.filter(([name]) => name === 'source').length, 2); env.n.value.status = 'ready'; env.n.value.playing = true; env.tick()
		env.update({ src: '/recovered.mp4' }); env.n.value.status = 'ready'; env.tick(); assert.equal(errors.length, 1); assert.equal(env.n.calls.filter(([name]) => name === 'source').length, 3)
	} finally { env.owner.dispose() }
})
test('pre-ready seeks keep the last finite millisecond request, mute events are deferred and props reconcile without source reload', () => {
	const muted: boolean[] = [], env = fixture({ onMutedChange: (value) => muted.push(value) })
	try {
		env.owner.handle.seekTo(500); env.owner.handle.seekTo(1250); env.owner.handle.seekTo(Infinity)
		assert.equal(env.n.calls.some(([name]) => name === 'seek'), false)
		env.n.value.status = 'ready'; env.tick(); assert.deepEqual(env.n.calls.filter(([name]) => name === 'seek'), [['seek', 1250]])
		env.owner.toggleMute(); assert.deepEqual(muted, []); env.tick(); assert.deepEqual(muted, [true])
		env.update({ playing: true, muted: false, loop: true, fit: 'fill' }); env.tick(); assert.equal(env.states.at(-1)!.muted, false); assert.equal(env.states.at(-1)!.playing, true)
		assert.equal(env.n.calls.filter(([name]) => name === 'source').length, 1)
	} finally { env.owner.dispose() }
})
test('retired timer callbacks cannot steal a replacement surface timer; disposed handles become inert', () => {
	const env = fixture(), replacement = native(), retired = [...env.timers.values()][0].callback
	env.owner.attach(replacement.view); const timer = [...env.timers.keys()][0]
	retired(); assert.equal(env.timers.has(timer), true); assert.equal(env.n.calls.filter(([name]) => name === 'dispose').length, 1)
	env.owner.dispose(); const count = replacement.calls.length; env.owner.handle.play(); env.owner.handle.pause(); env.owner.handle.seekTo(1000); env.owner.toggleMute()
	assert.equal(replacement.calls.length, count); assert.equal(env.owner.handle.native, null); assert.equal(env.owner.handle.currentTime(), 0); assert.equal(env.timers.size, 0)
})
test('replaying in ready callback retires a stale terminal event and cleanup reentry cannot load a detached new surface', () => {
	let env: ReturnType<typeof fixture>, ends = 0
	env = fixture({ onReady: () => env.owner.handle.play(), onEnded: () => ends++ })
	env.n.value.status = 'ended'; env.tick(); assert.equal(ends, 0)
	const replacement = native(); env.n.view.dispose = () => env.owner.dispose(); env.owner.attach(replacement.view)
	assert.equal(replacement.calls.filter(([name]) => name === 'dispose').length, 1); assert.equal(replacement.calls.some(([name]) => name === 'source'), false); assert.equal(env.timers.size, 0)
})

test('paused error observation is opt-in at one second and installing/removing the current callback updates ownership', () => {
	const errors: string[] = [], env = fixture()
	try {
		env.n.value.status = 'ready'; env.tick(); assert.equal(env.timers.size, 0)
		env.update({ onError: (event) => errors.push(event.message!) }); env.tick(); assert.equal([...env.timers.values()][0].delay, 1000)
		env.update({ onError: undefined }); env.tick(); assert.equal(env.timers.size, 0)
		env.update({ onError: (event) => errors.push(event.message!) }); env.n.value.status = 'failed'; env.tick(); assert.deepEqual(errors, ['Video playback failed'])
	} finally { env.owner.dispose() }
})
