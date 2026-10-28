import { Utils } from '@nativescript/core'
import type { ClipWriter } from './clip-types'
export type { ClipWriter } from './clip-types'

/** Android outlines use physical pixels; the shared morph supplies DIPs. */
export function createClipWriter(view: any): ClipWriter {
	let host: android.view.View | undefined
	let provider: android.view.ViewOutlineProvider | undefined
	let previous: android.view.ViewOutlineProvider | null = null
	let wasClipped = false
	const current = { top: 0, right: 0, bottom: 0, left: 0, radius: 0 }
	const px = (value: number) => Math.round(Utils.layout.toDevicePixels(value))
	return {
		mechanism: 'outline',
		setClip(inset, radius) {
			const native = view?.nativeViewProtected as android.view.View | undefined
			if (!native) {return}
			Object.assign(current, inset, { radius })
			if (!provider) {
				const Outline = android.view.ViewOutlineProvider.extend({
					getOutline(target: android.view.View, outline: android.graphics.Outline) {
						const left = px(current.left)
						const top = px(current.top)
						outline.setRoundRect(left, top,
							Math.max(left, target.getWidth() - px(current.right)),
							Math.max(top, target.getHeight() - px(current.bottom)),
							Utils.layout.toDevicePixels(current.radius))
					},
				})
				provider = new Outline()
			}
			if (host !== native) {
				host = native
				previous = host.getOutlineProvider()
				wasClipped = host.getClipToOutline()
			}
			if (host.getOutlineProvider() !== provider) {host.setOutlineProvider(provider)}
			host.setClipToOutline(true)
			host.invalidateOutline()
		},
		clear() {
			if (host && provider && host.getOutlineProvider() === provider) {
				host.setOutlineProvider(previous)
				host.setClipToOutline(wasClipped)
				host.invalidateOutline()
			}
			host = undefined
		},
	}
}
