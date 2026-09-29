import type { TooltipProps } from './props.js';
/**
 * Delayed hover-intent tooltip anchored through Popover. `focusin`/`focusout`
 * bubble, so keyboard focus on a focusable child opens it without forcing a
 * tab stop on the wrapper; while open the resolved focusable element gets
 * `aria-describedby` pointing at the `role="tooltip"` panel. Escape, blur,
 * and scroll (capture, so nested scrollers count) dismiss.
 *
 * Web-only (the `ui/web` subpath) — hover/focus intent has no touch-platform
 * semantic and a long-press stand-in would repeat the Hoverable trap
 * (decision #47). */
export declare function Tooltip(props: TooltipProps): import("octane/jsx-runtime").JSX.Element;
