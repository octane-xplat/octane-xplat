/** AppKit video surface. An NSView hosts an AVPlayerLayer; the Octane leaf
 *  owns all transport UI. TypeScript port of the removed Swift XplatVideoView —
 *  identical contract, and remote loading stays inside AVFoundation so no
 *  JS-involved NSURLSession ever crosses the bridge (runtime-verified:
 *  setTimeout polling, main-queue notification blocks and seek completions all
 *  deliver while an AVPlayer remote transfer is in flight — see
 *  tests/verify-macos.mjs). */
import {
	AVLayerVideoGravityResize,
	AVLayerVideoGravityResizeAspect,
	AVLayerVideoGravityResizeAspectFill,
	AVPlayer,
	AVPlayerItem,
	AVPlayerItemDidPlayToEndTimeNotification,
	AVPlayerItemFailedToPlayToEndTimeNotification,
	AVPlayerLayer,
	CATransaction,
	CMTimeGetSeconds,
	CMTimeMakeWithSeconds,
	interop,
	kCMTimeZero,
	NativeClass,
	NSBundle,
	NSColor,
	NSFileManager,
	NSNotificationCenter,
	NSOperationQueue,
	NSURL,
	NSView,
} from '@octane-xplat/platform/macos'
import type { AppKitVideoNative } from './video-owner.macos.ts'

interface VideoState {
	player: AVPlayer
	videoLayer: AVPlayerLayer
	item: AVPlayerItem | null
	observers: interop.Object[]
	generation: number
	command: number
	seekRevision: number
	disposed: boolean
	wasAttached: boolean
	wantsPlayback: boolean
	ended: boolean
	seeking: boolean
	looping: boolean
	muted: boolean
	failure: string | null
}

const states = new WeakMap<object, VideoState>()

function state(view: object): VideoState {
	const found = states.get(view)
	if (!found) {
		throw new Error('Video view is missing its state')
	}
	return found
}

export class XplatVideoView extends NSView implements AppKitVideoNative {
	static {
		NativeClass(this)
	}

	static create(): XplatVideoView {
		const view = XplatVideoView.alloc().initWithFrame({
			origin: { x: 0, y: 0 },
			size: { width: 0, height: 0 },
		})
		view.wantsLayer = true
		view.layer.masksToBounds = true
		view.layer.backgroundColor = NSColor.blackColor.CGColor
		const player = AVPlayer.new()
		const videoLayer = AVPlayerLayer.new()
		videoLayer.player = player
		videoLayer.videoGravity = AVLayerVideoGravityResizeAspect
		view.layer.addSublayer(videoLayer)
		view.accessibilityElement = false
		states.set(view, {
			player,
			videoLayer,
			item: null,
			observers: [],
			generation: 0,
			command: 0,
			seekRevision: 0,
			disposed: false,
			wasAttached: false,
			wantsPlayback: false,
			ended: false,
			seeking: false,
			looping: false,
			muted: false,
			failure: null,
		})
		return view
	}

	hitTest(_point: { x: number; y: number }): NSView {
		return null as unknown as NSView
	}

	layout(): void {
		super.layout()
		const found = states.get(this)
		if (!found) {
			return
		}
		CATransaction.begin()
		CATransaction.setDisableActions(true)
		found.videoLayer.frame = this.bounds
		CATransaction.commit()
	}

	viewDidMoveToWindow(): void {
		super.viewDidMoveToWindow()
		const found = states.get(this)
		if (!found) {
			return
		}
		if (this.window != null) {
			found.wasAttached = true
		} else if (found.wasAttached) {
			this.pause()
		}
	}

	setSource(source: string): void {
		const found = state(this)
		if (found.disposed) {
			return
		}
		this.clear()
		if (!source) {
			return
		}
		let url: NSURL | null
		if (source.startsWith('~/')) {
			const base = NSBundle.mainBundle.resourceURL
			url = base ? base.URLByAppendingPathComponentIsDirectory(source.slice(2), false) : null
		} else if (source.startsWith('/')) {
			url = NSURL.fileURLWithPath(source)
		} else {
			url = NSURL.URLWithString(source)
		}
		const scheme = String(url?.scheme ?? '').toLowerCase()
		if (
			!url ||
			!['http', 'https', 'file'].includes(scheme) ||
			(!url.isFileURL() && !String(url.host ?? '').length)
		) {
			found.failure = 'Video source must be a bundle path, absolute file, or HTTP(S) URL'
			return
		}
		if (url.isFileURL() && !NSFileManager.defaultManager.isReadableFileAtPath(String(url.path))) {
			found.failure = 'Video file is not readable'
			return
		}
		const next = AVPlayerItem.playerItemWithURL(url)
		const ownGeneration = found.generation
		found.item = next
		found.player = AVPlayer.playerWithPlayerItem(next)
		found.player.muted = found.muted
		found.videoLayer.player = found.player
		const view = new WeakRef(this)
		const held = new WeakRef(found)
		const center = NSNotificationCenter.defaultCenter
		found.observers.push(
			center.addObserverForNameObjectQueueUsingBlock(
				AVPlayerItemDidPlayToEndTimeNotification,
				next,
				NSOperationQueue.mainQueue,
				() => {
					const self = view.deref()
					const current = held.deref()
					if (
						!self ||
						!current ||
						current.disposed ||
						current.generation !== ownGeneration ||
						current.item !== next
					) {
						return
					}
					if (current.looping && current.wantsPlayback) {
						seek(self, 0, true)
					} else {
						current.ended = true
						self.pause()
					}
				},
			),
			center.addObserverForNameObjectQueueUsingBlock(
				AVPlayerItemFailedToPlayToEndTimeNotification,
				next,
				NSOperationQueue.mainQueue,
				() => {
					const self = view.deref()
					const current = held.deref()
					if (
						!self ||
						!current ||
						current.disposed ||
						current.generation !== ownGeneration ||
						current.item !== next
					) {
						return
					}
					current.failure = 'Video playback failed'
					self.pause()
				},
			),
		)
	}

	setMuted(value: boolean): void {
		const found = state(this)
		found.muted = value
		if (!found.disposed) {
			found.player.muted = value
		}
	}

	setLooping(value: boolean): void {
		state(this).looping = value
	}

	setFit(value: string): void {
		state(this).videoLayer.videoGravity =
			value === 'cover'
				? AVLayerVideoGravityResizeAspectFill
				: value === 'fill'
					? AVLayerVideoGravityResize
					: AVLayerVideoGravityResizeAspect
	}

	play(): void {
		const found = state(this)
		if (
			found.disposed ||
			found.item == null ||
			found.failure != null ||
			(found.wasAttached && this.window == null)
		) {
			return
		}
		found.command += 1
		found.wantsPlayback = true
		if (found.ended) {
			seek(this, 0, true)
		} else {
			found.player.play()
		}
	}

	pause(): void {
		const found = state(this)
		found.command += 1
		found.wantsPlayback = false
		found.player.pause()
	}

	seekToMS(milliseconds: number): void {
		const found = state(this)
		seek(this, milliseconds, found.wantsPlayback)
	}

	snapshot(): string {
		const found = state(this)
		const item = found.item
		if (item != null && (Number(item.status) === 2 || Number(found.player.status) === 2)) {
			found.failure = 'Video playback failed'
			this.pause()
		}
		const status =
			found.failure != null
				? 'failed'
				: item == null
					? 'idle'
					: found.ended
						? 'ended'
						: Number(item.status) === 1
							? 'ready'
							: 'loading'
		const position = CMTimeGetSeconds(found.player.currentTime())
		const duration = item ? CMTimeGetSeconds(item.duration) : 0
		return JSON.stringify({
			status,
			position: Number.isFinite(position) ? Math.max(0, position * 1000) : 0,
			duration: Number.isFinite(duration) ? Math.max(0, duration * 1000) : 0,
			playing: Number(found.player.timeControlStatus) === 2,
			requestedPlaying: found.wantsPlayback,
			seeking: found.seeking,
			message: found.failure ?? '',
		})
	}

	clear(): void {
		const found = state(this)
		found.generation += 1
		found.command += 1
		found.seekRevision += 1
		const center = NSNotificationCenter.defaultCenter
		for (const observer of found.observers) {
			center.removeObserver(observer)
		}
		found.observers = []
		found.item?.cancelPendingSeeks()
		found.player.pause()
		found.player.replaceCurrentItemWithPlayerItem(null)
		found.videoLayer.player = null as unknown as AVPlayer
		found.item = null
		found.wantsPlayback = false
		found.ended = false
		found.seeking = false
		found.failure = null
	}

	dispose(): void {
		const found = state(this)
		if (found.disposed) {
			return
		}
		this.clear()
		found.disposed = true
		found.videoLayer.player = null as unknown as AVPlayer
	}
}

function seek(view: XplatVideoView, milliseconds: number, resume: boolean): void {
	const found = state(view)
	const item = found.item
	if (found.disposed || item == null || !Number.isFinite(milliseconds)) {
		return
	}
	found.command += 1
	found.seekRevision += 1
	const ownCommand = found.command
	const ownSeek = found.seekRevision
	const ownGeneration = found.generation
	const duration = CMTimeGetSeconds(item.duration)
	const seconds = Math.max(
		0,
		Number.isFinite(duration) && duration > 0
			? Math.min(milliseconds / 1000, duration)
			: milliseconds / 1000,
	)
	found.seeking = true
	found.ended = false
	item.cancelPendingSeeks()
	const target = new WeakRef(view)
	const held = new WeakRef(found)
	found.player.seekToTimeToleranceBeforeToleranceAfterCompletionHandler(
		CMTimeMakeWithSeconds(seconds, 600),
		kCMTimeZero,
		kCMTimeZero,
		() => {
			// Match the Swift DispatchQueue.main.async boundary before mutating.
			NSOperationQueue.mainQueue.addOperationWithBlock(() => {
				const self = target.deref()
				const current = held.deref()
				if (
					!self ||
					!current ||
					current.disposed ||
					current.generation !== ownGeneration ||
					current.seekRevision !== ownSeek ||
					current.item !== item
				) {
					return
				}
				current.seeking = false
				if (resume && current.wantsPlayback && current.command === ownCommand) {
					current.player.play()
				}
			})
		},
	)
}

export function createVideoView(): AppKitVideoNative {
	return XplatVideoView.create()
}
