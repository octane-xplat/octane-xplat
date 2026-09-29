import type { HoverableProps } from './props.js';
/**
 * Delayed hover intent with a card that remains open while the pointer moves
 * through the body portal to the card. `bind` is used instead of delegated
 * events so the anchor and portaled card can be tracked independently.
 *
 * Web-only (the `ui/web` subpath) — hover has no touch-platform semantic and
 * the old native leaf's long-press→popover stand-in was fake parity. */
export declare function Hoverable(props: HoverableProps): import("octane/jsx-runtime").JSX.Element;
