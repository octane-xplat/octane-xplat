/** Top-left viewport-relative rectangle, in window content points. */

import { NSView } from '@octane-xplat/platform/macos'
import type { NSClass, NSEvent, NSNotificationCenter, NSSize } from '@octane-xplat/platform/macos'
export interface WindowLayerBounds {
	left: number
	top: number
	width: number
	height: number
}

/** Top-left point resolved from a bounds rect, layer size, and viewport. */
export interface WindowLayerPoint {
	left: number
	top: number
}

export interface WindowLayerContentRoot {
	render(component: any, props: Record<string, any>): unknown
	unmount(): void
	/** A source portal can defer geometry until its native children commit. */
	whenCommitted?(callback: () => void): void
}

export interface WindowLayerOptions {
	anchor: NSView
	component?: any
	props?: Record<string, any>
	position(anchor: WindowLayerBounds, size: NSSize, viewport: WindowLayerBounds): WindowLayerPoint
	lightDismiss?: boolean
	/** Keep interaction with the anchor inside the compound field boundary. */
	excludeAnchorFromDismiss?: boolean
	/** A declarative source outlet; omit for the existing standalone root. */
	createContentRoot?(host: NSView): WindowLayerContentRoot
	/** Keep hidden until show() is requested and content has committed. */
	deferPresentation?: boolean
	onClose?: () => void
	[key: string]: any
}

export interface WindowLayer {
	readonly contentView: NSView
	closed: boolean
	show(): void
	update(props: Record<string, any>, nextPositioning?: Partial<WindowLayerOptions>): void
	close(dismissed?: boolean): void
}

export interface WindowLayerDeps {
	createRoot(
		contentView: NSView,
		anchor: NSView,
	): WindowLayerContentRoot
	fittingSize(view: NSView): NSSize | null | undefined
	View?: NSClass<NSView>
	Event?: typeof NSEvent
	Center?: typeof NSNotificationCenter
}

interface NotificationRecord {
	count: number
	frame: boolean
	bounds: boolean
}

const notificationOwners = new WeakMap<NSView, NotificationRecord>()

function ownNotifications(view: NSView) {
	let record = notificationOwners.get(view)
	if (!record) {
		record = {
			count: 0,
			frame: view.postsFrameChangedNotifications,
			bounds: view.postsBoundsChangedNotifications,
		}

		notificationOwners.set(view, record)
		view.postsFrameChangedNotifications = true
		view.postsBoundsChangedNotifications = true
	}

	record.count++
	return () => {
		if (--record!.count) {
			return
		}

		notificationOwners.delete(view)
		if (view.postsFrameChangedNotifications === true) {
			view.postsFrameChangedNotifications = record!.frame
		}

		if (view.postsBoundsChangedNotifications === true) {
			view.postsBoundsChangedNotifications = record!.bounds
		}
	}
}

/** A self-drawn in-window layer. Position callback uses top-left window points.
 * AppKit popovers remain available for platform-authentic consumers. */
export function showWindowLayer(
	options: WindowLayerOptions,
	{
		createRoot,
		fittingSize,
		View = (globalThis as any).NSView,
		Event = (globalThis as any).NSEvent,
		Center = (globalThis as any).NSNotificationCenter,
	}: WindowLayerDeps,
): WindowLayer | null {
	const anchor = options.anchor
	const ownerWindow = anchor?.window
	const container = ownerWindow?.contentView
	if (
		!container ||
		!View ||
		!anchor.convertRectToView ||
		(options.lightDismiss &&
			typeof Event?.addLocalMonitorForEventsMatchingMaskHandler !== 'function')
	) {
		return null
	}

	const contentView = View.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 1, height: 1 },
	})

	const root = options.createContentRoot ? options.createContentRoot(contentView) : createRoot(contentView, anchor)
	if (!root || typeof root.render !== 'function' || typeof root.unmount !== 'function') {
		throw new TypeError('AppKit layer content root requires render and unmount')
	}
	contentView.hidden = true
	let ready = false, presented = false, revision = 0, requested = !options.deferPresentation
	let surface = options.props ?? {}
	let positioning: WindowLayerOptions = options
	let monitor: any = null
	const observers: any[] = []
	const releases: Array<() => void> = []
	const updatePosition = () => {
		if (layer.closed) {
			return
		}

		if (anchor.window !== ownerWindow || ownerWindow?.contentView !== container) {
			layer.close(true); return
		}
		if (!ready) {return}
		const viewport = container.bounds
		const height = viewport.size.height
		const rect = anchor.convertRectToView(anchor.bounds, container)
		const flipped = container.flipped
		const bounds = {
			left: rect.origin.x - viewport.origin.x,
			top: flipped
				? rect.origin.y - viewport.origin.y
				: height - (rect.origin.y - viewport.origin.y) - rect.size.height,
			width: rect.size.width,
			height: rect.size.height,
		}

		const size = fittingSize(contentView) ?? { width: 1, height: 1 }
		const point = positioning.position(bounds, size, {
			left: 0,
			top: 0,
			width: viewport.size.width,
			height,
		})

		if (layer.closed) {return}
		if (anchor.window !== ownerWindow || ownerWindow?.contentView !== container) { layer.close(true); return }
		const frame = {
			origin: {
				x: viewport.origin.x + point.left,
				y: viewport.origin.y + (flipped ? point.top : height - point.top - size.height),
			},
			size,
		}
		if (![frame.origin.x, frame.origin.y, size.width, size.height].every(Number.isFinite) || size.width < 0 || size.height < 0) {
			throw new RangeError('AppKit layer positioning requires finite, nonnegative geometry')
		}
		const previous = contentView.frame
		if (!previous || previous.origin.x !== frame.origin.x || previous.origin.y !== frame.origin.y ||
			previous.size.width !== size.width || previous.size.height !== size.height) {contentView.frame = frame}
	}

	const layer: WindowLayer = {
		contentView,
		closed: false,
		show() {
			if (layer.closed) {return}
			requested = true
			updatePosition()
			if (!layer.closed && ready) { contentView.hidden = false; presented = true }
		},
		update(props, nextPositioning) {
			if (layer.closed) {
				return
			}

			surface = props
			if (
				nextPositioning?.lightDismiss &&
				typeof Event?.addLocalMonitorForEventsMatchingMaskHandler !== 'function'
			) {
				throw new TypeError('AppKit lightDismiss requires a local mouse monitor')
			}

			if (nextPositioning) {
				positioning = { ...positioning, ...nextPositioning }
			}

			const current = ++revision
			ready = false
			root.render(options.component, surface)
			const committed = () => {
				if (layer.closed || current !== revision) {return}
				ready = true
				try {
					updatePosition()
					if (requested && !layer.closed) { contentView.hidden = false; presented = true }
				} catch (error) {
					try { layer.close() } catch (cleanupError) { console.error('[macos-layer] commit cleanup failed', cleanupError) }
					throw error
				}
			}
			if (root.whenCommitted) {root.whenCommitted(committed)}
			else {committed()}
		},
		close(dismissed = false) {
			if (layer.closed) {return}
			layer.closed = true; revision++; ready = false; presented = false
			const failures: unknown[] = []
			const clean = (action: () => void) => { try { action() } catch (error) { failures.push(error) } }
			clean(() => { contentView.hidden = true })
			const previousMonitor = monitor; monitor = null
			if (previousMonitor) {clean(() => Event!.removeMonitor(previousMonitor))}
			for (const observer of observers.splice(0)) {clean(() => Center!.defaultCenter.removeObserver(observer))}
			for (const release of releases.splice(0)) {clean(release)}
			clean(() => root.unmount())
			clean(() => contentView.removeFromSuperview())
			if (dismissed) {clean(() => options.onClose?.())}
			if (failures.length) {throw failures[0]}
		},
	}

	try {
		container.addSubview(contentView)
		layer.update(surface)
		if (layer.closed) {return layer}
		// Reposition for window resize, anchor movement and enclosing scroll views.
		for (let view: NSView | null = anchor; view; view = view.superview) {
			releases.push(ownNotifications(view))
			for (const name of [
				'NSViewFrameDidChangeNotification',
				'NSViewBoundsDidChangeNotification',
			]) {
				observers.push(
					Center!.defaultCenter.addObserverForNameObjectQueueUsingBlock(
						name,
						view,
						null,
						updatePosition,
					),
				)
			}
		}

		observers.push(
			Center!.defaultCenter.addObserverForNameObjectQueueUsingBlock(
				'NSWindowWillCloseNotification',
				anchor.window,
				null,
				() => layer.close(true),
			),
		)

		observers.push(
			Center!.defaultCenter.addObserverForNameObjectQueueUsingBlock(
				'NSWindowDidResizeNotification',
				anchor.window,
				null,
				updatePosition,
			),
		)

		observers.push(Center!.defaultCenter.addObserverForNameObjectQueueUsingBlock(
			'NSWindowDidUpdateNotification', null, null,
			(note: { object?: unknown }) => { if (note?.object === ownerWindow || note?.object === anchor.window) {updatePosition()} },
		))

		if (Event?.addLocalMonitorForEventsMatchingMaskHandler) {
			monitor = Event.addLocalMonitorForEventsMatchingMaskHandler(
				(1 << 1) | (1 << 3) | (1 << 25),
				(event: NSEvent) => {
					if (layer.closed) {return event}
					if (anchor.window !== ownerWindow || ownerWindow?.contentView !== container) { layer.close(true); return event }
					if (!presented || !positioning.lightDismiss || event.window !== ownerWindow) {return event}

					const point = container.convertPointFromView(event.locationInWindow, null)
					if (positioning.excludeAnchorFromDismiss) {
						const rect = anchor.convertRectToView(anchor.bounds, container)
						if (point.x >= rect.origin.x && point.y >= rect.origin.y &&
							point.x <= rect.origin.x + rect.size.width && point.y <= rect.origin.y + rect.size.height) {return event}
					}
					const frame = contentView.frame
					if (
						point.x < frame.origin.x ||
						point.y < frame.origin.y ||
						point.x > frame.origin.x + frame.size.width ||
						point.y > frame.origin.y + frame.size.height
					) {
						options.onClose?.()
					}

					return event
				},
			)
		}

		return layer
	} catch (error) {
		try { layer.close() } catch (cleanupError) { console.error('[macos-layer] setup cleanup failed', cleanupError) }
		throw error
	}
}
