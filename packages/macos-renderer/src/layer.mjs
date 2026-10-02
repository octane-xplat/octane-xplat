const notificationOwners = new WeakMap()

function ownNotifications(view) {
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
		if (--record.count) {
			return
		}

		notificationOwners.delete(view)
		if (view.postsFrameChangedNotifications === true) {
			view.postsFrameChangedNotifications = record.frame
		}

		if (view.postsBoundsChangedNotifications === true) {
			view.postsBoundsChangedNotifications = record.bounds
		}
	}
}

/** A self-drawn in-window layer. Position callback uses top-left window points.
 * AppKit popovers remain available for platform-authentic consumers. */
export function showWindowLayer(
	options,
	{
		createRoot,
		fittingSize,
		View = globalThis.NSView,
		Event = globalThis.NSEvent,
		Center = globalThis.NSNotificationCenter,
	},
) {
	const anchor = options.anchor
	const container = anchor?.window?.contentView
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

	const root = createRoot(contentView, anchor)
	let surface = options.props ?? {}
	let positioning = options
	let monitor = null
	const observers = []
	const releases = []
	const updatePosition = () => {
		if (layer.closed) {
			return
		}

		const viewport = container.bounds
		const height = viewport.size.height
		const rect = anchor.convertRectToView(anchor.bounds, container)
		const flipped = !!container.isFlipped
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

		contentView.frame = {
			origin: {
				x: viewport.origin.x + point.left,
				y: viewport.origin.y + (flipped ? point.top : height - point.top - size.height),
			},
			size,
		}
	}

	const layer = {
		contentView,
		closed: false,
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

			root.render(options.component, surface)
			updatePosition()
		},
		close() {
			if (layer.closed) {
				return
			}

			layer.closed = true
			if (monitor) {
				Event.removeMonitor(monitor)
			}

			for (const observer of observers) {
				Center.defaultCenter.removeObserver(observer)
			}

			for (const release of releases) {
				release()
			}

			try {
				root.unmount()
			} finally {
				contentView.removeFromSuperview()
			}
		},
	}

	try {
		container.addSubview(contentView)
		layer.update(surface)
		// Reposition for window resize, anchor movement and enclosing scroll views.
		for (let view = anchor; view; view = view.superview) {
			releases.push(ownNotifications(view))
			for (const name of [
				'NSViewFrameDidChangeNotification',
				'NSViewBoundsDidChangeNotification',
			]) {
				observers.push(
					Center.defaultCenter.addObserverForNameObjectQueueUsingBlock(
						name,
						view,
						null,
						updatePosition,
					),
				)
			}
		}

		observers.push(
			Center.defaultCenter.addObserverForNameObjectQueueUsingBlock(
				'NSWindowWillCloseNotification',
				anchor.window,
				null,
				() => layer.close(),
			),
		)

		observers.push(
			Center.defaultCenter.addObserverForNameObjectQueueUsingBlock(
				'NSWindowDidResizeNotification',
				anchor.window,
				null,
				updatePosition,
			),
		)

		if (Event?.addLocalMonitorForEventsMatchingMaskHandler) {
			monitor = Event.addLocalMonitorForEventsMatchingMaskHandler(
				(1 << 1) | (1 << 3) | (1 << 25),
				(event) => {
					if (layer.closed || !positioning.lightDismiss || event.window !== anchor.window) {
						return event
					}

					const point = container.convertPointFromView(event.locationInWindow, null)
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
		layer.close()
		throw error
	}
}
