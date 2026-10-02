import { CSSType, Property, Utils, View } from '@nativescript/core'
import { registerElement } from '@nativescript-community/octane'
import './svg-element'
export { glyphSvgMarkup, isSvgSrc, svgSource } from './svg-source'

const sourceProperty = new Property<SVGView, string | Promise<string>>({
	name: 'src',
	defaultValue: '',
})
const stretchProperty = new Property<SVGView, string>({
	name: 'stretch',
	defaultValue: 'aspectFit',
})
const stretches: Record<string, number> = { none: 0, fill: 1, aspectFit: 2, aspectFill: 3 }
const windows = () => globalThis as any

function sourceUri(source: string): string {
	if (source.startsWith('~/')) return `ms-appx:///app/${source.slice(2)}`
	if (/^[a-z]:[\\/]/i.test(source)) return `file:///${source.replace(/\\/g, '/')}`
	if (/^[a-z][a-z\d+.-]*:/i.test(source)) return source
	return `ms-appx:///app/${source.replace(/^\//, '')}`
}

/** WinUI owns SVG decoding; no iOS/Android plugin enters the Windows graph. */
class SVGView extends View {
	declare src: string | Promise<string>
	declare stretch: string
	nativeViewProtected: any
	private image: any
	private pending: any
	private generation = 0

	createNativeView() {
		const { Microsoft } = windows()
		const border = new Microsoft.UI.Xaml.Controls.Border()
		this.image = new Microsoft.UI.Xaml.Controls.Image()
		border.Child = this.image
		return border
	}

	private clearPending() {
		if (!this.pending) return
		this.pending.Opened = null
		this.pending.OpenFailed = null
		this.pending = null
	}

	disposeNativeView() {
		this.generation++
		this.clearPending()
		this.image = null
		super.disposeNativeView()
	}

	[sourceProperty.setNative](value: string | Promise<string>) {
		const generation = ++this.generation
		this.clearPending()
		const fail = (error: unknown) => {
			if (generation === this.generation) {
				this.clearPending()
				console.error('[SVGView] Windows SVG load failed', error)
			}
		}
		void Promise.resolve(value)
			.then(async (source) => {
				if (generation !== this.generation || !this.image) return
				const { Windows, NSWinRT, Microsoft } = windows()
				let stream: any
				if (source.trimStart().startsWith('<')) {
					const writer = new Windows.Storage.Streams.DataWriter()
					writer.WriteString(source)
					const buffer = writer.DetachBuffer()
					stream = new Windows.Storage.Streams.InMemoryRandomAccessStream()
					await NSWinRT.toPromise(stream.WriteAsync(buffer))
					stream.Seek(0)
				}
				Utils.executeOnMainThread(() => {
					if (generation !== this.generation || !this.image) return
					try {
						if (!source) {
							this.image.Source = null
							return
						}
						const svg = new Microsoft.UI.Xaml.Media.Imaging.SvgImageSource()
						this.pending = svg
						// The preview bridge cannot resolve this generic enum-result operation.
						// Native completion events work, including invalid-source recovery.
						svg.Opened = () => {
							if (generation === this.generation) this.clearPending()
						}
						svg.OpenFailed = () => fail(new Error('Unable to decode SVG'))
						this.image.Source = svg
						if (stream) svg.SetSourceAsync(stream)
						else svg.UriSource = new Windows.Foundation.Uri(sourceUri(source))
					} catch (error) {
						fail(error)
					}
				})
			})
			.catch(fail)
	}

	[stretchProperty.setNative](value: string) {
		this.image.Stretch = stretches[value] ?? stretches.aspectFit
	}
}

CSSType('SVGView')(SVGView)
sourceProperty.register(SVGView)
stretchProperty.register(SVGView)
registerElement('svgview', SVGView)
