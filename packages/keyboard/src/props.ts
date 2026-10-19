import type { KeyboardAvoidingProps, ViewProps } from '@octane-xplat/ui'
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

/** Translate a control independently of surrounding layout as the native keyboard moves. */
export interface KeyboardStickyViewProps extends ViewProps {
	/** Disabled keeps its ordinary layout and releases native movement. @default true */
	enabled?: boolean
	/** Additional upward offset while open, in dips. @default 0 */
	openOffset?: number
	/** Upward offset while closed, in dips. @default 0 */
	closedOffset?: number
}
