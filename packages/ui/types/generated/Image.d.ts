import type { ImageProps } from './props.js';
/**  Image — NS <image>. `src` accepts the NS ImageSource grammar:
 *  res://name, ~/bundle-path, file path, remote URL, or data: URI. SVG srcs
 *  (inline markup, svg data URIs, .svg paths/URLs) route to <svgview> —
 *  remote .svg URLs fetch to markup since SVGView has no fetch of its own.
 *  `alt` maps to accessibilityLabel (RN calls it `alt` on web parity). */
export declare function Image(props: ImageProps): unknown;
