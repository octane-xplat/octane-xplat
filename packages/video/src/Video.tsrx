/** @jsxImportSource @nativescript-community/octane */
import { useCallback, useEffect, useRef, useState } from 'octane';
import { registerElement } from '@nativescript-community/octane';
import type { Attributes } from '@nativescript-community/octane/intrinsics';
import { Video as NSVideo, VideoFill } from '@nstudio/nativescript-exoplayer';
import type { VideoHandle, VideoProps } from './props';
import { cx } from './cx.mobile';
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from './escape-props';
import { layoutChildProps } from './layout-child';
import { VideoChrome } from './video-chrome.tsrx';

declare module '@nativescript-community/octane/intrinsics' {
	interface NativeScriptElements {
		xplatvideo: Attributes<typeof NSVideo>;
	}
}

// @nstudio/nativescript-exoplayer — AVPlayerViewController on iOS,
// ExoPlayer2 on Android. It is a required peer: this leaf sits in the
// shared native barrel, so every native app must declare the plugin for
// the /ns/m dev bridge to resolve it under the app root.
registerElement('xplatvideo', NSVideo);

const FILLS: Record<string, any> = {
	contain: VideoFill.aspect,
	cover: VideoFill.aspectFill,
	fill: VideoFill.fill,
};

/** Video — surface-hosted: the plugin supplies the engine surface
 *  (`controls={false}` strips AVPlayerViewController/PlayerView chrome) and
 *  the shared `VideoChrome` draws the transport on top. Times are ms —
 *  the plugin's native unit on both platforms. One-time wiring (escape
 *  props, `src`) lands in effects: the driver doesn't diff props, and
 *  `src` must arrive after the flags (the plugin opens the clip when the
 *  src property lands). The plugin emits `finished` even while looping —
 *  `onEnded` suppresses it under `loop` to match the web leaf. */
export function Video(props: VideoProps) @{
	const host = useRef<any>(null);
	const [playing, setPlaying] = useState(props.playing ?? props.autoPlay ?? false);
	const [started, setStarted] = useState(false);
	const [position, setPosition] = useState(0);
	const [duration, setDuration] = useState(0);
	const [internalMuted, setInternalMuted] = useState(false);
	const muted = props.muted ?? internalMuted;
	const appliedSrc = useRef<string | undefined>(undefined);

	// Stable identity — an inline closure re-fires ref(null)/ref(v) per
	// render, which would bounce host.current around the effects below.
	const bindHost = useCallback((v: any) => {
		host.current = v;
	}, []);

	const drive = (v: any, next: boolean) => {
		if (!v) return;
		if (next) v.play();
		else v.pause();
	};

	// src + escape props land in effects: the driver doesn't diff props, and
	// `src` must arrive after the flags (the plugin opens the clip when the
	// src property lands).
	useEffect(() => {
		const v = host.current;
		if (!v) return;
		applyEscapeProps(v, props);
		props.bind?.(handle(v));
	}, []);

	useEffect(() => {
		const v = host.current;
		if (!v || props.src === appliedSrc.current) return;
		appliedSrc.current = props.src;
		v.src = props.src;
	}, [props.src]);

	// Controlled `playing` writes — play state is a method call, not a prop.
	useEffect(() => {
		if (props.playing === undefined) return;
		setPlaying(props.playing);
		drive(host.current, props.playing);
	}, [props.playing]);

	const togglePlay = () => {
		const next = !playing;
		setPlaying(next);
		drive(host.current, next);
		props.onPlayingChange?.(next);
	};

	const handle = (v: any): VideoHandle => ({
		play: () => v.play(),
		pause: () => v.pause(),
		seekTo: (ms: number) => v.seekToTime(ms / 1000),
		currentTime: () => v.getCurrentTime(),
		duration: () => v.getDuration(),
		native: v,
	});

	<gridlayout
		id={props.id}
		rows="*"
		columns="*"
		className={cx('vx-layers', 'vx-video', props.className)}
		style={props.style}
		{...layoutChildProps(props)}
		accessible={props.accessible}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityRole={nativeAccessibilityRole(props.accessibilityRole) as any}
		accessibilityHint={props.accessibilityHint}
		accessibilityValue={props.accessibilityValue}
		accessibilityState={nativeAccessibilityState(props.accessibilityState) as any}
		accessibilityLiveRegion={props.accessibilityLiveRegion as any}
	>
		<xplatvideo
			ref={bindHost}
			autoplay={props.playing ?? props.autoPlay ?? false}
			controls={false}
			loop={props.loop}
			muted={muted}
			fill={FILLS[props.fit ?? 'contain']}
			observeCurrentTime={props.controls !== false}
			onFinished={() => {
				if (!props.loop) {
					setPlaying(false);
					props.onEnded?.();
				}
			}}
			onPlaybackReady={() => {
				const v = host.current;
				const ms = v?.getDuration?.() ?? 0;
				setDuration(ms);
				props.onReady?.({ duration: ms });
			}}
			onPlaybackStart={() => setStarted(true)}
			onCurrentTimeUpdated={(e: any) => setPosition(e.position ?? 0)}
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
					const next = !muted;
					setInternalMuted(next);
					if (host.current) host.current.muted = next;
					props.onMutedChange?.(next);
				}}
				onSeek={(ms: number) => {
					if (host.current) {
						host.current.seekToTime(ms / 1000);
						setPosition(ms);
					}
				}}
			/>
		}
	</gridlayout>
}
