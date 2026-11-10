import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, test } from 'node:test'
import { pathToFileURL } from 'node:url'

// Drives the installed @nstudio/nativescript-exoplayer Android source through
// the listener contract ExoPlayer delivers: playbackStart must be emitted once
// per source from actual playback (isPlaying), never from a play request
// (playWhenReady) or a timer. This pins the scoped 6.2.0 repair carried in
// packages/cli/patches — it fails on the unpatched upstream file and on any
// regression that emits from onPlayWhenReadyChanged. It does not qualify
// NativeScript's runtime proxy delivery; that stays with the native probe.

const require = createRequire(new URL('../package.json', import.meta.url))
const installed = require.resolve('@nstudio/nativescript-exoplayer/index.android.js')

const directory = mkdtempSync(join(tmpdir(), 'xplat-video-exoplayer-'))
after(() => rmSync(directory, { recursive: true, force: true }))

const support = join(directory, 'support.mjs')
writeFileSync(
  support,
  `
export const emitted=[]
const listeners=[]
export class Video {
	static finishedEvent='finished'
	static playbackReadyEvent='playbackReady'
	static playbackStartEvent='playbackStart'
	static seekToTimeCompleteEvent='seekToTimeComplete'
	static currentTimeUpdatedEvent='currentTimeUpdated'
	static chaptersLoadedEvent='chaptersLoaded'
	constructor() {
		this.__emitted=emitted
		this.__notifications=[]
	}
	_emit(name) {
		emitted.push(name)
	}
	notify(payload) {
		this.__notifications.push(payload)
	}
}
export const VideoFill={default:0,aspect:1,aspectFill:2,fill:3}
export const videoSourceProperty={setNative:Symbol('videoSourceProperty.setNative')}
export const subtitleSourceProperty={setNative:Symbol('subtitleSourceProperty.setNative')}
export const Application={suspendEvent:'suspend',resumeEvent:'resume',on(){},off(){}}
export const Utils={ad:{getApplicationContext:()=>({getPackageName:()=>'probe'})}}

// The plugin holds its owner through WeakRef.get(), the NativeScript polyfill
// contract; Node's native WeakRef exposes deref() instead.
globalThis.WeakRef=class {
	constructor(target){this.target=target}
	get(){return this.target}
	deref(){return this.target}
	clear(){this.target=undefined}
}

const audio={requestAudioFocus(){},abandonAudioFocus(){},abandonAudioFocusRequest(){}}
const Player={
	STATE_IDLE:1,STATE_BUFFERING:2,STATE_READY:3,STATE_ENDED:4,
	Listener:class {
		constructor(impl){listeners.push(impl)}
	},
}
globalThis.__listenerImpls=listeners
globalThis.com={google:{android:{exoplayer2:{
	Player,
	DefaultLoadControl:class{},
	DefaultTrackSelector:class{constructor(){}},
	ExoPlayer:{Builder:class{}},
	AdaptiveTrackSelection:{Factory:class{}},
	MediaItem:{fromUri:u=>u,SubtitleConfiguration:{Builder:class{}}},
	C:{TIME_UNSET:-1},
	MimeTypes:{APPLICATION_SUBRIP:'application/x-subrip'},
	util:{Util:{SDK_INT:35,inferContentType:()=>4,getUserAgent:()=>'probe'}},
	upstream:{
		DefaultBandwidthMeter:{Builder:class{build(){return{}}}},
		DefaultDataSourceFactory:class{},
	},
	trackselection:{AdaptiveTrackSelection:{Factory:class{}}},
	source:{
		ProgressiveMediaSource:{Factory:class{createMediaSource(item){return item}}},
		DashMediaSource:{Factory:class{createMediaSource(item){return item}}},
		SsMediaSource:{Factory:class{createMediaSource(item){return item}}},
		HlsMediaSource:{Factory:class{createMediaSource(item){return item}setAllowChunklessPreparation(){return this}}},
		SingleSampleMediaSource:{Factory:class{createMediaSource(item){return item}}},
		MergingMediaSource:class{constructor(){}},
		MediaSource:class{},
	},
	ui:{
		PlayerView:class{constructor(){}},
		AspectRatioFrameLayout:{RESIZE_MODE_ZOOM:0,RESIZE_MODE_FIT:1,RESIZE_MODE_FILL:2},
	},
}}}}
globalThis.android={
	content:{Context:{AUDIO_SERVICE:'audio'}},
	media:{AudioManager:{AUDIOFOCUS_GAIN:1,STREAM_MUSIC:3},AudioFocusRequest:{Builder:class{build(){return{}}}}},
	net:{Uri:{parse:u=>u}},
}
export const __audioManager=audio
`,
)

const supportUrl = pathToFileURL(support).href
const source = readFileSync(installed, 'utf8').replace(
  /(from|import)\s*(['"])(?:\.\/common|@nativescript\/core)\2/g,
  (_match: string, keyword: string) => `${keyword} ${JSON.stringify(supportUrl)}`,
)
const subject = join(directory, 'index.android.mjs')
writeFileSync(subject, source)
const { Video } = (await import(pathToFileURL(subject).href)) as any
const { emitted } = (await import(supportUrl)) as any
const listeners: any[] = (globalThis as any).__listenerImpls

const READY = 3
const ENDED = 4

function fakePlayer() {
  return {
    listeners: [] as any[],
    prepared: false,
    playWhenReady: false,
    addListener(listener: any) {
      this.listeners.push(listener)
    },
    prepare() {
      this.prepared = true
    },
    setPlayWhenReady(value: boolean) {
      this.playWhenReady = value
    },
    seekToDefaultPosition() {},
    seekTo(_ms: number) {},
    stop() {},
    release() {},
    isPlaying() {
      return false
    },
    getCurrentPosition() {
      return 0
    },
    getDuration() {
      return 15970
    },
    getPlaybackState() {
      return 1
    },
    getPlayWhenReady() {
      return this.playWhenReady
    },
    setVolume(_v: number) {},
  }
}

const audioManager = {
  requestAudioFocus() {},
  abandonAudioFocus() {},
  abandonAudioFocusRequest() {},
}

function attach(view: any) {
  view._context = { getSystemService: () => audioManager }
  view.player = fakePlayer()
  const before = listeners.length
  view._setupMediaPlayerListeners()
  assert.equal(listeners.length, before + 1, 'player listener was not attached')
  return listeners[listeners.length - 1]
}

const starts = () => emitted.filter((name: string) => name === 'playbackStart').length
const readies = () => emitted.filter((name: string) => name === 'playbackReady').length
const finishes = () => emitted.filter((name: string) => name === 'finished').length

test('exoplayer emits playbackStart once per source from actual playback only', () => {
  const view = new Video()
  const listener = attach(view)
  try {
    // A play request is not playback — no start, and the flag stays unset so
    // the later real transition can still report.
    listener.onPlayWhenReadyChanged(true, 0)
    assert.equal(view.eventPlaybackStart, false)
    assert.equal(starts(), 0)

    listener.onPlaybackStateChanged(READY)
    assert.equal(readies(), 1)
    listener.onIsPlayingChanged(true)
    assert.equal(starts(), 1, 'start must come from the isPlaying transition')

    // Pause/resume must not re-emit.
    listener.onIsPlayingChanged(false)
    listener.onIsPlayingChanged(true)
    assert.equal(starts(), 1)

    // A buffering cycle (state dip + recovery) must not re-emit either.
    listener.onIsPlayingChanged(false)
    listener.onPlaybackStateChanged(READY)
    listener.onIsPlayingChanged(true)
    assert.equal(starts(), 1)
    assert.equal(readies(), 1)

    // Looping keeps the single per-source start.
    view.loop = true
    listener.onPlaybackStateChanged(ENDED)
    assert.equal(finishes(), 1)
    listener.onIsPlayingChanged(false)
    listener.onIsPlayingChanged(true)
    assert.equal(starts(), 1)

    // After a non-looping finish the flag resets, so a replay reports a new start.
    view.loop = false
    listener.onPlaybackStateChanged(ENDED)
    assert.equal(finishes(), 2)
    view.play()
    listener.onIsPlayingChanged(true)
    assert.equal(starts(), 2)

    // Source replacement retires the engagement and reports again on the new
    // player: release() resets the per-source flags and the next listener
    // attaches fresh.
    view.release()
    const second = attach(view)
    second.onPlaybackStateChanged(READY)
    second.onIsPlayingChanged(true)
    assert.equal(starts(), 3)
    assert.equal(readies(), 2)
  } finally {
    view.release()
    // The plugin guards its timer on `typeof interval === 'number'`, the
    // NativeScript handle contract; Node returns a Timeout object, so the
    // harness clears it here rather than masking that upstream difference.
    clearInterval(view.interval)
  }
})
