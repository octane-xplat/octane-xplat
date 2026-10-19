import type { KeyboardAvoidingProps } from '@octane-xplat/ui'
/** Shared tracking for existing keyboard consumers. Native observers start with
 * the first window reader and stop with the last. Web/desktop are neutral.
 * @example
 * ```tsx
 * import { KeyboardProvider } from '@octane-xplat/keyboard'
 * import { KeyboardAvoiding, TextInput } from '@octane-xplat/ui'
 * <KeyboardProvider><KeyboardAvoiding><TextInput /></KeyboardAvoiding></KeyboardProvider>
 * ```
 */
export interface KeyboardProviderProps {
	children?: unknown
	/** Activate native tracking; false retains children and fallback behavior. @default true */
	enabled?: boolean
}

/** A vertical form that exposes the focused field/caret while the keyboard moves. */
export interface KeyboardAwareScrollViewProps extends Omit<KeyboardAvoidingProps, 'ref'> {
	/** Minimum visible gap; does not create scroll range. @default 8 */
	clearance?: number
	/** Additional bottom scroll range while the keyboard is open. @default 0 */
	extraScrollSpace?: number
	manualScroll?: 'pause' | 'follow'
	keyboardClose?: 'preserve' | 'restore'
	/** Mounted visibility binding; null on cleanup. */
	ref?: (binding: import('./scroll-types').KeyboardScrollBinding | null) => void
}
