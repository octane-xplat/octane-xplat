/**  @jsxImportSource @nativescript-community/octane */
import type { HoverableProps } from './props.js';
/**  Touch-target leaf: renders the children unchanged and never mounts the
 *  hover card — pointer intent has no touch semantic. A long-press stand-in
 *  is deliberately not provided (the fake-parity trap from decision #44).
 *  Keep essential information out of `card`; the pointer platforms (web,
 *  macOS) carry the real hover surface. */
export declare function Hoverable(props: HoverableProps): unknown;
