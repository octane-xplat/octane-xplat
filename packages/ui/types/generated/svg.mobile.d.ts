import { SVGView } from './vendor/ui-svg/index.js';
import type { IconGlyph } from './props.js';
declare module '@nativescript-community/octane/intrinsics' {
    interface NativeScriptElements {
        svgview: Omit<Attributes<typeof SVGView>, 'src'> & {
            /** SVGView awaits promise srcs — remote .svg URLs arrive as fetched markup. */
            src?: string | Promise<string>;
            stretch?: 'none' | 'fill' | 'aspectFit' | 'aspectFill';
        };
    }
}
/** True when an `src` carries SVG: inline markup, an svg data URI, or an
 *  .svg path/URL. Anything else stays on the raster <image> path. */
export declare function isSvgSrc(src: string): boolean;
/** Normalize an svg-shaped src into SVGView's grammar: file/resource paths and
 *  markup pass through, data URIs decode to markup, remote URLs fetch to
 *  markup (SVGView has no fetch of its own — it awaits promise srcs). */
export declare function svgSource(src: string): string | Promise<string>;
/** IconGlyph → a full `<svg>` string for SVGView. `svg` path data gets a
 *  `<path>` with the requested fill; `markup` wraps inside a viewBox shell
 *  with `color`/`fill` set on the root so `currentColor` and default-fill
 *  children pick up the tint. */
export declare function glyphSvgMarkup(glyph: IconGlyph, color?: string): string | undefined;
