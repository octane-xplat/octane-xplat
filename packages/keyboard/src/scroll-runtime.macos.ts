import { NSNotificationCenter, NSOperationQueue } from '@octane-xplat/platform/macos'
import type { FocusScrollRuntime } from './scroll-runtime-types'
export const scrollRuntime: FocusScrollRuntime = {
	owner: (host) => (host as any).native ?? host,
	read(owner: any) {
		const clip = owner.contentView,
			content = owner.documentView
		if (!clip || !content) {
			return null
		}
		const flipped =
			typeof content.isFlipped === 'function' ? content.isFlipped() : content.isFlipped
		const max = Math.max(0, content.bounds.size.height - clip.bounds.size.height)
		return flipped ? clip.bounds.origin.y : max - clip.bounds.origin.y
	},
	write(owner: any, offset) {
		const clip = owner.contentView,
			content = owner.documentView
		if (!clip || !content) {
			return
		}
		const flipped =
			typeof content.isFlipped === 'function' ? content.isFlipped() : content.isFlipped
		const max = Math.max(0, content.bounds.size.height - clip.bounds.size.height)
		clip.scrollToPoint({
			x: clip.bounds.origin.x,
			y: flipped ? Math.max(0, Math.min(max, offset)) : max - Math.max(0, Math.min(max, offset)),
		})
		owner.reflectScrolledClipView(clip)
	},
	watchManual(host: any, listener) {
		const center = NSNotificationCenter.defaultCenter
		const token = center.addObserverForNameObjectQueueUsingBlock(
			'NSScrollViewWillStartLiveScrollNotification',
			host.native ?? host,
			NSOperationQueue.mainQueue,
			listener,
		)
		return () => center.removeObserver(token)
	},
}
