// Vendored from @nativescript-community/ui-svg@0.2.24 (ISC) — SVGView only;
// CanvasSVG/ui-canvas dropped. Sources: index.ios.js upstream.
/// <reference path="./typings/ios.d.ts" />
/// <reference path="./typings/SVGKit.d.ts" />
import { File, ImageAsset, Utils, knownFolders, path } from '@nativescript/core'
import { SVGView as SVGViewBase, srcProperty, stretchProperty } from './index.common'

function getUIImageScaleType(scaleType: string): number | null {
	switch (scaleType) {
		case 'aspectFill':
			return 2 /* UIViewContentMode.ScaleAspectFill */
		case 'aspectFit':
			return 1 /* UIViewContentMode.ScaleAspectFit */
		case 'fill':
			return 0 /* UIViewContentMode.ScaleToFill */
		case 'none':
			return 9 /* UIViewContentMode.TopLeft */
		default:
			break
	}
	return null
}

export function getSVGKImage(src: string | ImageAsset | File): SVGKImage | null {
	if (!src) {
		return null
	}

	let imagePath: any
	if (src instanceof File) {
		return SVGKImage.alloc().initWithData(NSData.alloc().initWithContentsOfFile(src.path))
	} else if (src instanceof ImageAsset) {
		imagePath = src.ios
	} else {
		imagePath = src
	}

	if (Utils.isFileOrResourcePath(imagePath)) {
		if (imagePath.indexOf(Utils.RESOURCE_PREFIX) === 0) {
			const resName = imagePath.slice(Utils.RESOURCE_PREFIX.length)
			return SVGKImage.imageNamed(resName)
		} else if (imagePath.indexOf('~/') === 0) {
			const strPath = path.join(knownFolders.currentApp().path, imagePath.replace('~/', ''))
			return SVGKImage.imageWithContentsOfFile(strPath)
		} else if (imagePath.indexOf('/') === 0) {
			return SVGKImage.imageWithContentsOfFile(imagePath)
		}
	}

	return SVGKImage.imageWithSource(SVGKSourceString.sourceFromContentsOfString(imagePath))
}

export class SVGView extends SVGViewBase {
	aspectRatio = 0
	_imageSourceAffectsLayout = false

	createNativeView() {
		const view = SVGKFastImageView.alloc().initWithFrame(CGRectZero)
		view.backgroundColor = UIColor.clearColor
		view.opaque = false
		return view
	}

	_setNativeClipToBounds(): void {
		// Always set clipsToBounds for images
		this.nativeViewProtected.clipsToBounds = true
	}

	onMeasure(widthMeasureSpec: number, heightMeasureSpec: number): void {
		const svgImage = (this.nativeViewProtected as SVGKFastImageView).image
		if (!svgImage) {
			super.onMeasure(widthMeasureSpec, heightMeasureSpec)
			return
		}

		const width = Utils.layout.getMeasureSpecSize(widthMeasureSpec)
		const widthMode = Utils.layout.getMeasureSpecMode(widthMeasureSpec)
		const height = Utils.layout.getMeasureSpecSize(heightMeasureSpec)
		const heightMode = Utils.layout.getMeasureSpecMode(heightMeasureSpec)

		const imageSize = svgImage.size
		const finiteWidth = widthMode === Utils.layout.EXACTLY
		const finiteHeight = heightMode === Utils.layout.EXACTLY
		this._imageSourceAffectsLayout = !finiteWidth || !finiteHeight
		if (imageSize || this.aspectRatio > 0) {
			const nativeWidth = imageSize ? Utils.layout.toDevicePixels(imageSize.width) : 0
			const nativeHeight = imageSize ? Utils.layout.toDevicePixels(imageSize.height) : 0
			const imgRatio = nativeWidth / nativeHeight
			const ratio = this.aspectRatio || imgRatio
			if (finiteWidth || finiteHeight) {
				if (!finiteWidth) {
					widthMeasureSpec = Utils.layout.makeMeasureSpec(height * ratio, Utils.layout.EXACTLY)
				}
				if (!finiteHeight) {
					heightMeasureSpec = Utils.layout.makeMeasureSpec(width * ratio, Utils.layout.EXACTLY)
				}
			} else {
				const viewRatio = width / (height || 1000000000000)
				if (imgRatio > viewRatio) {
					const w = Math.min(nativeWidth, width)
					widthMeasureSpec = Utils.layout.makeMeasureSpec(w, Utils.layout.EXACTLY)
					heightMeasureSpec = Utils.layout.makeMeasureSpec(w / ratio, Utils.layout.EXACTLY)
				} else {
					const h = Math.min(nativeHeight, height)
					heightMeasureSpec = Utils.layout.makeMeasureSpec(h, Utils.layout.EXACTLY)
					widthMeasureSpec = Utils.layout.makeMeasureSpec(h * ratio, Utils.layout.EXACTLY)
				}
			}
		}
		super.onMeasure(widthMeasureSpec, heightMeasureSpec)
	}

	async handleSrc(src: any): Promise<void> {
		if (src instanceof Promise) {
			try {
				this.handleSrc(await src)
			} catch (error) {
				this.handleSrc(null)
			}
			return
		} else if (typeof src === 'function') {
			let newSrc = src()
			if (newSrc instanceof Promise) {
				try {
					await newSrc
				} catch (error) {
					newSrc = null
				}
			}
			this.handleSrc(newSrc)
			return
		}
		;(this.nativeViewProtected as SVGKFastImageView).image = getSVGKImage(src) as SVGKImage
		if (this._imageSourceAffectsLayout) {
			this._imageSourceAffectsLayout = false
			this.requestLayout()
		}
	}

	[srcProperty.setNative](value: any) {
		this.handleSrc(value)
	}

	[stretchProperty.setNative](value: 'none' | 'aspectFill' | 'aspectFit' | 'fill') {
		this.nativeViewProtected.contentMode = getUIImageScaleType(value) as UIViewContentMode
	}
}
