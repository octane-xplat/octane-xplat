import type { Attributes } from '@octane-xplat/jsx/intrinsics'

declare module '@octane-xplat/jsx/intrinsics' {
	interface NativeElements<TElement> {
		xplatbannerad: Attributes<TElement, { unitId?: string }>
	}
}
