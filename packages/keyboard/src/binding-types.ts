/** @internal Native host policy used by framework-owned movement bindings. */
/** Low-level native translation policy. Offsets are device-independent pixels. */
export interface KeyboardBindingOptions {
	/** Do not observe or move the host while disabled. @default true */
	enabled?: boolean
	/** Additional upward clearance while the keyboard is open. @default 0 */
	openOffset?: number
	/** Upward displacement while closed. @default 0 */
	closedOffset?: number
	/** Space supplied by a safe-area/avoidance ancestor in the same window.
	 * Actual native resizing is measured separately. @default 0 */
	consumedBottom?: number
}

/** @internal Options can change without replacing the shared window source. */
export type KeyboardHostBinding = (() => void) & { update(): void }
