// Vendored from @nativescript-community/ui-svg@0.2.24 (ISC — see LICENSE in
// this directory). Only the SVGView path is ported: the canvas-backed
// CanvasSVG element and its @nativescript-community/ui-canvas dependency are
// deliberately dropped. Sources: index.common.js upstream.
import { CSSType, File, ImageAsset, Property, View } from '@nativescript/core'

export type Stretch = 'none' | 'fill' | 'aspectFill' | 'aspectFit'

export const srcProperty = new Property<SVGView, string | ImageAsset | File>({ name: 'src' })
export const stretchProperty = new Property<SVGView, Stretch>({ name: 'stretch' })

@CSSType('SVGView')
export class SVGView extends View {
	declare src: string
}

srcProperty.register(SVGView)
stretchProperty.register(SVGView)
