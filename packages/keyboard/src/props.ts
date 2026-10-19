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
