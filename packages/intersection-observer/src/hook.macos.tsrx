/** @jsxImportSource @xplat/macos/renderer */
import { useCallback, useEffect, useRef, useState } from 'octane'
import { IntersectionObserver as PlatformIntersectionObserver } from './observer.macos'
import { sameEntry } from './entries'
import type {
	IntersectionObserverEntry,
	UseIntersectionObserverOptions,
	UseIntersectionObserverResult,
} from './types'

/** Tracks a bound AppKit view against `root` (or the window content area). */
export function useIntersectionObserver(
	options: UseIntersectionObserverOptions = {},
): UseIntersectionObserverResult {
	const [target, setTarget] = useState<any>(null)
	const [boundRoot, setBoundRoot] = useState<any>(null)
	const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null)
	const onChange = useRef(options.onChange)
	useEffect(() => {
		onChange.current = options.onChange
	})

	const root = options.root ?? boundRoot
	const threshold = Array.isArray(options.threshold)
		? options.threshold.join(',')
		: options.threshold

	useEffect(() => {
		if (!target) {
			setEntry(null)
			return
		}

		const observer = new PlatformIntersectionObserver(
			(entries) => {
				const latest = entries[entries.length - 1]
				setEntry((previous: IntersectionObserverEntry | null) =>
					sameEntry(previous, latest) ? previous : latest,
				)

				onChange.current?.(latest)
			},
			{ root, rootMargin: options.rootMargin, threshold: options.threshold },
		)

		observer.observe(target)
		return () => observer.disconnect()
	}, [target, root, options.rootMargin, threshold])

	const bind = useCallback(
		(view: any) => setTarget((current: any) => (current === view ? current : view)),
		[],
	)

	const bindRoot = useCallback(
		(view: any) => setBoundRoot((current: any) => (current === view ? current : view)),
		[],
	)

	return { bind, bindRoot, entry, isIntersecting: entry?.isIntersecting ?? false }
}
