/** @jsxImportSource @nativescript-community/octane */
import { useCallback, useEffect, useRef } from 'octane';
import { registerElement } from '@nativescript-community/octane';
import { isAndroid } from '@nativescript/core';
import { LottieView } from './vendor/ui-lottie/src/lottie';
import type { LottieHandle, LottieProps } from './props';
import { cx } from './cx.mobile';
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from './escape-props';
import { layoutChildProps } from './layout-child';

registerElement('xplatlottie', LottieView);

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

const STRETCH: Record<string, string> = {
	contain: 'aspectFit',
	cover: 'aspectFill',
	fill: 'fill',
};

/** Duration in ms on both platforms — the plugin's `duration` reports
 *  seconds on iOS and ms on Android. */
function durationMs(v: LottieView): number {
	const d = v.duration ?? 0;
	return isAndroid ? d : Math.max(0, d) * 1000;
}

function currentProgress(v: LottieView): number {
	// the native type is platform-divergent (LottieAnimationView vs
	// CompatibleAnimationView) — runtime branch is the narrowing.
	const nv = v.nativeViewProtected as any;
	return isAndroid ? (nv?.getProgress?.() ?? 0) : (nv?.currentProgress ?? 0);
}

/** Stop = pause + reset playhead. iOS `stop()` resets to the start;
 *  Android's `cancelAnimation()` ends the animator and the next
 *  `playAnimation()` restarts from 0. */
function stopView(v: LottieView) {
	if (isAndroid) v.cancelAnimation();
	else v.nativeViewProtected?.stop();

	v.progress = 0;
}

/** Lottie — vendored ui-lottie surface (see src/plugin). The plugin
 *  doesn't diff props, so src/play-state/speed/progress land imperatively
 *  in effects. `async` stays forced on: it keeps the load path uniform
 *  (one code path for inline/file/URL/.lottie) and avoids main-thread
 *  parse jank; autoPlay is re-applied when the composition lands. */
export function Lottie(props: LottieProps) @{
	const host = useRef<LottieView | null>(null);
	const appliedSrc = useRef<string | undefined>(undefined);
	const loadedRef = useRef(false);

	const bindHost = useCallback((v: LottieView) => {
		host.current = v;
	}, []);

	const wantPlay = () => props.playing ?? props.autoPlay ?? true;

	const onReady = () => {
		const v = host.current;
		if (!v || loadedRef.current) return;
		loadedRef.current = true;
		if (props.speed !== undefined) v.speed = props.speed;
		if (props.progress !== undefined) v.progress = clamp01(props.progress);
		props.onLoaded?.({ duration: durationMs(v) });
		if (wantPlay() && !v.isAnimating()) v.playAnimation();
	};

	// Mount wiring — events first so a synchronous src assignment can't
	// race past them.
	useEffect(() => {
		const v = host.current;
		if (!v) return;
		applyEscapeProps(v, props);
		v.stretch = STRETCH[props.fit ?? 'contain'] as any;
		v.async = true;

		v.on(LottieView.compositionLoadedEvent, () => onReady());
		v.on(LottieView.loadFailedEvent, (e: any) => {
			loadedRef.current = false;
			props.onError?.({ message: e?.error ? String(e.error) : 'load failed' });
		});

		// The vendored fix reports a single `false` on cancel — only a
		// `true` finish reaches onEnded.
		v.completionBlock = (finished: boolean) => {
			if (finished) props.onEnded?.();
		};

		props.bind?.(handle(v));
	}, []);

	// src — applied imperatively after the listeners exist.
	useEffect(() => {
		const v = host.current;
		if (!v) return;
		const src = props.data ? JSON.stringify(props.data) : props.src;
		if (src === appliedSrc.current) return;
		appliedSrc.current = src;
		loadedRef.current = false;
		v.src = src ?? '';
	}, [props.src, props.data]);

	// Controlled `playing` — play state is a method call, not a prop.
	useEffect(() => {
		const v = host.current;
		if (!v || props.playing === undefined) return;
		if (props.playing) {
			if (loadedRef.current) v.resumeAnimation();
			// not loaded yet — onReady picks it up via wantPlay()
		} else {
			v.pauseAnimation();
		}
	}, [props.playing]);

	useEffect(() => {
		const v = host.current;
		if (!v || props.progress === undefined || !loadedRef.current) return;
		v.progress = clamp01(props.progress);
	}, [props.progress]);

	useEffect(() => {
		const v = host.current;
		if (!v || props.speed === undefined || !loadedRef.current) return;
		v.speed = props.speed;
	}, [props.speed]);

	const handle = (v: LottieView): LottieHandle => ({
		play: () => v.resumeAnimation(),
		pause: () => v.pauseAnimation(),
		stop: () => stopView(v),
		seekTo: (p: number) => {
			v.progress = clamp01(p);
		},
		setSpeed: (n: number) => {
			v.speed = n;
		},
		progress: () => currentProgress(v),
		duration: () => durationMs(v),
		isPlaying: () => v.isAnimating(),
		native: v,
	});

	<xplatlottie
		ref={bindHost}
		id={props.id}
		className={cx(props.className)}
		style={props.style}
		{...layoutChildProps(props)}
		loop={props.loop ?? false}
		accessible={props.accessible}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityRole={nativeAccessibilityRole(props.accessibilityRole) as any}
		accessibilityHint={props.accessibilityHint}
		accessibilityValue={props.accessibilityValue}
		accessibilityState={nativeAccessibilityState(props.accessibilityState) as any}
		accessibilityLiveRegion={props.accessibilityLiveRegion as any}
	/>
}
