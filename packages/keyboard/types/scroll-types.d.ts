/** Geometry policy for vertical focused-input scrolling. */
export interface KeyboardScrollOptions {
    /** Minimum gap around the input/caret, in window layout units. @default 8 */
    clearance?: number;
    /** Pause after a user scroll until focus/selection changes or recheck. @default 'pause' */
    manualScroll?: 'pause' | 'follow';
    /** Keep the resulting offset, or restore untouched offsets on close. @default 'preserve' */
    keyboardClose?: 'preserve' | 'restore';
}
export interface KeyboardScrollBinding {
    /** Explicitly resume visibility enforcement after validation or manual scrolling. */
    recheck(): void;
    /** Apply changed options without restarting window observation. */
    update(options: KeyboardScrollOptions): void;
    /** Release observation; preserves the current scroll position. */
    release(): void;
}
export interface KeyboardScrollService {
    /** Attach to a vertical scroll viewport. Only scroll ancestors through this
     * viewport are eligible; unrelated fields in the same window are ignored. */
    bind(host: object, options?: KeyboardScrollOptions): KeyboardScrollBinding;
}
