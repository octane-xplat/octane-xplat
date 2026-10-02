import { registerElement } from '@nativescript-community/octane'
import { SVGView } from './vendor/ui-svg/src'

export { glyphSvgMarkup, isSvgSrc, svgSource } from './svg-source'

// Vendored ui-svg SVGView (Icon + Image + Meter route SVG sources here
// unconditionally): SVGView renders via androidsvg on Android, SVGKit on iOS.
// Its src grammar is File / ImageAsset / res:// / ~/, or an inline markup
// string.
registerElement('svgview', SVGView)
