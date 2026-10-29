import type { VideoHandle, VideoProps } from './props'

export interface AppKitVideoNative {
	setSource(source: string): void
	setMuted(value: boolean): void
	setLooping(value: boolean): void
	setFit(value: string): void
	play(): void
	pause(): void
	seekToMS(ms: number): void
	snapshot(): string
	clear(): void
	dispose(): void
}
export interface AppKitVideoState { playing: boolean; started: boolean; position: number; duration: number; muted: boolean }
interface Snapshot { status: 'idle' | 'loading' | 'ready' | 'ended' | 'failed'; position: number; duration: number; playing: boolean; requestedPlaying: boolean; seeking: boolean; message?: string }
type Event = { kind: 'playing'; value: boolean; revision?: number } | { kind: 'muted'; value: boolean } | { kind: 'ready'; duration: number } | { kind: 'ended'; revision: number } | { kind: 'error'; message: string }
const milliseconds = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0

/** One mounted surface owns polling, source generations and current callbacks.
 * Native notifications never call consumer JS; snapshots cross that boundary. */
export function createAppKitVideoOwner(options: {
	props(): VideoProps
	publish(state: AppKitVideoState): void
	schedule?(callback: () => void, ms: number): unknown
	cancel?(timer: any): void
	report?(error: unknown): void
}) {
	const schedule = options.schedule ?? setTimeout, cancel = options.cancel ?? ((timer: unknown) => clearTimeout(timer as ReturnType<typeof setTimeout>))
	const report = options.report ?? ((error: unknown) => console.error('[macos-video] callback failed', error))
	let view: AppKitVideoNative | null = null, disposed = false, generation = 0, source: string | undefined
	let timer: unknown, ready = false, ended = false, failed = false, internalMuted = false
	let appliedPlaying: boolean | undefined, appliedMuted: boolean | undefined, appliedLoop: boolean | undefined, appliedFit: string | undefined
	let observeErrors = false
	let transportRevision = 0, pendingSeek: number | undefined
	let events: Event[] = [], published: AppKitVideoState | undefined
	let state: AppKitVideoState = { playing: false, started: false, position: 0, duration: 0, muted: false }
	const current = (native: AppKitVideoNative | null, own: number) => !disposed && view === native && generation === own && options.props().src === source
	const stop = () => { if (timer !== undefined) cancel(timer); timer = undefined }
	const queue = (delay = 0) => {
		if (disposed || !view) return
		if (timer !== undefined) { if (delay > 0) return; stop() }
		const native = view, own = generation
		timer = schedule(() => { if (!disposed && view === native && generation === own) tick() }, delay)
	}
	const callback = (event: Event) => {
		if (('revision' in event) && event.revision !== undefined && event.revision !== transportRevision) return
		const props = options.props()
		try {
			if (event.kind === 'playing') props.onPlayingChange?.(event.value)
			else if (event.kind === 'muted') props.onMutedChange?.(event.value)
			else if (event.kind === 'ready') props.onReady?.({ duration: event.duration })
			else if (event.kind === 'ended') props.onEnded?.()
			else props.onError?.({ message: event.message })
		} catch (error) { report(error) }
	}
	const read = (native: AppKitVideoNative): Snapshot => {
		const value = JSON.parse(native.snapshot())
		if (!value || !['idle', 'loading', 'ready', 'ended', 'failed'].includes(value.status)) throw Error('Invalid video snapshot')
		return { ...value, position: milliseconds(value.position), duration: milliseconds(value.duration), playing: value.playing === true, requestedPlaying: value.requestedPlaying === true, seeking: value.seeking === true }
	}
	const fail = () => {
		if (failed || !view) return
		const native = view, own = generation
		failed = true; ready = false; state = { ...state, playing: false }
		events.push({ kind: 'error', message: 'Video playback failed' })
		try { native.pause(); if (current(native, own)) native.clear() } catch { /* Keep the original failure. */ }
		if (current(native, own)) queue()
	}
	const drive = (next: boolean) => {
		if (!view || failed || disposed) return
		const native = view, own = generation
		transportRevision++; if (next) ended = false
		if (state.playing !== next) events.push({ kind: 'playing', value: next })
		state = { ...state, playing: next }
		try { if (next) native.play(); else native.pause() } catch { if (current(native, own)) fail() }
		if (current(native, own)) queue()
	}
	function sync() {
		if (!view || disposed) return
		const props = options.props(), native = view
		let changed = false
		if (source !== props.src) {
			stop(); generation++; source = props.src; events = []; ready = false; ended = false; failed = false; pendingSeek = undefined
			state = { playing: false, started: false, position: 0, duration: 0, muted: props.muted ?? internalMuted }
			observeErrors = typeof props.onError === 'function'
			appliedPlaying = props.playing; appliedMuted = props.muted; appliedLoop = props.loop; appliedFit = props.fit
			const own = generation
			try {
				native.setMuted(state.muted); if (!current(native, own)) return
				native.setLooping(Boolean(props.loop)); if (!current(native, own)) return
				native.setFit(props.fit ?? 'contain'); if (!current(native, own)) return
				native.setSource(props.src)
				if (!current(native, own)) return
				if (props.src) drive(props.playing ?? props.autoPlay ?? false)
			} catch { if (current(native, own)) fail() }
			queue(); return
		}
		const own = generation
		if (observeErrors !== (typeof props.onError === 'function')) { observeErrors = typeof props.onError === 'function'; changed = true }
		try {
			if (props.muted !== appliedMuted) { changed = true; appliedMuted = props.muted; state = { ...state, muted: props.muted ?? internalMuted }; native.setMuted(state.muted) }
			if (!current(native, own)) return
			if (props.loop !== appliedLoop) { changed = true; appliedLoop = props.loop; native.setLooping(Boolean(props.loop)) }
			if (!current(native, own)) return
			if (props.fit !== appliedFit) { changed = true; appliedFit = props.fit; native.setFit(props.fit ?? 'contain') }
			if (!current(native, own)) return
			if (props.playing !== appliedPlaying) { changed = true; appliedPlaying = props.playing; if (props.playing !== undefined) drive(props.playing) }
		} catch { if (current(native, own)) fail() }
		if (changed && current(native, own)) queue()
	}
	function tick() {
		timer = undefined
		const native = view, own = generation
		if (!native || disposed) return
		if (!current(native, own)) { sync(); return }
		let next: Snapshot | undefined
		if (!failed) {
			try { next = read(native) } catch { fail() }
			if (!current(native, own)) return
			if (next?.status === 'failed') { fail(); next = undefined }
			if (next) {
				state = { ...state, position: next.position, duration: next.duration, started: state.started || next.playing }
				if (!ready && (next.status === 'ready' || next.status === 'ended')) {
					ready = true
					if (pendingSeek !== undefined) {
						const target = pendingSeek; pendingSeek = undefined
						try { native.seekToMS(target); next = { ...next, status: 'ready', seeking: true } } catch { fail(); next = undefined }
						if (!current(native, own) || !next) return
					}
					events.push({ kind: 'ready', duration: next.duration })
				}
				if (state.playing && !next.requestedPlaying && next.status !== 'loading') { state = { ...state, playing: false }; events.push({ kind: 'playing', value: false, revision: transportRevision }) }
				if (!ended && next.status === 'ended') { ended = true; if (!options.props().loop) events.push({ kind: 'ended', revision: transportRevision }) }
			}
		}
		if (!current(native, own)) return
		if (!published || Object.keys(state).some((key) => state[key as keyof AppKitVideoState] !== published![key as keyof AppKitVideoState])) {
			published = { ...state }; options.publish({ ...state })
		}
		if (!current(native, own)) return
		const pending = events; events = []
		for (const event of pending) { if (!current(native, own)) return; callback(event) }
		if (current(native, own) && !failed) {
			if (next?.status === 'loading' || state.playing || next?.seeking) queue(250)
			else if (next?.status === 'ready' && observeErrors) queue(1000)
		}
	}
	const requestPlayback = (next: boolean) => {
		if (!view || disposed) return
		if (next && failed) source = undefined // An explicit play retries, a rerender does not.
		sync(); drive(next)
	}
	const handle: VideoHandle = {
		play() { requestPlayback(true) }, pause() { requestPlayback(false) },
		seekTo(ms) {
			sync()
			if (!view || disposed || failed || !Number.isFinite(ms)) return
			const native = view, own = generation
			try { transportRevision++; ended = false; if (!ready) pendingSeek = Math.max(0, ms); else native.seekToMS(Math.max(0, ms)); if (current(native, own)) queue() }
			catch { if (current(native, own)) fail() }
		},
		currentTime() { const native = view, own = generation; try { const value = native && current(native, own) ? read(native).position : 0; return current(native, own) ? value : 0 } catch { return 0 } },
		duration() { const native = view, own = generation; try { const value = native && current(native, own) ? read(native).duration : 0; return current(native, own) ? value : 0 } catch { return 0 } },
		get native() { return view },
	}
	return {
		handle, sync,
		attach(native: AppKitVideoNative) {
			if (disposed) { native.dispose(); return }
			const previous = view; view = native; generation++; source = undefined; published = undefined
			stop(); events = []
			try { previous?.dispose() } catch (error) { report(error) }
			if (view === native && !disposed) sync()
		},
		togglePlay() { requestPlayback(!state.playing) },
		toggleMute() {
			sync()
			if (!view || disposed) return
			const native = view, own = generation
			internalMuted = !state.muted; state = { ...state, muted: internalMuted }
			try { native.setMuted(internalMuted); if (current(native, own)) { events.push({ kind: 'muted', value: internalMuted }); queue() } }
			catch { if (current(native, own)) fail() }
		},
		dispose() {
			if (disposed) return
			disposed = true; generation++; const native = view; view = null; stop(); events = []
			try { native?.dispose() } catch (error) { report(error) }
		},
	}
}
