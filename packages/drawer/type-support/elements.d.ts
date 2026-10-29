import type { Attributes } from '@octane-xplat/jsx/intrinsics'
declare module '@octane-xplat/jsx/intrinsics' {
	interface NativeElements<TElement> {
		xplatDrawer: Attributes<TElement> & {
			gestureEnabled?: boolean
			backdropColor?: string
			backdropProperties?: Record<string, unknown>
		}
	}
}
