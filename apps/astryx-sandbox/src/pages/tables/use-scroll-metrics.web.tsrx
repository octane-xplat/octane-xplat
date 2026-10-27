import { useEffect, useRef, useState } from 'octane'

/** Browser frame samples, independent of renderer commit timing. */
export function useScrollMetrics() {
	const [result, setResult] = useState({ running: false, frames: 0, drops: 0, fps: 0 })
	const frameRef = useRef(0)
	useEffect(() => () => cancelAnimationFrame(frameRef.current), [])
	const run = (container: HTMLElement | null) => {
		if (!container || result.running) {
			return
		}

		const distance = container.scrollHeight - container.clientHeight
		if (distance <= 0) {
			return
		}

		const start = performance.now()
		let previous = start
		let frames = 0
		let drops = 0
		setResult({ running: true, frames: 0, drops: 0, fps: 0 })
		const step = (now: number) => {
			frames++
			if (now - previous > 20) {
				drops++
			}

			previous = now
			const elapsed = now - start
			const fraction = Math.min(elapsed / 2400, 1)
			container.scrollTop = distance * (fraction < 0.5 ? fraction * 2 : (1 - fraction) * 2)
			if (fraction < 1) {
				frameRef.current = requestAnimationFrame(step)
			} else {
				frameRef.current = 0
				setResult({ running: false, frames, drops, fps: Math.round((frames * 1000) / elapsed) })
			}
		}

		frameRef.current = requestAnimationFrame(step)
	}

	return { ...result, run }
}
