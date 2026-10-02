import { useCallback, useEffect, useRef, useState } from 'octane'
import { IntersectionObserver } from './observer.web'
import { sameEntry } from './entries'
import type {
	IntersectionObserverEntry,
	UseIntersectionObserverOptions,
	UseIntersectionObserverResult,
} from './types'

/** Tracks a bound element's visibility against `root` (or the viewport).
 *  `ref`/`rootRef` attach to `ref` props; the observer is rebuilt when
 *  the bound targets or options change. */
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

		const observer = new IntersectionObserver(
			(entries) => {
				const latest = entries[entries.length - 1]
				setEntry((prev: IntersectionObserverEntry | null) =>
					sameEntry(prev, latest) ? prev : latest,
				)

				onChange.current?.(latest)
			},
			{ root, rootMargin: options.rootMargin, threshold: options.threshold },
		)

		observer.observe(target)
		return () => observer.disconnect()
	}, [target, root, options.rootMargin, threshold])

	const ref = useCallback(
		(el: any) => setTarget((current: any) => (current === el ? current : el)),
		[],
	)

	const rootRef = useCallback(
		(el: any) => setBoundRoot((current: any) => (current === el ? current : el)),
		[],
	)

	return { ref, rootRef, entry, isIntersecting: entry?.isIntersecting ?? false }
}
