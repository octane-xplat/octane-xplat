/** @jsxImportSource @octane-xplat/jsx */
import { useImperativeHandle, useCallback, useEffect, useRef, useState } from 'octane'
import type { VideoHandle, VideoProps } from './props'
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from './escape-props'
import { layoutChildProps } from './layout-child'
import { VideoChrome } from './video-chrome.tsrx'

declare const CMTimeMakeWithSeconds: (seconds: number, preferredTimescale: number) => any

const FILLS: Record<string, string> = {
	contain: 'aspect',
	cover: 'aspectFill',
	fill: 'fill',
}

/** Video — AppKit surface (`xplatvideo` element → AVPlayerView, chrome-free)
 *  plus the shared `VideoChrome` overlay, identical structure to the web and
 *  native leaves. Times are milliseconds; the leaf converts CMTime seconds
 *  at the boundary. `src` takes the shared grammar: remote URL, `~/` bundle
 *  path, `file://` URL, absolute path. */
export function Video(props: VideoProps) @{
	const host = useRef<any>(null)
	const [playing, setPlaying] = useState(props.playing ?? props.autoPlay ?? false)
	const [started, setStarted] = useState(false)
	const [position, setPosition] = useState(0)
	const [duration, setDuration] = useState(0)
	const [internalMuted, setInternalMuted] = useState(false)
	const muted = props.muted ?? internalMuted

	useImperativeHandle(props.ref, () => handle(host.current!), [])

	const bindHost = useCallback((v: any) => {
		host.current = v
	}, [])

	const drive = (v: any, next: boolean) => {
		if (!v?.player) return
		if (next) v.player.play()
		else v.player.pause()
	}

	useEffect(() => {
		const v = host.current
		if (!v) return
		applyEscapeProps(v, props)
	}, [])

	// Controlled `playing` writes — play state is a method call, not a prop.
	useEffect(() => {
		if (props.playing === undefined) return
		setPlaying(props.playing)
		drive(host.current, props.playing)
	}, [props.playing])

	useEffect(() => {
		const v = host.current
		if (v?.player) v.player.muted = muted
	}, [muted])

	const togglePlay = () => {
		const next = !playing
		setPlaying(next)
		drive(host.current, next)
		props.onPlayingChange?.(next)
	}

	const handle = (v: any): VideoHandle => ({
		play: () => v?.player?.play(),
		pause: () => v?.player?.pause(),
		seekTo: (ms: number) => v?.player?.seekToTime(CMTimeMakeWithSeconds(ms / 1000, 600)),
		currentTime: () => Number(v?.player?.currentTime?.().seconds ?? 0) * 1000,
		duration: () => {
			const seconds = Number(v?.player?.currentItem?.duration?.seconds ?? 0)
			return Number.isFinite(seconds) ? seconds * 1000 : 0
		},
		native: v,
	})

	<masonview id={props.id} className={['vx-layers', 'vx-video', props.className]} {...layoutChildProps(props, {display: "grid", gridTemplateRows: "1fr", gridTemplateColumns: "1fr", ...(props.style)})} accessible={props.accessible} accessibilityLabel={props.accessibilityLabel} accessibilityRole={nativeAccessibilityRole(props.accessibilityRole) as any} accessibilityHint={props.accessibilityHint} accessibilityValue={props.accessibilityValue} accessibilityState={nativeAccessibilityState(props.accessibilityState) as any} accessibilityLiveRegion={props.accessibilityLiveRegion as any}>
		<xplatvideo
			ref={bindHost}
			src={props.src}
			autoplay={props.playing ?? props.autoPlay ?? false}
			controls={false}
			loop={props.loop}
			muted={muted}
			fill={FILLS[props.fit ?? 'contain']}
			observeCurrentTime={props.controls !== false}
			onFinished={() => {
				if (!props.loop) {
					setPlaying(false)
					props.onEnded?.()
				}
			}}
			onPlaybackReady={(e: any) => {
				const ms = Number(e?.duration ?? 0)
				setDuration(ms)
				props.onReady?.({ duration: ms })
			}}
			onPlaybackStart={() => setStarted(true)}
			onCurrentTimeUpdated={(e: any) => setPosition(e.position ?? 0)}
			onError={(e: any) => props.onError?.({ message: String(e?.error ?? 'unknown') })}
		/>
		@if (props.controls !== false) {
			<VideoChrome
				poster={props.poster}
				started={started}
				playing={playing}
				position={position}
				duration={duration}
				muted={muted}
				onTogglePlay={togglePlay}
				onToggleMute={() => {
					const next = !muted
					setInternalMuted(next)
					if (host.current?.player) host.current.player.muted = next
					props.onMutedChange?.(next)
				}}
				onSeek={(ms: number) => {
					if (host.current?.player) {
						host.current.player.seekToTime(CMTimeMakeWithSeconds(ms / 1000, 600))
						setPosition(ms)
					}
				}}
			/>
		}
	</masonview>
}
