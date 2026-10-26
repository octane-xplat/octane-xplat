// The upstream lab's multi-algorithm pixel test requires a browser canvas.
export type Algorithm = 'gamma' | 'wcag' | 'apca'
import type { ImageSampleRegion } from '@octane-xplat/ui'
export function useImageModeTest(
	_src: string | null | undefined,
	options: {
		region?: ImageSampleRegion
		algorithm?: Algorithm
		fallback?: 'dark' | 'light' | null
	} = {},
): { mode: 'dark' | 'light' | null; value: number | null } {
	return { mode: options.fallback ?? null, value: null }
}
