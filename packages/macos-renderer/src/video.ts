/** `xplatvideo` — AppKit video surface backed by AVPlayerView + AVPlayer.
 *  Chrome stays off (`controlsStyle` None) unless the `controls` prop asks
 *  for the inline transport; the shared VideoChrome draws over it, same as
 *  the web leaf's chrome-free <video>. Times cross the boundary in
 *  milliseconds, matching the exoplayer surface the mobile leaf drives. */
// The minimal AppKit host links AppKit; load AVKit/AVFoundation before
// resolving their classes — same pattern as the webview leaf's WebKit load.

import {
	AVPlayer,
	AVPlayerItem,
	AVPlayerView,
	AVURLAsset,
	CMTimeMakeWithSeconds,
	NSBundle,
	NSDictionary,
	NSNotificationCenter,
	NSObject,
	NSURL,
	interop,
} from '@octane-xplat/platform/macos'

const avfoundation = dlopen(
	'/System/Library/Frameworks/AVFoundation.framework/AVFoundation',
	2,
)
if (!avfoundation) {
	throw new Error('Unable to load the system AVFoundation framework')
}

const avkit = dlopen('/System/Library/Frameworks/AVKit.framework/AVKit', 2)
if (!avkit) {
	throw new Error('Unable to load the system AVKit framework')
}

const END_NOTIFICATION = 'AVPlayerItemDidPlayToEndTimeNotification'
const FAIL_NOTIFICATION = 'AVPlayerItemFailedToPlayToEndTimeNotification'

interface VideoState {
	props: Record<string, any>
	player: any
	item: any
	observer: any
	endObserver: any
	failObserver: any
	timeObserver: any
	started: boolean
	generation: number
	emit(name: string, payload: any): void
}

const states = new WeakMap<object, VideoState>()

const StatusObserver = NSObject.extend(
	{
		observeValueForKeyPathOfObjectChangeContext(
			keyPath: string,
			object: any,
			_change: any,
			_context: any,
		) {
			const state = states.get(object?.xplatOwner ?? object)
			if (!state) {
				return
			}

			if (keyPath === 'status' && object === state.item) {
				const status = Number(object.status)
				if (status === 1) {
					const duration = itemDurationMs(state.item)
					state.emit('onPlaybackReady', { duration })
					if (state.props.autoplay) {
						state.player.play()
					}
				} else if (status === 2) {
					state.emit('onError', { error: String(object.error?.localizedDescription ?? 'playback failed') })
				}
			} else if (keyPath === 'timeControlStatus' && object === state.player) {
				if (Number(object.timeControlStatus) === 2 && !state.started) {
					state.started = true
					state.emit('onPlaybackStart', {})
				}
			}
		},
	},
	{
		name: 'XplatVideoStatusObserver',
		exposedMethods: {
			'observeValueForKeyPathOfObjectChangeContext': {
				params: [NSObject, NSObject, NSObject, NSObject],
				returns: interop.types.void,
			},
		},
	},
)

function itemDurationMs(item: any): number {
	const seconds = Number(item?.duration?.seconds ?? 0)
	return Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds * 1000) : 0
}

function sourceUrl(src: string): any {
	if (src.startsWith('~/')) {
		return NSURL.fileURLWithPath(NSBundle.mainBundle.resourcePath + '/' + src.slice(2))
	}

	if (src.startsWith('file://')) {
		return NSURL.URLWithString(src)
	}

	if (/^https?:\/\//i.test(src)) {
		return NSURL.URLWithString(src)
	}

	if (src && !/^[a-z][a-z\d+.-]*:/i.test(src)) {
		return NSURL.fileURLWithPath(src)
	}

	return null
}

function attachItem(state: VideoState, view: any) {
	const src = String(state.props.src ?? '')
	const generation = ++state.generation
	state.started = false
	if (state.item) {
		state.item.removeObserverForKeyPath(state.observer, 'status')
		NSNotificationCenter.defaultCenter.removeObserver(state.endObserver)
		NSNotificationCenter.defaultCenter.removeObserver(state.failObserver)
		state.item = null
	}

	if (!src) {
		state.player.replaceCurrentItemWithPlayerItem(null)
		return
	}

	const url = sourceUrl(src)
	if (!url) {
		state.emit('onError', { error: 'Unsupported video source' })
		return
	}

	const headers = state.props.headers
	const item =
		headers && Object.keys(headers).length > 0
			? AVPlayerItem.playerItemWithAsset(
					AVURLAsset.URLAssetWithURLOptions(
						url,
						NSDictionary.dictionaryWithObjectForKey(
							headers as any,
							'AVURLAssetHTTPHeaderFieldsKey' as any,
						),
					),
				)
			: AVPlayerItem.playerItemWithURL(url)

	state.item = item
	item.addObserverForKeyPathOptionsContext(state.observer, 'status', 0, null)
	const center = NSNotificationCenter.defaultCenter
	state.endObserver = center.addObserverForNameObjectQueueUsingBlock(
		END_NOTIFICATION,
		item,
		null,
		() => {
			if (state.item !== item || state.generation !== generation) {
				return
			}

			if (state.props.loop) {
				item.seekToTimeCompletionHandler(CMTimeMakeWithSeconds(0, 600), () => {
					if (state.item === item) {
						state.player.play()
					}
				})
				return
			}

			state.emit('onFinished', {})
		},
	)
	state.failObserver = center.addObserverForNameObjectQueueUsingBlock(
		FAIL_NOTIFICATION,
		item,
		null,
		() => {
			if (state.item === item && state.generation === generation) {
				state.emit('onError', { error: 'Playback failed to reach the end' })
			}
		},
	)

	state.player.replaceCurrentItemWithPlayerItem(item)
}

export function makeVideoView(): AVPlayerView {
	const view = AVPlayerView.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 320, height: 180 },
	}) as any

	view.translatesAutoresizingMaskIntoConstraints = false
	view.controlsStyle = 0 // AVPlayerViewControlsStyleNone — chrome stays self-drawn.
	const player = AVPlayer.alloc().init()
	view.player = player
	return view
}

export function updateVideoView(
	node: import('./index').ElementNode,
	props: Record<string, any>,
) {
	const view = node.view as any
	let state = states.get(view)
	if (!state) {
		const created: VideoState = {
			props: {},
			player: view.player,
			item: null,
			observer: StatusObserver.alloc().init(),
			endObserver: null,
			failObserver: null,
			timeObserver: null,
			started: false,
			generation: 0,
			emit(name: string, payload: any) {
				const handler = created.props[name]
				if (handler) {
					try {
						node.container.root!.eventScope('discrete', () => handler(payload))
					} catch (error) {
						console.error('[macos-event] video handler failed', error)
					}
				}
			},
		}

		states.set(view, created)
		// The status observer reads state through the view it was registered
		// on; tag the view so the KVO callback can find its state.
		;(view as any).xplatOwner = view
		created.player.addObserverForKeyPathOptionsContext(
			created.observer,
			'timeControlStatus',
			0,
			null,
		)
		state = created
	}

	const previousSrc = state.props.src
	const previousObserve = state.props.observeCurrentTime
	const previousControls = state.props.controls
	state.props = props
	view.controlsStyle = props.controls === true ? 1 : 0
	view.videoGravity =
		props.fill === 'aspectFill'
			? 'AVLayerVideoGravityResizeAspectFill'
			: props.fill === 'fill'
				? 'AVLayerVideoGravityResize'
				: 'AVLayerVideoGravityResizeAspect'
	state.player.muted = props.muted === true

	if (props.src !== previousSrc) {
		attachItem(state, view)
	}

	if (props.observeCurrentTime !== previousObserve) {
		if (props.observeCurrentTime && !state.timeObserver) {
			state.timeObserver = state.player.addPeriodicTimeObserverForIntervalQueueUsingBlock(
				CMTimeMakeWithSeconds(0.5, 1),
				null,
				(time: any) => {
					const seconds = Number(time?.seconds ?? 0)
					if (Number.isFinite(seconds)) {
						state.emit('onCurrentTimeUpdated', { position: Math.round(seconds * 1000) })
					}
				},
			)
		} else if (!props.observeCurrentTime && state.timeObserver) {
			state.player.removeTimeObserver(state.timeObserver)
			state.timeObserver = null
		}
	}

	if (previousControls !== undefined && props.controls !== previousControls) {
		// controlsStyle already re-applied above.
	}
}

export function disposeVideoView(view: AVPlayerView) {
	const state = states.get(view)
	if (!state) {
		return
	}

	if (state.timeObserver) {
		state.player.removeTimeObserver(state.timeObserver)
	}

	if (state.item) {
		state.item.removeObserverForKeyPath(state.observer, 'status')
	}

	NSNotificationCenter.defaultCenter.removeObserver(state.endObserver)
	NSNotificationCenter.defaultCenter.removeObserver(state.failObserver)
	state.player.removeObserverForKeyPath(state.observer, 'timeControlStatus')
	state.player.pause()
	;(view as any).player = null
	states.delete(view)
}
