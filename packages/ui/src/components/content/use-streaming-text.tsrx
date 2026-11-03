import { useEffect, useMemo, useRef, useState } from 'octane'
import { useMediaQuery } from '../../internal/platform/use-media-query.tsrx'
import { hostGlobal } from '../../internal/platform/host-bridge'
import { useTheme } from '../../theme/use-theme.tsrx'

/** Streaming reveal pace — natural typewriter cadence, fast, or instant. */
export type StreamingTextSpeed = 'natural' | 'fast' | 'instant'
/** Options for useStreamingText. */
export interface UseStreamingTextOptions {
	/** Reveal pace for incoming streamed text. */
	speed?: StreamingTextSpeed
}

// Fallback values when no theme is reachable (Astryx useStreamingText).
const FALLBACK_TICK_MS = 50
const FALLBACK_TICK_MS_FAST = 8

/** Parse a CSS duration string (e.g. "175ms", "0.15s") to milliseconds.
 *  Returns null if unparseable. */
export function parseCssDuration(value: string): number | null {
	const ms = value.match(/^([\d.]+)ms$/)
	if (ms) {
		return parseFloat(ms[1])
	}

	const s = value.match(/^([\d.]+)s$/)
	if (s) {
		return parseFloat(s[1]) * 1000
	}

	return null
}

const CHARS_PER_TICK = {
	natural: 10,
	fast: 4,
	instant: Infinity,
} as const

// One shared segmenter — granularity is fixed and locale does not affect
// grapheme-cluster boundaries (Astryx useStreamingText).
const graphemeSegmenter =
	typeof Intl.Segmenter === 'function'
		? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
		: null

function isLowSurrogate(codeUnit: number): boolean {
	return codeUnit >= 0xdc00 && codeUnit <= 0xdfff
}

/** Snap a UTF-16 code-unit offset down to the start of the grapheme cluster
 *  it falls inside, so slicing `text` there never splits a surrogate pair,
 *  flag sequence, or ZWJ emoji mid-glyph. Boundary offsets pass through.
 *  Without `Intl.Segmenter` only a lone low surrogate is held back — the
 *  Astryx fallback, narrower than full cluster awareness. */
export function snapToGraphemeBoundary(text: string, offset: number): number {
	if (offset <= 0 || offset >= text.length) {
		return offset
	}

	if (graphemeSegmenter) {
		return graphemeSegmenter.segment(text).containing(offset)?.index ?? offset
	}

	return isLowSurrogate(text.charCodeAt(offset)) ? offset - 1 : offset
}

interface FrameHost {
	request(callback: (time: number) => void): number
	cancel(id: number): void
}

/** rAF where the host provides it (web global, NativeScript animation-frame
 *  global), a ~16ms timer elsewhere — the same fallback VirtualList uses. */
function frameHost(): FrameHost {
	const request = hostGlobal<(cb: (time: number) => void) => number>('requestAnimationFrame')
	const cancel = hostGlobal<(id: number) => void>('cancelAnimationFrame')
	if (typeof request === 'function' && typeof cancel === 'function') {
		// Web rAF/cancel must run with the window receiver — calling the
		// detached globals as FrameHost methods throws "Illegal invocation"
		// and unmounts the whole tree on web. A bound call keeps the native
		// global (a plain function) working too.
		return {
			request: (callback) => request.call(globalThis, callback),
			cancel: (id) => cancel.call(globalThis, id),
		}
	}

	return {
		request: (callback) => setTimeout(() => callback(Date.now()), 16) as unknown as number,
		cancel: (id) => clearTimeout(id as unknown as ReturnType<typeof setTimeout>),
	}
}

/** Smooths bursty streamed text into a steady character-by-character reveal
 *  (Astryx `useStreamingText`, 0.7.4).
 *
 *  Returns a string that grows steadily toward `targetText`. When
 *  `isStreaming` is false, returns `targetText` immediately. Under a
 *  reduced-motion preference the reveal is skipped entirely.
 *
 *  The cadence advances a fixed number of UTF-16 code units per tick; the
 *  rendered slice snaps back to the nearest grapheme cluster boundary so a
 *  tick never renders a lone surrogate or partial emoji. Tick timing derives
 *  from the `--duration-fast-min` motion token: `natural` ticks at
 *  base/10 (13ms under the default 130ms token), `fast` at base/20 — the
 *  50ms/8ms fallbacks apply only with no theme in scope. The reveal loop
 *  keeps scheduling frames while streaming so late chunks keep draining. */
export function useStreamingText(
	targetText: string,
	isStreaming: boolean,
	options: UseStreamingTextOptions = {},
): string {
	const speed = options.speed ?? 'natural'
	const charsPerTick = CHARS_PER_TICK[speed]

	const { token } = useTheme()
	const tickMs = useMemo(() => {
		if (speed === 'instant') {
			return 0
		}

		const base = parseCssDuration(token('--duration-fast-min'))
		if (base == null) {
			return speed === 'fast' ? FALLBACK_TICK_MS_FAST : FALLBACK_TICK_MS
		}

		const tick = speed === 'fast' ? base / 20 : base / 10
		return Math.max(4, Math.round(tick))
	}, [token, speed])

	// `displayedLen` only ever changes inside the frame callback; the state is
	// a re-render trigger while the ref carries the value the slice reads, so
	// render-phase resets never need a setState.
	const [, bump] = useState(0)
	const targetRef = useRef(targetText)
	const displayedLenRef = useRef(0)
	const lastTickRef = useRef(0)
	targetRef.current = targetText

	// Reset when the target clears (new message), snap when the stream ends.
	// Both are render-phase ref writes like the reference: the returned slice
	// already reflects them through displayedLenRef.
	const prevTargetLenRef = useRef(targetText.length)
	if (targetText.length !== prevTargetLenRef.current) {
		prevTargetLenRef.current = targetText.length
		if (targetText.length === 0) {
			displayedLenRef.current = 0
		}
	}

	const prevIsStreamingRef = useRef(isStreaming)
	if (isStreaming !== prevIsStreamingRef.current) {
		prevIsStreamingRef.current = isStreaming
		if (!isStreaming && targetText.length > 0) {
			displayedLenRef.current = targetText.length
		}
	}

	const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

	useEffect(() => {
		if (!isStreaming || speed === 'instant' || prefersReducedMotion) {
			return
		}

		const host = frameHost()

		function tick(now: number) {
			const elapsed = now - lastTickRef.current
			if (elapsed >= tickMs) {
				lastTickRef.current = now
				const target = targetRef.current
				const currentLen = displayedLenRef.current
				if (currentLen < target.length) {
					displayedLenRef.current = Math.min(currentLen + charsPerTick, target.length)
					bump((n) => n + 1)
				}
			}

			frame = host.request(tick)
		}

		let frame = host.request(tick)
		return () => host.cancel(frame)
	}, [isStreaming, charsPerTick, tickMs, speed, prefersReducedMotion])

	if (!isStreaming || speed === 'instant' || prefersReducedMotion) {
		return targetText
	}

	return targetText.slice(0, snapToGraphemeBoundary(targetText, displayedLenRef.current))
}
