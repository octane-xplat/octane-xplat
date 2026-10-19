import { Utils } from '@nativescript/core'
import type { FocusScrollRuntime } from './scroll-runtime-types'
const native = (host: any) => host.nativeViewProtected ?? host.ios ?? host.android
export const scrollRuntime: FocusScrollRuntime = {
	owner: (host) => native((host as any).native ?? host) ?? null,
	read: (owner: any) =>
		owner.contentOffset?.y ?? Utils.layout.toDeviceIndependentPixels(owner.getScrollY()),
	write(owner: any, offset) {
		if (owner.setContentOffsetAnimated) {
			owner.setContentOffsetAnimated(
				{
					x: owner.contentOffset.x,
					y: Math.max(
						-(owner.adjustedContentInset?.top ?? 0),
						Math.min(
							offset,
							Math.max(
								-(owner.adjustedContentInset?.top ?? 0),
								owner.contentSize.height -
									owner.bounds.size.height +
									(owner.adjustedContentInset?.bottom ?? 0),
							),
						),
					),
				},
				false,
			)
		} else {
			owner.scrollTo(owner.getScrollX(), Utils.layout.toDevicePixels(offset))
		}
	},
	watchManual(host: any, listener) {
		const view = host.native ?? host
		const touch = (event: any) => {
			if (event.action === 'move') {
				listener()
			}
		}
		view.on('touch', touch)
		return () => view.off('touch', touch)
	},
}
