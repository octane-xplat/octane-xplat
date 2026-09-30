/**  @jsxImportSource @nativescript-community/octane */
import type { TooltipProps } from './props.js';
/**  Touch-target leaf: renders the trigger unchanged and never mounts the
 *  hint layer — hover/focus intent has no touch semantic (decision #47,
 *  revised). Keep essential information out of `content`; the pointer
 *  platforms (web, macOS) carry the real hover surface. */
export declare function Tooltip(props: TooltipProps): unknown;
