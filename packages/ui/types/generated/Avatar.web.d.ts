/** @jsxImportSource octane */
import type { AvatarProps } from "./props.js";
/**  Avatar — circular image with a text fallback when `src` is absent.
 *  `size` sets the square + border-radius inline so the circle is identical
 *  across targets. Image load failures still show the fallback only when
 *  `src` was never provided — no error detection, by design. */
export declare function Avatar(props: AvatarProps): import("octane/jsx-runtime").JSX.Element;
