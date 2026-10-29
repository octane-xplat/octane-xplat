/** Internal scroll layout ownership. Sizes and offsets stay in AppKit points. */

import {
	NSNotificationCenter,
	NSUserInterfaceLayoutOrientation,
	NSViewFrameDidChangeNotification,
} from '@octane-xplat/platform/macos'

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

function reportScrollGeometryFailure(message: string): void {
	try { console.warn(message) } catch { /* Diagnostics cannot own layout. */ }
}

/** Own one scroll geometry subscription per node, including partial setup.
 * Frame-enable flags stay enabled: other renderer readers share those views. */
export function observeScrollGeometry(node: any, target: any, notify: () => void): () => void {
	const previous = node.scrollGeometryDetach
	const observers: any[] = []
	let disposed = false
	let queued: object | null = null
	let scroll: any, clip: any, document: any, center: any, removeObserver: any
	const isCurrent = () => !disposed && node.scrollGeometryDetach === detach && node.scrollGeometrySchedule === schedule
	const remove = (observer: any) => {
		try { removeObserver.call(center, observer) }
		catch { reportScrollGeometryFailure('[macos-scroll] Geometry observer cleanup failed') }
	}
	const detach = () => {
		if (disposed) return
		disposed = true
		queued = null
		if (node.scrollGeometryDetach === detach) node.scrollGeometryDetach = null
		if (node.scrollGeometrySchedule === schedule) node.scrollGeometrySchedule = null
		// Tombstone every handle before native removal can reenter.
		for (const observer of observers.splice(0)) remove(observer)
	}
	const hasCurrentViews = () => {
		if (!isCurrent()) return false
		if (node.view === scroll && scroll.contentView === clip && scroll.documentView === document) return true
		detach()
		return false
	}
	const schedule = () => {
		if (queued || !isCurrent()) return
		const task = queued = {}
		queueMicrotask(() => {
			if (!isCurrent() || queued !== task) return
			try {
				if (!hasCurrentViews()) return
				scroll.layoutSubtreeIfNeeded?.()
				if (!hasCurrentViews()) return
				// Notifications during the solve coalesce here. Later consumer work
				// may schedule another task without this task clearing its lease.
				queued = null
				const { inline, block } = scrollAxes(node.props)
				const bounds = clip.bounds, size = document.frame.size
				const width = Number(bounds.size.width), height = Number(bounds.size.height)
				const contentWidth = Number(size.width), contentHeight = Number(size.height)
				const originX = Number(bounds.origin.x), originY = Number(bounds.origin.y)
				if (!hasCurrentViews()) return
				if (![width, height, contentWidth, contentHeight, originX, originY].every(Number.isFinite)
					|| [width, height, contentWidth, contentHeight].some(value => value < 0)) {
					reportScrollGeometryFailure('[macos-scroll] Invalid geometry frame')
					return
				}
				const maxX = Math.max(0, contentWidth - width), maxY = Math.max(0, contentHeight - height)
				const flipped = document.flipped
				const clamp = (value: number, max: number) => Math.min(max, Math.max(0, value))
				const x = inline ? clamp(originX, maxX) : 0
				const initial = node.props.orientation != null && !node.scrollInitialPositioned
				const y = !block || initial ? (flipped ? 0 : maxY) : clamp(originY, maxY)
				if (!hasCurrentViews()) return
				if (x !== originX || y !== originY) {
					clip.scrollToPoint({ x, y })
					if (!hasCurrentViews()) return
					scroll.reflectScrolledClipView(clip)
				}
				if (!hasCurrentViews()) return
				// A failed native scroll must not consume initial-position readiness.
				if (width > 0 && height > 0) node.scrollInitialPositioned = true
				notify()
			} catch {
				if (isCurrent()) reportScrollGeometryFailure('[macos-scroll] Geometry update failed')
			} finally {
				if (queued === task) queued = null
			}
		})
	}
	// Claim both markers before cleanup/registration side effects can reenter.
	node.scrollGeometryDetach = detach
	node.scrollGeometrySchedule = schedule
	try {
		previous?.()
		if (!isCurrent()) return detach
		scroll = node.view
		clip = scroll?.contentView
		document = scroll?.documentView
		if (!scroll || !clip || !document || !target) throw new Error('AppKit scroll geometry views are unavailable')
		center = NSNotificationCenter.defaultCenter
		const addObserver = center.addObserverForNameObjectQueueUsingBlock
		removeObserver = center.removeObserver
		if (typeof addObserver !== 'function' || typeof removeObserver !== 'function') {
			throw new Error('AppKit scroll geometry observation is unavailable')
		}
		for (const view of new Set([target, clip, document])) {
			view.postsFrameChangedNotifications = true
			if (!isCurrent()) return detach
			const observer = addObserver.call(center,
				NSViewFrameDidChangeNotification, view, null, schedule,
			)
			if (observer == null) throw new Error('AppKit scroll geometry observer is unavailable')
			if (!isCurrent()) { remove(observer); return detach }
			observers.push(observer)
		}
		schedule()
	} catch (error) {
		detach()
		throw error
	}
	return detach
}
