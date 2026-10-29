import type { HostObject } from '@octane-xplat/jsx/intrinsics'

/**
 * ui's types program resolves the default facade condition, so it does not
 * see the macOS-only attributes packages/jsx/src/macos.d.ts layers onto the
 * shared intrinsics; mirror them here for the AppKit leaves.
 * `placeholderTextColor` is consumed by macos-renderer (src/index.ts
 * ~1724/~2950) but not yet declared by the macOS facade.
 */
declare module '@octane-xplat/jsx/intrinsics' {
	interface MasonViewProps {
		accessibilityOrientation?: 'horizontal' | 'vertical'
	}
	interface TextBaseProps {
		accessibilityHeadingLevel?: 1 | 2 | 3 | 4 | 5 | 6
	}
	interface TextFieldProps<TElement> {
		placeholderTextColor?: string | HostObject
	}
}
