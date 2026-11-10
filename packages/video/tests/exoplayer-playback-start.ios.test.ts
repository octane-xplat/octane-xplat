import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, test } from 'node:test'
import { pathToFileURL } from 'node:url'

// Drives the installed @nstudio/nativescript-exoplayer iOS source through the
// KVO contract AVPlayer delivers: playbackStart must be emitted once per
// source from actual playback (timeControlStatus === Playing), never from a
// play request, a loaded item, or a timer. Upstream 6.2.0 leaves the
// plugin's playbackStart() emitter dead — no observer call site — so this
// pins the scoped 6.2.0 repair carried in packages/cli/patches: it fails on
// the unpatched file (no timeControlStatus observer, zero starts) and on any
// regression that emits from 'status' readiness. It does not qualify
// NativeScript's KVO bridging on device; that stays with the native probe.

const require = createRequire(new URL('../package.json', import.meta.url))
const installed = require.resolve('@nstudio/nativescript-exoplayer/index.ios.js')

const directory = mkdtempSync(join(tmpdir(), 'xplat-video-exoplayer-ios-'))

after(() => rmSync(directory, { recursive: true, force: true }))

const support = join(directory, 'support.mjs')

writeFileSync(
  support,
  `
export const emitted=[]
export class Video {
	static finishedEvent='finished'
	static playbackReadyEvent='playbackReady'
	static playbackStartEvent='playbackStart'
	static seekToTimeCompleteEvent='seekToTimeComplete'
	static currentTimeUpdatedEvent='currentTimeUpdated'
	static chaptersLoadedEvent='chaptersLoaded'
	_emit(name) {
		emitted.push(name)
	}
	notify(payload) {
		this.__notifications=(this.__notifications||[]).concat(payload)
	}
	requestLayout() {}
}
export const VideoFill={default:0,aspect:1,aspectFill:2,fill:3}
export const videoSourceProperty={setNative:Symbol('videoSourceProperty.setNative')}
export const fillProperty={setNative:Symbol('fillProperty.setNative')}
export const subtitleSourceProperty={setNative:Symbol('subtitleSourceProperty.setNative')}
export const Application={
	suspendEvent:'suspend',resumeEvent:'resume',on(){},off(){},
	ios:{
		__observers:[],
		addNotificationObserver(name,cb){const t={name,cb};this.__observers.push(t);return t},
		removeNotificationObserver(t){this.__removed=(this.__removed||[]).concat(t)},
	},
}
export const Utils={ios:{getRootViewController:()=>null}}

// The plugin subclass NSObject through the TypeScript __extends helper and
// drives AVFoundation globals; the harness supplies just enough of both.
globalThis.__extends=function(derived,base){
	Object.setPrototypeOf(derived,base)
	derived.prototype=Object.create(base.prototype)
	derived.prototype.constructor=derived
}
globalThis.NSObject=function NSObject(){}
globalThis.NSObject.new=function(){return new this()}
globalThis.AVPlayerViewController=class {
	static new(){return new this()}
	constructor(){
		this.player=null
		this.showsPlaybackControls=false
		this.view={kind:'playerView'}
	}
	addChildViewController(){}
	didMoveToParentViewController(){}
}
const audioSession={
	currentRoute:{outputs:{lastObject:{portType:'Speaker'}}},
	setCategoryError(){},
	overrideOutputAudioPortError(){},
	setActiveError(){},
}
globalThis.AVAudioSession={sharedInstance:()=>audioSession}
globalThis.AVPlayerItem=class {
	constructor(){
		this.status=0
		this.statusObservers=[]
	}
	static playerItemWithAsset(){return new this()}
	addObserverForKeyPathOptionsContext(observer,path){this.statusObservers.push({observer,path})}
	removeObserverForKeyPath(){}
}
globalThis.AVPlayerItemStatus={ReadyToPlay:1}
globalThis.AVPlayerItemDidPlayToEndTimeNotification='AVPlayerItemDidPlayToEndTimeNotification'
globalThis.NSURL={URLWithString:(s)=>({toString:()=>s})}
globalThis.AVPlayer=class {
	static new(){return new this()}
	constructor(url){
		this.url=url
		this.currentItem=null
		this.timeControlStatus=0
		this.muted=false
		this.rate=0
		this.volume=1
		this.playCount=0
		this.kvoAdds=[]
		this.kvoRemovals=[]
	}
	play(){this.playCount++;this.rate=1}
	pause(){this.pauseCount=(this.pauseCount||0)+1;this.rate=0;this.timeControlStatus=0}
	seekToTime(){}
	seekToTimeToleranceBeforeToleranceAfterCompletionHandler(_t,_b,_a,done){if(done)done(true)}
	replaceCurrentItemWithPlayerItem(item){
		this.currentItem=item
		// AVPlayer keeps its requested rate across item replacement; the stub
		// models that so tests can observe residual playback a swap inherits.
		if (this.rate>0 && item && item.status===AVPlayerItemStatus.ReadyToPlay) {
			this.timeControlStatus=2 // Playing
		}
	}
	addObserverForKeyPathOptionsContext(observer,path){this.kvoAdds.push({observer,path})}
	removeObserverForKeyPath(observer,path){this.kvoRemovals.push({observer,path})}
	addPeriodicTimeObserverForIntervalQueueUsingBlock(){return {}}
	removeTimeObserver(){}
	currentTime(){return{value:0,timescale:600}}
}
globalThis.CMTimeMake=(value,timescale)=>({value,timescale})
globalThis.CMTimeMakeWithSeconds=(seconds,timescale)=>({value:seconds*timescale,timescale})
globalThis.kCMTimeZero={value:0,timescale:0}
globalThis.CMTimeGetSeconds=(t)=>(t.timescale?t.value/t.timescale:0)
`,
)

const supportUrl = pathToFileURL(support).href
const source = readFileSync(installed, 'utf8').replace(
  /(from|import)\s*(['"])(?:\.\/common|@nativescript\/core)\2/g,
  (_match: string, keyword: string) => `${keyword} ${JSON.stringify(supportUrl)}`,
)

const subject = join(directory, 'index.ios.mjs')

writeFileSync(subject, source)

const { Video } = (await import(pathToFileURL(subject).href)) as any
const { emitted } = (await import(supportUrl)) as any

const PAUSED = 0
const WAITING = 1
const PLAYING = 2
const READY_TO_PLAY = 1

const Item = (globalThis as any).AVPlayerItem

const starts = () => emitted.filter((name: string) => name === 'playbackStart').length
const readies = () => emitted.filter((name: string) => name === 'playbackReady').length
const finishes = () => emitted.filter((name: string) => name === 'finished').length

function observe(view: any, path: string) {
  view._observer.observeValueForKeyPathOfObjectChangeContext(path, view._player, {}, null)
}

function kvoPaths(player: any, list: 'kvoAdds' | 'kvoRemovals') {
  return player[list].map((entry: any) => entry.path)
}

test('exoplayer emits playbackStart once per source from actual playback only (ios)', () => {
  const view = new Video()
  const player = view._player

  try {
    // A play request is not playback — no start, and the flag stays unset so
    // the later real transition can still report.
    view._setNativeVideo(new Item())
    assert.ok(
      kvoPaths(player, 'kvoAdds').includes('timeControlStatus'),
      'player was not observed for timeControlStatus',
    )

    view.play()
    assert.equal(player.playCount, 1)
    assert.equal(view.eventPlaybackStart, false)
    assert.equal(starts(), 0)

    // Item readiness is loading, not playback.
    player.currentItem.status = READY_TO_PLAY
    observe(view, 'status')
    assert.equal(readies(), 1)
    assert.equal(starts(), 0)

    // Buffering at requested rate is still not playback; the actual-playing
    // transition is.
    player.timeControlStatus = WAITING
    observe(view, 'timeControlStatus')
    assert.equal(starts(), 0)
    player.timeControlStatus = PLAYING
    observe(view, 'timeControlStatus')
    assert.equal(starts(), 1, 'start must come from the playing transition')
    assert.equal(view.eventPlaybackStart, true)

    // Pause/resume must not re-emit.
    player.timeControlStatus = PAUSED
    observe(view, 'timeControlStatus')
    player.timeControlStatus = PLAYING
    observe(view, 'timeControlStatus')
    assert.equal(starts(), 1)

    // A mid-playback stall (waiting for data) must not re-emit either.
    player.timeControlStatus = WAITING
    observe(view, 'timeControlStatus')
    player.timeControlStatus = PLAYING
    observe(view, 'timeControlStatus')
    assert.equal(starts(), 1)

    // Looping keeps the single per-source start.
    view.loop = true
    view.AVPlayerItemDidPlayToEndTimeNotification({ object: player.currentItem })
    assert.equal(finishes(), 1)
    assert.equal(view.eventPlaybackStart, true)
    player.timeControlStatus = WAITING
    observe(view, 'timeControlStatus')
    player.timeControlStatus = PLAYING
    observe(view, 'timeControlStatus')
    assert.equal(starts(), 1)

    // After a non-looping finish the flag resets, so a replay reports a new
    // start.
    view.loop = false
    view.AVPlayerItemDidPlayToEndTimeNotification({ object: player.currentItem })
    assert.equal(finishes(), 2)
    assert.equal(view.eventPlaybackStart, false)
    view.play()
    player.timeControlStatus = PLAYING
    observe(view, 'timeControlStatus')
    assert.equal(starts(), 2)

    // Source replacement retires the engagement and reports again on the new
    // item.
    view._setNativeVideo(new Item())
    assert.equal(view.eventPlaybackStart, false)
    player.currentItem.status = READY_TO_PLAY
    observe(view, 'status')
    assert.equal(readies(), 2)
    player.timeControlStatus = PLAYING
    observe(view, 'timeControlStatus')
    assert.equal(starts(), 3)

    // Player replacement moves the observer to the new player and reports
    // again for the new source.
    view._setNativePlayerSource('https://example.invalid/replacement.mp4')
    assert.equal(view.eventPlaybackStart, false)
    assert.ok(kvoPaths(player, 'kvoRemovals').includes('timeControlStatus'))

    const player2 = view._player

    assert.notEqual(player2, player)
    assert.ok(kvoPaths(player2, 'kvoAdds').includes('timeControlStatus'))
    player2.timeControlStatus = PLAYING
    observe(view, 'timeControlStatus')
    assert.equal(starts(), 4)

    // Destruction detaches the player-state observer.
    view.destroy()
    assert.ok(kvoPaths(player2, 'kvoRemovals').includes('timeControlStatus'))
  } finally {
    if (view._player) {
      view.destroy()
    }
  }
})

test('source replacement does not inherit a requested play rate when autoplay is off (ios)', () => {
  const view = new Video()
  const player = view._player
  const emittedBefore = emitted.length

  try {
    // A told-to-play player (autoplay on an item that may never become ready)
    // keeps AVPlayer.rate=1, and the rate survives item replacement upstream.
    view.autoplay = true
    view._setNativeVideo(new Item())
    assert.equal(player.playCount, 1)
    assert.equal(player.rate, 1)

    // Swapping to a source without autoplay must pause: otherwise the ready
    // replacement resumes under the residual rate and reports a start for an
    // engagement the app never asked to play. ExoPlayer recreates its player
    // per source, so Android resets playWhenReady; the web leaf resets too.
    view.autoplay = false

    const next = new Item()

    next.status = READY_TO_PLAY
    view._setNativeVideo(next)
    assert.equal(player.pauseCount, 1)
    assert.equal(player.rate, 0)
    assert.equal(player.timeControlStatus, PAUSED)
    observe(view, 'timeControlStatus')
    assert.equal(
      emitted.slice(emittedBefore).filter((name: string) => name === 'playbackStart').length,
      0,
      'a paused replacement must not surface a playbackStart',
    )
  } finally {
    if (view._player) {
      view.destroy()
    }
  }
})
