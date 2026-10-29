import { File, View } from '@nativescript/core'
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import { checkDimensions } from './options'
import type { CaptureBackend } from './backend-types'
import type { NormalizedCaptureOptions } from './types'

// The experimental Windows host supplies dynamic WinRT projections. Keep the
// whole buffer native: its preview bridge cannot marshal JS arrays to byte[].
const projection = () => globalThis as unknown as { Windows?: any; Microsoft?: any; NSWinRT?: any }
const owned = new Map<string, string>()
function available(): boolean {
	try {
		const { Windows, Microsoft, NSWinRT } = projection()
		return Boolean(
			Microsoft?.UI?.Xaml?.Media?.Imaging?.RenderTargetBitmap &&
			Windows?.Graphics?.Imaging?.SoftwareBitmap?.CreateCopyFromBuffer &&
			Windows?.Graphics?.Imaging?.BitmapEncoder?.CreateAsync &&
			Windows?.Storage?.Streams?.InMemoryRandomAccessStream &&
			NSWinRT?.toPromise,
		)
	} catch {
		return false
	}
}
function nativeView(target: object): any {
	if (!available()) {
		throw new UnavailabilityError('View capture in this Windows runtime projection')
	}
	const view = target instanceof View ? target.nativeViewProtected : target
	const host = view as any
	if (!host?.XamlRoot || !(host.ActualWidth > 0 && host.ActualHeight > 0)) {
		throw new Error('Windows capture requires an attached, laid-out XAML host')
	}
	const helper = projection().Microsoft.UI.Xaml.Media.VisualTreeHelper
	function validate(child: any): void {
		let type = child.GetType()
		while (type) {
			const name: string = type.FullName
			if (
				[
					'WebView',
					'MediaPlayerElement',
					'MediaElement',
					'SwapChainPanel',
					'SwapChainBackgroundPanel',
				].some((typeName) => name.endsWith('.' + typeName) || name.endsWith('.' + typeName + '2'))
			) {
				throw new UnavailabilityError('Web/video/GPU surfaces in Windows capture')
			}
			type = type.BaseType
		}
		const count = helper.GetChildrenCount(child)
		for (let index = 0; index < count; index++) {
			validate(helper.GetChild(child, index))
		}
	}
	validate(host)
	return host
}
function close(value: any): void {
	if (typeof value?.Dispose === 'function') {
		value.Dispose()
	} else {
		value?.Close?.()
	}
}
async function capture(target: object, options: NormalizedCaptureOptions): Promise<string> {
	if (
		options.format !== 'png' ||
		options.fileName !== undefined ||
		options.snapshotContentContainer ||
		options.useRenderInContext ||
		options.handleGLSurfaceViewOnAndroid
	) {
		throw new UnavailabilityError(
			'Requested format/strategy in Windows capture; use PNG with default strategies',
		)
	}
	const view = nativeView(target)
	const { Windows, Microsoft, NSWinRT } = projection()
	const wait = (operation: unknown) => NSWinRT.toPromise(operation)
	const scale = Number(view.XamlRoot.RasterizationScale)
	const width = options.width ?? Math.ceil(Number(view.ActualWidth) * scale)
	const height = options.height ?? Math.ceil(Number(view.ActualHeight) * scale)
	checkDimensions(width, height)
	const image = new Microsoft.UI.Xaml.Media.Imaging.RenderTargetBitmap()
	await wait(image.RenderAsync(view, width, height))
	nativeView(target)
	const actualWidth = Number(image.PixelWidth),
		actualHeight = Number(image.PixelHeight)
	checkDimensions(actualWidth, actualHeight)
	if (actualWidth !== width || actualHeight !== height) {
		throw new Error('Windows changed the requested capture dimensions')
	}
	const pixels = await wait(image.GetPixelsAsync())
	const imaging = Windows.Graphics.Imaging
	const bitmap = imaging.SoftwareBitmap.CreateCopyFromBuffer(
		pixels,
		imaging.BitmapPixelFormat.Bgra8,
		width,
		height,
		imaging.BitmapAlphaMode.Premultiplied,
	)
	const stream = new Windows.Storage.Streams.InMemoryRandomAccessStream()
	let reader: any
	let input: any
	try {
		const encoder = await wait(
			imaging.BitmapEncoder.CreateAsync(imaging.BitmapEncoder.PngEncoderId, stream),
		)
		encoder.SetSoftwareBitmap(bitmap)
		await wait(encoder.FlushAsync())
		const length = Number(stream.Size)
		if (!Number.isSafeInteger(length) || length <= 0 || length > 256000000) {
			throw new Error('Windows encoded an invalid capture size')
		}
		input = stream.GetInputStreamAt(0)
		reader = new Windows.Storage.Streams.DataReader(input)
		if (Number(await wait(reader.LoadAsync(length))) !== length) {
			throw new Error('Could not read the complete Windows capture')
		}
		const buffer = reader.ReadBuffer(length)
		if (options.result !== 'tmpfile') {
			const encoded: string =
				Windows.Security.Cryptography.CryptographicBuffer.EncodeToBase64String(buffer)
			return options.result === 'data-uri' ? 'data:image/png;base64,' + encoded : encoded
		}
		const file = await wait(
			Windows.Storage.ApplicationData.Current.TemporaryFolder.CreateFileAsync(
				'octane-view-shot.png',
				Windows.Storage.CreationCollisionOption.GenerateUniqueName,
			),
		)
		try {
			await wait(Windows.Storage.FileIO.WriteBufferAsync(file, buffer))
			const path: string = file.Path
			const uri =
				'file:///' +
				path
					.split('\\')
					.map(encodeURIComponent)
					.join('/')
					.replace(/^([A-Za-z])%3A/, '$1:')
			owned.set(uri, path)
			return uri
		} catch (error) {
			await wait(file.DeleteAsync())
			throw error
		}
	} finally {
		close(reader)
		close(input)
		close(stream)
		close(bitmap)
	}
}
export const backend: CaptureBackend = {
	capabilities: () => ({
		view: available(),
		screen: false,
		formats: available() ? ['png'] : [],
		scrollContent: false,
	}),
	validate(target) {
		nativeView(target)
	},
	capture,
	async captureScreen() {
		throw new UnavailabilityError('Windows app-screen capture; pass an explicit host to captureRef')
	},
	release(uri) {
		const path = owned.get(uri)
		if (!path) {
			return
		}
		if (File.exists(path)) {
			File.fromPath(path).removeSync((error) => {
				throw error
			})
		}
		owned.delete(uri)
	},
	async waitForLayout(target, cancelled) {
		const start = Date.now()
		while (!cancelled()) {
			try {
				nativeView(target)
				return
			} catch (error) {
				if (Date.now() - start >= 1500) {
					throw error
				}
			}
			await new Promise<void>((resolve) => setTimeout(resolve, 16))
		}
		throw new Error('ViewShot unmounted while waiting for layout')
	},
}
