// Vendored from @nativescript-community/ui-svg@0.2.24 (ISC) — SVGView only;
// CanvasSVG/ui-canvas dropped. Sources: index.android.js upstream.
/// <reference path="./typings/android.d.ts" />
import { File, Font, ImageAsset, ImageSource, Utils, knownFolders, path } from '@nativescript/core'
import { SVGView as SVGViewBase, srcProperty } from './index.common'

export function getSVG(src: string | ImageAsset | File): com.caverock.androidsvg.SVG | null {
	if (!src) {
		return null
	}

	let imagePath: any
	if (src instanceof File) {
		return com.caverock.androidsvg.SVG.getFromInputStream(
			new java.io.FileInputStream(new java.io.File(src.path)),
		)
	} else if (src instanceof ImageAsset) {
		imagePath = src.android
	} else {
		imagePath = src
	}

	if (Utils.isFileOrResourcePath(imagePath)) {
		const context = Utils.android.getApplicationContext()
		const res = context.getResources()
		if (!res) {
			return null
		}

		if (imagePath.indexOf(Utils.RESOURCE_PREFIX) === 0) {
			const resName = imagePath.substr(Utils.RESOURCE_PREFIX.length)
			const identifier = res.getIdentifier(
				resName,
				'drawable',
				Utils.android.getApplication().getPackageName(),
			)
			return com.caverock.androidsvg.SVG.getFromResource(res, identifier)
		} else if (imagePath.indexOf('~/') === 0) {
			const strPath = path.join(knownFolders.currentApp().path, imagePath.replace('~/', ''))
			const javaFile = new java.io.File(strPath)
			const stream = new java.io.FileInputStream(javaFile)
			return com.caverock.androidsvg.SVG.getFromInputStream(stream)
		} else if (imagePath.indexOf('/') === 0) {
			const javaFile = new java.io.File(imagePath)
			const stream = new java.io.FileInputStream(javaFile)
			return com.caverock.androidsvg.SVG.getFromInputStream(stream)
		}
	}

	return com.caverock.androidsvg.SVG.getFromString(imagePath)
}

class SVGExternalFileResolver extends com.caverock.androidsvg.SVGExternalFileResolver {
	override resolveFont(fontFamily: string, fontWeight: number, fontStyle: string) {
		if (fontFamily) {
			fontFamily = fontFamily.replace(/\\\//, '/')
		}
		return new Font(fontFamily, undefined as any, fontStyle.toLowerCase() as any, (fontWeight + '') as any).getAndroidTypeface()
	}

	override resolveImage(filename: string): globalAndroid.graphics.Bitmap {
		let bitmap = null
		if (Utils.isDataURI(filename)) {
			const base64Data = filename.split(',')[1]
			if (base64Data !== undefined) {
				bitmap = ImageSource.fromBase64(base64Data)
			}
		} else if (Utils.isFileOrResourcePath(filename)) {
			if (filename.indexOf(Utils.RESOURCE_PREFIX) !== 0) {
				if (filename.indexOf('~/') === 0) {
					filename = path.join(knownFolders.currentApp().path, filename.replace('~/', ''))
				}
			}
			bitmap = ImageSource.fromFileOrResourceSync(filename)
		}
		return bitmap as unknown as globalAndroid.graphics.Bitmap
	}
}

com.caverock.androidsvg.SVG.registerExternalFileResolver(new SVGExternalFileResolver())

class MySVGView extends android.view.View {
	private _svg: com.caverock.androidsvg.SVG | null = null
	private renderOptions: com.caverock.androidsvg.RenderOptions
	aspectRatio = 0

	constructor(context: any) {
		super(context)
		this.renderOptions = new com.caverock.androidsvg.RenderOptions()
	}

	override onDraw(canvas: android.graphics.Canvas): void {
		const svg = this._svg
		if (!svg) {
			return
		}
		this.renderOptions.viewPort(0, 0, this.getWidth(), this.getHeight())
		svg.renderToCanvas(canvas, this.renderOptions)
	}

	setSvg(svg: com.caverock.androidsvg.SVG | null): void {
		this._svg = svg
		if (svg) {
			svg.setDocumentWidth('100%')
			svg.setDocumentHeight('100%')
		}
		this.invalidate()
	}

	setRatio(ratio: com.caverock.androidsvg.PreserveAspectRatio): void {
		this.renderOptions.preserveAspectRatio(ratio)
	}

	override onMeasure(widthMeasureSpec: number, heightMeasureSpec: number): void {
		const svg = this._svg
		if (!svg) {
			super.onMeasure(widthMeasureSpec, heightMeasureSpec)
			return
		}
		// We don't call super because we measure native view with specific size.
		let width = Utils.layout.getMeasureSpecSize(widthMeasureSpec)
		const widthMode = Utils.layout.getMeasureSpecMode(widthMeasureSpec)
		let height = Utils.layout.getMeasureSpecSize(heightMeasureSpec)
		const heightMode = Utils.layout.getMeasureSpecMode(heightMeasureSpec)

		const image = svg.getDocumentViewBox()
		const finiteWidth = widthMode === Utils.layout.EXACTLY
		const finiteHeight = heightMode === Utils.layout.EXACTLY
		if (image || this.aspectRatio > 0) {
			const nativeWidth = image ? Utils.layout.toDevicePixels(image.width()) : 0
			const nativeHeight = image ? Utils.layout.toDevicePixels(image.height()) : 0
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
}

export class SVGView extends SVGViewBase {
	createNativeView() {
		return new MySVGView(this._context)
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
		;(this.nativeViewProtected as unknown as MySVGView).setSvg(getSVG(src))
	}

	[srcProperty.setNative](value: any) {
		this.handleSrc(value)
	}
}
