import type { Role } from './props.js';
/** Apply only the active device's escape bag after the primitive's own props. */
export declare function applyEscapeProps(view: any, props: {
    ios?: any;
    android?: any;
}): void;
/** Translate the shared/ARIA spelling to NativeScript's narrower role enum. */
export declare function nativeAccessibilityRole(role?: Role): string | undefined;
/** NativeScript's AccessibilityState is a single enum value, unlike the
 *  web's independent ARIA booleans. Priority follows the strongest state. */
export declare function nativeAccessibilityState(state?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean;
}): string | undefined;
