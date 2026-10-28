import type {} from '@octane-xplat/jsx/intrinsics'

// iOS-only safe-area escape consumed by the NativeScript driver; AppKit ignores it.
declare module '@octane-xplat/jsx/intrinsics' {
	interface MasonViewProps {
		iosOverflowSafeArea?: boolean
	}
}
