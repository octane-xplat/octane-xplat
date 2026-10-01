/** @jsxImportSource @nativescript-community/octane */
import { useCallback, useEffect, useRef } from 'octane';
import { registerElement } from '@nativescript-community/octane';
import type { Attributes } from '@nativescript-community/octane/intrinsics';
import { isAndroid } from '@nativescript/core';
import { LottieView } from '@nativescript-community/ui-lottie';
import type { LottieHandle, LottieProps } from './props';
import { cx } from './cx.mobile';
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from './escape-props';
import { layoutChildProps } from './layout-child';

declare module '@nativescript-community/octane/intrinsics' {
	interface NativeScriptElements {
		xplatlottie: Attributes<typeof LottieView>;
	}
}

registerElement('xplatlottie', LottieView);

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

const STRETCH: Record<string, string> = {
	contain: 'aspectFit',
	cover: 'aspectFill',
	fill: 'fill',
};

/** A composition is readable once the native view can report it —
 *  `getComposition()` on Android, `animationDuration >= 0` on iOS
 *  (`CompatibleAnimationView` returns -1 while `animation` is nil). */
function isLoaded(v: any): boolean {
	const nv = v.nativeViewProtected;
	return isAndroid ? !!nv?.getComposition?.() : (nv?.animationDuration ?? -1) >= 0;
}

/** Duration in ms on both platforms — the plugin's `duration` reports
 *  seconds on iOS and ms on Android. */
function durationMs(v: any): number {
	const nv = v.nativeViewProtected;
	if (!nv) return 0;
	if (isAndroid) return nv.getDuration?.() ?? 0;
	const s = nv.animationDuration ?? -1;
	return s >= 0 ? s * 1000 : 0;
}

function currentProgress(v: any): number {
	const nv = v.nativeViewProtected;
	return isAndroid ? (nv?.getProgress?.() ?? 0) : (nv?.currentProgress ?? 0);
}

// npm 6.0.0 exposes no pause/resume — the native views have the methods
// (fix merged on the fork: feat/pause-resume). Walk the fallbacks.
function pauseView(v: any) {
	if (typeof v.pauseAnimation === 'function') return v.pauseAnimation();
	const nv = v.nativeViewProtected;
	if (typeof nv?.pauseAnimation === 'function') return nv.pauseAnimation();
	if (typeof nv?.pause === 'function') return nv.pause();
	v.cancelAnimation?.();
}

function resumeView(v: any) {
	if (typeof v.resumeAnimation === 'function') return v.resumeAnimation();
	const nv = v.nativeViewProtected;
	if (typeof nv?.resumeAnimation === 'function') return nv.resumeAnimation();
	if (typeof nv?.play === 'function') return nv.play();
	v.playAnimation?.();
}

/** Stop = pause + reset playhead. iOS `stop()` resets to the start;
 *  Android's `cancelAnimation()` ends the animator and the next
 *  `playAnimation()` restarts from 0. */
function stopView(v: any) {
	const nv = v.nativeViewProtected;
	if (isAndroid) v.cancelAnimation?.();
	else if (typeof nv?.stop === 'function') nv.stop();
	else v.cancelAnimation?.();

	v.progress = 0;
}

/** Lottie — @nativescript-community/ui-lottie surface. The plugin doesn't
 *  diff props, so src/play-state/speed/progress land imperatively in
 *  effects. `async` is forced on: npm 6.0.0's sync src path is dead code
 *  (an uninitialized `LottieCompositionFactory` — fix lives on fork
 *  branch fix/android-sync-src). Readiness comes from the plugin's
 *  `compositionLoaded` event where it exists (fork feat/load-events),
 *  with a polling fallback for npm 6.0.0, where iOS never fires it and
 *  autoPlay is a no-op for async loads (fix/android-async-autoplay). */
export function Lottie(props: LottieProps) @{
	const host = useRef<any>(null);
	const appliedSrc = useRef<string | undefined>(undefined);
	const loadedRef = useRef(false);
	const pollTimer = useRef<any>(null);
	const suppressEnd = useRef(false);

	const bindHost = useCallback((v: any) => {
		host.current = v;
	}, []);

	const wantPlay = () => props.playing ?? props.autoPlay ?? true;

	const stopPoll = () => {
		if (pollTimer.current) {
			clearInterval(pollTimer.current);
			pollTimer.current = null;
		}
	};

	const onReady = () => {
		const v = host.current;
		if (!v || loadedRef.current) return;
		loadedRef.current = true;
		stopPoll();
		if (props.speed !== undefined) v.speed = props.speed;
		if (props.progress !== undefined) v.progress = clamp01(props.progress);
		props.onLoaded?.({ duration: durationMs(v) });
		if (wantPlay() && !v.isAnimating?.()) v.playAnimation();
	};

	// Polling fallback — npm 6.0.0 has no compositionLoaded on iOS, and the
	// same poll covers the async autoPlay gap on Android. On the fork the
	// real event wins first and the poll stops on the ready flag.
	const startPoll = () => {
		stopPoll();
		let waited = 0;
		pollTimer.current = setInterval(() => {
			const v = host.current;
			if (!v) return stopPoll();
			waited += 50;
			if (isLoaded(v)) return onReady();
			// npm has no failure event — a timeout is the only signal.
			if (waited >= 10000) {
				stopPoll();
				props.onError?.({ message: 'load timeout' });
			}
		}, 50);
	};

	// Mount wiring — events first so a synchronous src assignment can't
	// race past them.
	useEffect(() => {
		const v = host.current;
		if (!v) return;
		applyEscapeProps(v, props);
		// `stretch` is a registered Property missing from index.d.ts on
		// npm 6.0.0 (fork: fix/dts-props) — write it imperatively.
		(v as any).stretch = STRETCH[props.fit ?? 'contain'];

		v.on?.('compositionLoaded', () => onReady());
		v.on?.('loadFailed', (e: any) => {
			loadedRef.current = false;
			stopPoll();
			props.onError?.({ message: e?.error ? String(e.error) : 'load failed' });
		});

		// npm 6.0.0 fires the block twice on cancel: [false] then a
		// spurious `true` (fix/android-completion-cancel). The pair lands
		// in the same tick — suppress only a `true` that directly follows
		// a `false`.
		v.completionBlock = (finished: boolean) => {
			if (!finished) {
				suppressEnd.current = true;
				setTimeout(() => (suppressEnd.current = false), 0);
				return;
			}

			if (suppressEnd.current) return;
			props.onEnded?.();
		};

		props.bind?.(handle(v));
		return () => stopPoll();
	}, []);

	// src — applied imperatively after the listeners exist.
	useEffect(() => {
		const v = host.current;
		if (!v) return;
		const src = props.data ? JSON.stringify(props.data) : props.src;
		if (src === appliedSrc.current) return;
		appliedSrc.current = src;
		loadedRef.current = false;
		if (!src) {
			v.src = '';
			return;
		}

		// Workaround: sync src loading is dead on npm 6.0.0 Android
		// (fork: fix/android-sync-src). `async` is a registered Property
		// missing from the plugin's index.d.ts (fork: fix/dts-props).
		(v as any).async = true;
		v.src = src;
		startPoll();
	}, [props.src, props.data]);

	// Controlled `playing` — play state is a method call, not a prop.
	useEffect(() => {
		const v = host.current;
		if (!v || props.playing === undefined) return;
		if (props.playing) {
			if (loadedRef.current) resumeView(v);
			// not loaded yet — onReady picks it up via wantPlay()
		} else {
			pauseView(v);
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

	const handle = (v: any): LottieHandle => ({
		play: () => resumeView(v),
		pause: () => pauseView(v),
		stop: () => stopView(v),
		seekTo: (p: number) => {
			v.progress = clamp01(p);
		},
		setSpeed: (n: number) => {
			v.speed = n;
		},
		progress: () => currentProgress(v),
		duration: () => durationMs(v),
		isPlaying: () => v.isAnimating?.() ?? false,
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
