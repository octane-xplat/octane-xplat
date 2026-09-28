import { useEffect, useRef, useState } from 'octane';
import type { VideoHandle, VideoProps } from './props';
import { applyEscapeProps } from './escape-props';
import { layoutChildProps } from './layout-child.web';
import { VideoChrome } from './video-chrome.web.tsrx';

const MEDIA_ERR: Record<number, string> = {
	1: 'aborted',
	2: 'network',
	3: 'decode',
	4: 'source-not-supported',
};

/** Video — chrome-reset surface + self-drawn transport. The `<video>`
 *  element runs chrome-free (`controls` never set); the transport is the
 *  shared `VideoChrome` overlay, identical source on every target. Times
 *  are milliseconds — converted from the element's seconds at the
 *  boundary. */
export function Video(props: VideoProps) @{
	const el = useRef<HTMLVideoElement | null>(null);
	const [playing, setPlaying] = useState(props.playing ?? props.autoPlay ?? false);
	const [started, setStarted] = useState(false);
	const [position, setPosition] = useState(0);
	const [duration, setDuration] = useState(0);
	const [internalMuted, setInternalMuted] = useState(false);
	const muted = props.muted ?? internalMuted;

	const drive = (v: HTMLVideoElement | null, next: boolean) => {
		if (!v) return;
		if (next) {
			// Autoplay-with-sound rejection parks the leaf back in paused.
			v.play()?.catch(() => setPlaying(false));
		} else {
			v.pause();
		}
	};

	// Controlled `playing` writes land imperatively — the DOM renderer
	// diffs props, but play state is a method call, not an attribute.
	useEffect(() => {
		if (props.playing === undefined) return;
		setPlaying(props.playing);
		drive(el.current, props.playing);
	}, [props.playing]);

	// Uncontrolled autoplay start + controlled-prop mute echo.
	useEffect(() => {
		const v = el.current;
		if (!v) return;
		v.muted = muted;
		if (props.autoPlay || props.playing) {
			v.play()?.catch(() => setPlaying(false));
		}
	}, [muted]);

	const togglePlay = () => {
		const next = !playing;
		setPlaying(next);
		drive(el.current, next);
		props.onPlayingChange?.(next);
	};

	const handle = (v: HTMLVideoElement): VideoHandle => ({
		play: () => v.play(),
		pause: () => v.pause(),
		seekTo: (ms: number) => {
			v.currentTime = ms / 1000;
		},
		currentTime: () => v.currentTime * 1000,
		duration: () => (Number.isFinite(v.duration) ? v.duration * 1000 : 0),
		native: v,
	});

	<div
		id={props.id}
		className={['vx-stack', 'vx-video', props.className]}
		{...layoutChildProps(props, props.style)}
		role={props.accessibilityRole}
		aria-label={props.accessibilityLabel}
		aria-hidden={props.accessible === false ? true : undefined}
		aria-description={props.accessibilityHint}
		aria-valuetext={props.accessibilityValue}
		aria-disabled={props.accessibilityState?.disabled}
		aria-selected={props.accessibilityState?.selected}
		aria-checked={props.accessibilityState?.checked}
		aria-live={props.accessibilityLiveRegion === 'none' ? 'off' : props.accessibilityLiveRegion}
	>
		<video
			ref={(v: HTMLVideoElement | null) => {
				el.current = v;
				if (!v) return;
				v.muted = muted;
				applyEscapeProps(v, props);
				props.bind?.(handle(v));
			}}
			className="vx-video-surface"
			src={props.src}
			poster={props.poster}
			muted={muted}
			loop={props.loop}
			playsInline={true}
			preload="metadata"
			style={{ objectFit: props.fit ?? 'contain' }}
			onPlay={() => setPlaying(true)}
			onPause={() => setPlaying(false)}
			onPlaying={() => setStarted(true)}
			onLoadedMetadata={(e: any) => {
				const ms = e.currentTarget.duration * 1000;
				setDuration(Number.isFinite(ms) ? ms : 0);
				props.onReady?.({ duration: Number.isFinite(ms) ? ms : 0 });
			}}
			onTimeUpdate={(e: any) => setPosition(e.currentTarget.currentTime * 1000)}
			onEnded={() => {
				if (props.loop) return;
				setPlaying(false);
				props.onEnded?.();
			}}
			onError={(e: any) => {
				const code = e.currentTarget?.error?.code ?? 0;
				props.onError?.({ message: MEDIA_ERR[code] ?? 'unknown' });
			}}
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
					if (el.current) el.current.muted = next;
					props.onMutedChange?.(next);
				}}
				onSeek={(ms: number) => {
					if (el.current) {
						el.current.currentTime = ms / 1000;
						setPosition(ms);
					}
				}}
			/>
		}
	</div>
}
