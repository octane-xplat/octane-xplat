/** @jsxImportSource @octane-xplat/jsx/dom */
import { useEffect, useRef, useState } from 'octane'

/** Authored sandbox fetch simulation; owns and cancels its observer/timer. */
export function useJobBatches(count: number, resetKey: string) {
	const [limit, setLimit] = useState(15)
	const [loading, setLoading] = useState(false)
	const sentinelRef = useRef<HTMLDivElement | null>(null)
	useEffect(() => {
		setLimit(15)
		setLoading(false)
	}, [resetKey])

	useEffect(() => {
		const node = sentinelRef.current
		if (!node || limit >= count) {
			return
		}

		let timer: ReturnType<typeof setTimeout> | undefined
		const observer = new IntersectionObserver(
			(entries) => {
				if (!entries.some((entry) => entry.isIntersecting) || timer) {
					return
				}

				setLoading(true)
				timer = setTimeout(() => {
					setLimit((previous) => previous + 15)
					setLoading(false)
				}, 250)
			},
			{ rootMargin: '240px' },
		)

		observer.observe(node)
		return () => {
			observer.disconnect()
			clearTimeout(timer)
		}
	}, [count, limit, resetKey])

	return {
		limit,
		loading,
		sentinel: <div ref={sentinelRef} aria-hidden="true" className="sb-job-sentinel" />,
	}
}
