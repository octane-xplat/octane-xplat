import { useEffect, useMemo, useRef, useState } from 'octane'
import { useMediaQuery } from '../../internal/platform/use-media-query'

export type StreamingTextSpeed = 'natural' | 'fast' | 'instant'
export interface UseStreamingTextOptions {
	speed?: StreamingTextSpeed
}

/** Smooth cumulative chunks; completed or reduced-motion text settles immediately.
 * Timers work on every host. Intl.Segmenter prevents partial emoji where available. */
export function useStreamingText(
	text: string,
	isStreaming: boolean,
	options: UseStreamingTextOptions = {},
): string {
	const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
	const [length, setLength] = useState(0)
	const previous = useRef('')
	const offset = useRef(0)
	const speed = options.speed ?? 'natural'
	useEffect(() => {
		if (!text.startsWith(previous.current)) {
			offset.current = 0
		}

		previous.current = text
		if (!isStreaming || speed === 'instant' || reducedMotion) {
			offset.current = text.length
			setLength(text.length)
			return
		}

		setLength(offset.current)
		const timer = setInterval(
			() => {
				offset.current = Math.min(text.length, offset.current + (speed === 'fast' ? 4 : 10))
				setLength(offset.current)
				if (offset.current >= text.length) {
					clearInterval(timer)
				}
			},
			speed === 'fast' ? 8 : 50,
		)

		return () => clearInterval(timer)
	}, [text, isStreaming, speed, reducedMotion])

	return useMemo(() => {
		if (!isStreaming || speed === 'instant' || reducedMotion) {
			return text
		}

		let end = Math.min(length, text.length)
		if (end > 0 && end < text.length) {
			if (typeof Intl.Segmenter === 'function') {
				end =
					new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text).containing(end)
						?.index ?? end
			} else if (/[\uDC00-\uDFFF]/.test(text[end])) {
				end--
			}
		}

		return text.slice(0, end)
	}, [text, isStreaming, speed, reducedMotion, length])
}
