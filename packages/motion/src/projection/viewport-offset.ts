import type { Point } from './types'

/** Unsupported platform fallback; layout projection remains guarded by its barrier. */
export function captureViewportOffset(_view: any): () => Point {
	return () => ({ x: 0, y: 0 })
}
