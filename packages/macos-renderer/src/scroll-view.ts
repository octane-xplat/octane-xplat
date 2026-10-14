/** Internal scroll layout ownership. Sizes and offsets stay in AppKit points. */

import { NSNotificationCenter, NSUserInterfaceLayoutOrientation, NSViewFrameDidChangeNotification } from '@octane-xplat/platform/macos'
export function scrollAxes(props: Record<string, any>) {
	const orientation = props.orientation ?? (props.horizontal === true ? 'horizontal' : 'vertical')
	return { inline: orientation !== 'vertical', block: orientation !== 'horizontal' }
}

export function configureScrollAxes(node: any) {
	const { inline, block } = scrollAxes(node.props)
	const indicators = node.props.scrollBarIndicatorVisible !== false
	const axisKey = `${inline}:${block}:${indicators}`
	if (node.scrollAxisKey === axisKey) {
		return
	}

	node.scrollAxisKey = axisKey
	for (const constraint of node.scrollAxisConstraints ?? []) {
		constraint.active = false
	}

	const scroll = node.view
	const document = scroll.documentView
	const clip = scroll.contentView
	scroll.hasHorizontalScroller = inline && indicators
	scroll.hasVerticalScroller = block && indicators
	document.orientation =
		inline && !block
			? NSUserInterfaceLayoutOrientation.Horizontal
			: NSUserInterfaceLayoutOrientation.Vertical

	// A disabled axis fits the viewport. Enabled axes retain the document's
	// natural size and at least fill the viewport, including empty content.
	node.scrollAxisConstraints = [
		inline
			? document.widthAnchor.constraintGreaterThanOrEqualToAnchor(clip.widthAnchor)
			: document.widthAnchor.constraintEqualToAnchor(clip.widthAnchor),
		block
			? document.heightAnchor.constraintGreaterThanOrEqualToAnchor(clip.heightAnchor)
			: document.heightAnchor.constraintEqualToAnchor(clip.heightAnchor),
	]

	for (const constraint of node.scrollAxisConstraints) {
		constraint.active = true
	}

	node.scrollGeometrySchedule?.()
}

/** Coalesce a layout solve's frame notifications. Observe the clip and the
 * document as well as the arranged viewport: content growth and scroller
 * chrome can resize these without changing the outer frame. */
export function observeScrollGeometry(node: any, target: any, notify: () => void): () => void {
	const scroll = node.view
	const clip = scroll.contentView
	const document = scroll.documentView
	let disposed = false
	let scheduled = false
	const schedule = () => {
		if (scheduled || disposed) {
			return
		}

		scheduled = true
		queueMicrotask(() => {
			if (disposed) {
				return
			}

			scroll.layoutSubtreeIfNeeded?.()
			scheduled = false
			const { inline, block } = scrollAxes(node.props)
			const bounds = clip.bounds
			const size = document.frame.size
			const maxX = Math.max(0, Number(size.width) - Number(bounds.size.width))
			const maxY = Math.max(0, Number(size.height) - Number(bounds.size.height))
			const flip =
				typeof document.isFlipped === 'function' ? document.isFlipped() : document.isFlipped

			const flipped = flip === true || Number(flip) === 1
			const clamp = (value: number, max: number) => Math.min(max, Math.max(0, value))
			const x = inline ? clamp(Number(bounds.origin.x), maxX) : 0
			const initial = node.props.orientation != null && !node.scrollInitialPositioned
			const y = !block || initial ? (flipped ? 0 : maxY) : clamp(Number(bounds.origin.y), maxY)
			if (Number(bounds.size.width) > 0 && Number(bounds.size.height) > 0) {
				node.scrollInitialPositioned = true
			}

			if (x !== Number(bounds.origin.x) || y !== Number(bounds.origin.y)) {
				clip.scrollToPoint({ x, y })
				scroll.reflectScrolledClipView(clip)
			}

			notify()
		})
	}

	const center = NSNotificationCenter.defaultCenter
	const observers = [...new Set([target, clip, document])].map((view) => {
		view.postsFrameChangedNotifications = true
		return center.addObserverForNameObjectQueueUsingBlock(
			NSViewFrameDidChangeNotification,
			view,
			null,
			schedule,
		)
	})

	node.scrollGeometrySchedule = schedule
	schedule()
	return () => {
		disposed = true
		for (const observer of observers) {
			center.removeObserver(observer)
		}

		node.scrollGeometrySchedule = null
	}
}
