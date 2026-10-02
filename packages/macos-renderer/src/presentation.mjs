// Shared surfaces live in the declaring window, independently of its layout.
// Kept separate from NSPopover and platform-authentic window sheets.
export function installPresentationBridge(bridge, createRoot, fontFamilyForView) {
	const entries = []
	const layers = new WeakMap()
	class PresentationLayer extends NSView {
		static {
			NativeClass(this)
		}
		acceptsFirstResponder() {
			return true
		}
		hitTest(point) {
			const hit = super.hitTest(point)
			const entry = layers.get(this)
			return (hit === this || hit?.isEqual?.(this)) && !entry?.options.modal ? null : hit
		}
		layout() {
			super.layout()
			layers.get(this)?.layout()
		}
	}

	const children = (view) => {
		const result = []
		const list = view?.subviews
		for (let i = 0; i < Number(list?.count ?? 0); i++) {
			result.push(list.objectAtIndex(i))
		}

		return result
	}

	const truth = (view, key) => (typeof view?.[key] === 'function' ? view[key]() : view?.[key])
	const focusables = (view) => {
		if (!view || truth(view, 'hidden')) {
			return []
		}

		const own = truth(view, 'acceptsFirstResponder') && view.enabled !== false ? [view] : []
		return [...own, ...children(view).flatMap(focusables)]
	}

	const inside = (view, panel) => {
		for (let current = view; current; current = current.superview) {
			if (current === panel || current.isEqual?.(panel)) {
				return true
			}
		}

		return false
	}

	const length = (value, budget, fallback) => {
		if (typeof value === 'number') {
			return Math.max(0, value)
		}

		if (typeof value !== 'string') {
			return fallback
		}

		const match = value.trim().match(/^([\d.]+)(%|px|dip|dvh|vh)?$/)
		return match
			? Number(match[1]) * (['%', 'dvh', 'vh'].includes(match[2]) ? budget / 100 : 1)
			: fallback
	}

	bridge.setSurfaceAppearance = (view, dark) => {
		const entry = entries.find((entry) => inside(view, entry.panel))
		if (!entry) {
			return
		}

		entry.options.dark = dark
		entry.layout()
	}

	bridge.presentSurface = (initial) => {
		const owner = initial.owner?.native ?? initial.owner
		const nativeWindow = owner?.window ?? NSApplication.sharedApplication.keyWindow
		const host = nativeWindow?.contentView
		if (!host || typeof initial.component !== 'function') {
			throw new Error('AppKit presentation requires a mounted window and component')
		}

		const layer = PresentationLayer.alloc().initWithFrame(host.bounds)
		layer.autoresizingMask = 18 // width + height
		layer.wantsLayer = true
		const panel = NSView.alloc().initWithFrame(host.bounds)
		panel.wantsLayer = true
		layer.addSubview(panel)
		const root = createRoot(panel, { fontFamily: fontFamilyForView(owner ?? host) })
		let resolveClosed
		const responder = nativeWindow.firstResponder
		const previousFocus = truth(responder, 'isFieldEditor') ? responder.delegate : responder
		const entry = {
			options: initial,
			parent: [...entries]
				.reverse()
				.find(
					(entry) =>
						entry.window === nativeWindow &&
						(owner ? inside(owner, entry.panel) : entry.options.modal),
				),
			panel,
			layer,
			window: nativeWindow,
			closed: false,
			observers: [],
			monitor: null,
			closedPromise: new Promise((resolve) => {
				resolveClosed = resolve
			}),
			layout() {
				if (entry.closed) {
					return
				}

				const options = entry.options
				const bounds = layer.bounds.size
				const w = Number(bounds.width),
					h = Number(bounds.height)

				const content = panel.subviews?.objectAtIndex?.(0)
				const fit = content?.documentView?.fittingSize ?? content?.fittingSize ?? panel.fittingSize
				const full = options.kind === 'lightbox' || options.fullscreen
				const width = full
					? w
					: Math.min(w, length(options.width, w, options.kind === 'sheet' ? w : 400))

				let height = full
					? h
					: Math.min(
							h,
							length(options.maxHeight, h, h * 0.75),
							Math.max(80, Number(fit?.height ?? 160)),
						)

				if (options.kind === 'sheet') {
					const budget =
						options.height === 'tall'
							? h * 0.92
							: options.height === 'hug'
								? height
								: length(options.height, h, h * 0.62)

					const stops = (options.snapPoints ?? [])
						.map((p) => (typeof p === 'number' && p <= 1 ? p * h : length(p, h, 0)))
						.filter((p) => p > 0)
						.map((p) => Math.min(p, h))
						.sort((a, b) => a - b)

					entry.stops = [...new Set(stops)]
					height = entry.stops.length
						? entry.stops[Math.min(entry.stop ?? 0, entry.stops.length - 1)]
						: Math.min(h * 0.92, budget)
				}

				let x = (w - width) / 2,
					y = (h - height) / 2

				if (options.kind === 'sheet') {
					y = 0
				}

				if (options.kind === 'toast') {
					const edge = options.position ?? 'bottomEnd',
						inset = options.inset ?? {}

					x = edge.endsWith('Start') ? 16 + (inset.start ?? 0) : w - width - 16 - (inset.end ?? 0)
					y = edge.startsWith('top') ? h - height - 16 - (inset.top ?? 0) : 16 + (inset.bottom ?? 0)
				}

				const pos =
					!full && options.position && typeof options.position === 'object' ? options.position : {}

				if (pos.start != null) {
					x = length(pos.start, w, 0)
				} else if (pos.end != null) {
					x = w - width - length(pos.end, w, 0)
				}

				if (pos.top != null) {
					y = h - height - length(pos.top, h, 0)
				} else if (pos.bottom != null) {
					y = length(pos.bottom, h, 0)
				}

				panel.frame = { origin: { x: Math.max(0, x), y: Math.max(0, y) }, size: { width, height } }
				layer.layer.backgroundColor = NSColor.colorWithRedGreenBlueAlpha(
					0,
					0,
					0,
					options.modal ? 0.35 : 0,
				).CGColor

				const surfaceColor = options.dark ? 10 / 255 : 1
				panel.layer.backgroundColor = NSColor.colorWithRedGreenBlueAlpha(
					surfaceColor,
					surfaceColor,
					surfaceColor,
					1,
				).CGColor

				panel.layer.cornerRadius = full ? 0 : 12
				panel.layer.masksToBounds = true
				if (typeof NSAppearance !== 'undefined' && options.dark != null) {
					panel.appearance = NSAppearance.appearanceNamed(
						options.dark ? 'NSAppearanceNameDarkAqua' : 'NSAppearanceNameAqua',
					)
				}

				panel.accessibilityLabel = options.label ?? (options.kind === 'sheet' ? 'Sheet' : 'Dialog')

				panel.accessibilityRole = 'AXGroup'
			},
			update(options) {
				if (entry.closed) {
					return
				}

				const transition =
					entry.didRender &&
					entry.options.kind === 'sheet' &&
					options.transitionKey !== entry.options.transitionKey

				const hadFocus =
					inside(nativeWindow.firstResponder, panel) ||
					inside(nativeWindow.firstResponder?.delegate, panel) ||
					nativeWindow.firstResponder === layer

				entry.options = { ...entry.options, ...options }
				root.render(entry.options.component, entry.options.props ?? {})
				entry.layout()
				entry.didRender = true
				if (hadFocus && entry.options.modal) {
					queueMicrotask(() => {
						const top = [...entries]
							.reverse()
							.find((e) => e.window === nativeWindow && e.options.modal && !e.closed)

						if (
							top === entry &&
							!inside(nativeWindow.firstResponder, panel) &&
							!inside(nativeWindow.firstResponder?.delegate, panel)
						) {
							nativeWindow.makeFirstResponder(focusables(panel)[0] ?? layer)
						}
					})
				}

				if (transition && typeof CABasicAnimation !== 'undefined') {
					const animation = CABasicAnimation.animationWithKeyPath('opacity')
					animation.fromValue = NSNumber.numberWithDouble(0.65)
					animation.toValue = NSNumber.numberWithDouble(1)
					animation.duration = 0.18
					panel.layer.addAnimationForKey(animation, 'xplat-sheet-switch')
				}

				if (entry.options.kind === 'lightbox') {
					const visit = (view) => {
						if ('allowsMagnification' in view) {
							view.allowsMagnification = entry.options.zoom !== false
							view.minMagnification = 1
							view.maxMagnification = 4
						} else {
							for (const child of children(view)) {
								visit(child)
							}
						}
					}

					visit(panel)
				}
			},
			close(reason) {
				if (entry.closed) {
					return
				}

				entry.closed = true
				const owns = (candidate) => {
					for (let current = candidate; current; current = current.parent) {
						if (current === entry) {
							return true
						}
					}

					return false
				}

				const hadFocus = entries
					.filter(owns)
					.some(
						(candidate) =>
							nativeWindow.firstResponder === candidate.layer ||
							nativeWindow.firstResponder?.isEqual?.(candidate.layer) ||
							inside(nativeWindow.firstResponder, candidate.panel) ||
							inside(nativeWindow.firstResponder?.delegate, candidate.panel),
					)

				for (const child of [...entries].reverse()) {
					if (child.parent === entry) {
						child.close(reason === 'owner' ? 'owner' : 'ancestor')
					}
				}

				entries.splice(entries.indexOf(entry), 1)
				if (entry.monitor) {
					NSEvent.removeMonitor(entry.monitor)
				}

				for (const observer of entry.observers) {
					NSNotificationCenter.defaultCenter.removeObserver(observer)
				}

				try {
					root.unmount()
				} finally {
					layer.removeFromSuperview()
					layers.delete(layer)
					const target = entry.options.finalFocusRef?.current
					if (hadFocus && reason !== 'owner' && reason !== 'ancestor') {
						if (typeof target?.focus === 'function') {
							target.focus()
						} else if (
							nativeWindow.makeFirstResponder(target?.native ?? target ?? previousFocus ?? host) ===
							false
						) {
							nativeWindow.makeFirstResponder(null)
						}
					}

					resolveClosed(reason)
				}

				if (reason === 'user') {
					entry.options.onDismiss?.()
				}
			},
			requestDismiss(path) {
				const purpose = entry.options.purpose ?? 'info'
				if (purpose === 'required' || (path === 'outside' && purpose !== 'info')) {
					return
				}

				if (entry.options.canDismiss?.(path) === false) {
					return
				}

				entry.close('user')
			},
		}

		layers.set(layer, entry)
		entries.push(entry)
		try {
			host.addSubview(layer)
			entry.update(initial)
			entry.observers.push(
				NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock(
					'NSWindowWillCloseNotification',
					nativeWindow,
					null,
					() => entry.close('owner'),
				),
			)

			entry.monitor = NSEvent.addLocalMonitorForEventsMatchingMaskHandler(
				1024 | 2 | 8 | 64 | 4,
				(event) => {
					if (
						entry.closed ||
						!(event.window === nativeWindow || event.window?.isEqual?.(nativeWindow))
					) {
						return event
					}

					const top = [...entries]
						.reverse()
						.find((e) => e.window === nativeWindow && e.options.modal && !e.closed)

					if (top && top !== entry) {
						return event
					}

					const type = Number(event.type)
					if (type === 10) {
						if (!entry.options.modal && !inside(nativeWindow.firstResponder, panel)) {
							return event
						}

						const code = Number(event.keyCode)
						if (code === 53) {
							entry.requestDismiss('escape')
							return null
						}

						if (code === 48 && entry.options.modal) {
							const controls = focusables(panel),
								current = nativeWindow.firstResponder

							const i = controls.findIndex(
								(v) =>
									v === current ||
									v === current?.delegate ||
									v.isEqual?.(current?.delegate ?? current),
							)

							const next =
								controls[
									(i + (Number(event.modifierFlags) & 131072 ? -1 : 1) + controls.length) %
										controls.length
								]

							nativeWindow.makeFirstResponder(next ?? layer)
							return null
						}

						if (entry.options.onKey?.(code) === true) {
							return null
						}

						return event
					}

					const point = panel.convertPointFromView(event.locationInWindow, null)
					const bounds = panel.bounds.size
					const within =
						point.x >= 0 && point.y >= 0 && point.x <= bounds.width && point.y <= bounds.height

					if (
						type === 1 &&
						within &&
						entry.options.kind === 'sheet' &&
						point.y >= bounds.height - 24
					) {
						entry.drag = { y: event.locationInWindow.y, height: panel.frame.size.height }
						return null
					}

					if (entry.drag && type === 6) {
						const height = Math.max(
							24,
							Math.min(
								entry.stops?.at(-1) ?? layer.bounds.size.height * 0.92,
								entry.drag.height + event.locationInWindow.y - entry.drag.y,
							),
						)

						panel.frame = { origin: panel.frame.origin, size: { width: bounds.width, height } }
						return null
					}

					if (entry.drag && type === 2) {
						entry.drag = null
						const height = panel.frame.size.height
						if (height < (entry.stops?.[0] ?? 120) * 0.5) {
							entry.requestDismiss('drag')
						} else if (entry.stops?.length) {
							entry.stop = entry.stops.reduce(
								(best, stop, i, stops) =>
									Math.abs(stop - height) < Math.abs(stops[best] - height) ? i : best,
								0,
							)
						}

						entry.layout()
						return null
					}

					if (!within && entry.options.modal && (type === 1 || type === 3)) {
						entry.requestDismiss('outside')
						return null
					}

					return event
				},
			)

			if (initial.modal) {
				nativeWindow.makeFirstResponder(focusables(panel)[0] ?? layer)
			}
		} catch (error) {
			entry.close()
			throw error
		}

		return {
			update: entry.update,
			close: entry.close,
			get closed() {
				return entry.closed
			},
			closedPromise: entry.closedPromise,
			panel,
			layer,
		}
	}
}
