// The clip uses the wrapper's untransformed local bounds. NativeScript's
// getActualSize() reports the transformed frame on iOS during the morph.
import type { ClipWriter } from './clip-types'
export type { ClipWriter } from './clip-types'

export function createClipWriter(view: any): ClipWriter {
	let mask: CALayer | undefined
	const layer = () => view?.nativeViewProtected?.layer as CALayer | undefined
	return {
		mechanism: 'mask',
		setClip(inset, radius) {
			const host = layer()
			if (!host) {return}
			// The native host may not be ready when the writer is created.
			// Attach after layout and restore our mask if a host update removed it.
			if (!mask) {
				mask = CALayer.layer()
				mask.backgroundColor = UIColor.whiteColor.CGColor
			}
			const { width, height } = host.bounds.size
			CATransaction.begin()
			CATransaction.setDisableActions(true)
			try {
				mask.frame = CGRectMake(inset.left, inset.top, Math.max(0, width - inset.left - inset.right), Math.max(0, height - inset.top - inset.bottom))
				mask.cornerRadius = radius
				if (host.mask !== mask) {host.mask = mask}
			} finally {
				CATransaction.commit()
			}
		},
		clear() {
			const host = layer()
			if (host && mask && host.mask === mask) {host.mask = null}
		},
	}
}
