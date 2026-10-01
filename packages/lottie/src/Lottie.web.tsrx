import lottie, { type AnimationItem } from 'lottie-web';
import { useEffect, useRef } from 'octane';
import type { LottieHandle, LottieProps } from './props';
import { applyEscapeProps } from './escape-props.web';
import { layoutChildProps } from './layout-child.web';

const PRESERVE: Record<string, string> = {
	contain: 'xMidYMid meet',
	cover: 'xMidYMid slice',
	fill: 'none',
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** Lottie — lottie-web's svg renderer in a plain container div. Everything
 *  is imperative: `src`/`data` rebuild the AnimationItem, the rest are
 *  method calls applied in effects. Progress is normalized 0..1
 *  (lottie-web speaks frames); durations arrive in seconds and are
 *  surfaced as ms. */
export function Lottie(props: LottieProps) @{
	const el = useRef<HTMLDivElement | null>(null);
	const anim = useRef<AnimationItem | null>(null);
	const ready = useRef(false);

	const wantPlay = () => props.playing ?? props.autoPlay ?? true;

	const build = (host: HTMLDivElement) => {
		anim.current?.destroy();
		anim.current = null;
		ready.current = false;

		const animationData = props.data ?? (props.src?.startsWith('{') ? JSON.parse(props.src) : undefined);
		const path = animationData ? undefined : props.src;
		if (!animationData && !path) return;

		const a = lottie.loadAnimation({
			container: host,
			renderer: 'svg',
			loop: props.loop ?? false,
			autoplay: false, // leaf owns play state — uniform with native
			animationData,
			path,
			rendererSettings: { preserveAspectRatio: PRESERVE[props.fit ?? 'contain'] },
		});

		anim.current = a;

		a.addEventListener('DOMLoaded', () => {
			ready.current = true;
			if (props.speed !== undefined) a.setSpeed(props.speed);
			if (props.progress !== undefined) seekTo(props.progress);
			props.onLoaded?.({ duration: a.getDuration() * 1000 });
			if (wantPlay()) a.play();
		});

		a.addEventListener('complete', () => props.onEnded?.());
		a.addEventListener('data_failed', () => props.onError?.({ message: 'animation data failed to load' }));
		a.addEventListener('error', () => props.onError?.({ message: 'animation failed' }));
	};

	const seekTo = (p: number) => {
		const a = anim.current;
		if (!a) return;
		const frame = clamp01(p) * a.totalFrames;
		// goToAndStop parks the playhead — keep playing state instead.
		if (a.isPaused) a.goToAndStop(frame, true);
		else a.goToAndPlay(frame, true);
	};

	// Build once the container exists; rebuild on src/data/fit changes.
	useEffect(() => {
		const host = el.current;
		if (!host) return;
		build(host);
		return () => {
			anim.current?.destroy();
			anim.current = null;
			ready.current = false;
		};
	}, [props.src, props.data, props.fit]);

	useEffect(() => {
		if (props.loop !== undefined && anim.current) {
			anim.current.loop = props.loop;
		}
	}, [props.loop]);

	useEffect(() => {
		if (props.playing === undefined || !anim.current || !ready.current) return;
		if (props.playing) anim.current.play();
		else anim.current.pause();
	}, [props.playing]);

	useEffect(() => {
		if (props.progress === undefined) return;
		seekTo(props.progress);
	}, [props.progress]);

	useEffect(() => {
		if (props.speed !== undefined) anim.current?.setSpeed(props.speed);
	}, [props.speed]);

	const handle = (a: AnimationItem): LottieHandle => ({
		play: () => a.play(),
		pause: () => a.pause(),
		stop: () => a.stop(),
		seekTo,
		setSpeed: (n: number) => a.setSpeed(n),
		progress: () => (a.totalFrames ? a.currentRawFrame / a.totalFrames : 0),
		duration: () => a.getDuration() * 1000,
		isPlaying: () => !a.isPaused,
		native: a,
	});

	<div
		ref={(v: HTMLDivElement | null) => {
			el.current = v;
			if (!v) return;
			applyEscapeProps(v, props);
			if (anim.current) props.bind?.(handle(anim.current));
		}}
		id={props.id}
		className={props.className}
		{...layoutChildProps(props, props.style)}
		role={props.accessibilityRole ?? 'img'}
		aria-label={props.accessibilityLabel}
		aria-hidden={props.accessible === false ? true : undefined}
		aria-description={props.accessibilityHint}
		aria-valuetext={props.accessibilityValue}
		aria-disabled={props.accessibilityState?.disabled}
		aria-selected={props.accessibilityState?.selected}
		aria-checked={props.accessibilityState?.checked}
		aria-live={props.accessibilityLiveRegion === 'none' ? 'off' : props.accessibilityLiveRegion}
	/>
}
