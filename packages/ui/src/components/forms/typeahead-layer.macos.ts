import type { NSView } from '@octane-xplat/platform/macos'
import type { PopoverPlacement } from '../../props'
import { appKitHost } from '../../internal/platform/host-bridge'
import {
	positionPopover,
	resolveLayerAlignment,
	type PopoverRect,
} from '../overlays/popover-position'

export type AppKitTypeaheadLayer = {
	update: () => void
	isPresent: () => boolean
	committed(token: object): boolean | undefined
	dispose(): void
}

interface Layer {
	readonly closed: boolean
	show(): void
	update(props: Record<string, unknown>): void
	close(): void
}

export interface TypeaheadLayerTarget {
	token: object
	view: NSView
}

export interface TypeaheadLayerSize {
	width: number
	maxHeight: number
}

interface State {
	open: boolean
	anchor: unknown
	input: NSView | null
	width?: number
	placement?: PopoverPlacement
	rtl: boolean
}

interface Session {
	token: object
	anchor: NSView
	input: NSView
	window: NonNullable<NSView['window']>
	handle: Layer | null
	target: NSView | null
	live: boolean
	released: boolean
	committed: boolean
	revealed: boolean
	waiters: Array<() => void>
}

function nativeAnchor(view: unknown): view is NSView {
	return (
		typeof view === 'object' &&
		view !== null &&
		'window' in view &&
		typeof Reflect.get(view, 'convertRectToView') === 'function'
	)
}

function sizeFor(bounds: PopoverRect, viewport: PopoverRect, state: State): TypeaheadLayerSize {
	const explicit = state.width
	const requested =
		typeof explicit === 'number' && Number.isFinite(explicit) && explicit > 0
			? explicit
			: bounds.width
	const placement = state.placement ?? 'bottom'
	const height =
		placement === 'top' || placement === 'bottom'
			? Math.max(bounds.top - 8, viewport.height - bounds.top - bounds.height - 8)
			: viewport.height - 16
	return {
		width: Math.max(1, Math.min(requested, viewport.width - 16)),
		maxHeight: Math.max(1, Math.min(height, viewport.height - 16)),
	}
}

/** Private source-owned, same-window result host. The source outlet is a portal,
 * never an independently rendered copy of the result component tree. */
export function createAppKitTypeaheadLayer(
	options: {
		state(): State
		publish(target: TypeaheadLayerTarget | null, retired?: object): void
		resize(size: TypeaheadLayerSize): void
		dismiss(): void
		canDismiss(): boolean
	},
	bridge: typeof appKitHost = appKitHost,
	native: () => Record<string, any> = () => globalThis,
): AppKitTypeaheadLayer {
	let session: Session | null = null,
		observed: (() => void) | undefined,
		size: TypeaheadLayerSize | null = null
	let disposed = false,
		wasOpen = false,
		canceled = false,
		updating = false,
		queued = false
	const stop = () => {
		const release = observed
		observed = undefined
		release?.()
	}
	const retire = (owned = session) => {
		if (!owned) {
			return
		}
		if (session === owned) {
			session = null
		}
		owned.live = false
		owned.waiters = []
		try {
			owned.handle?.close()
		} finally {
			if (!disposed) {
				options.publish(null, owned.token)
			}
		}
	}
	const resize = (next: TypeaheadLayerSize) => {
		if (size?.width === next.width && size.maxHeight === next.maxHeight) {
			return
		}
		size = next
		if (session) {
			session.committed = false
		}
		options.resize(next)
	}
	const valid = (owned: Session) => {
		const current = options.state()
		return (
			!disposed &&
			session === owned &&
			owned.live &&
			!owned.released &&
			!owned.handle?.closed &&
			current.open &&
			current.anchor === owned.anchor &&
			current.input === owned.input &&
			owned.anchor.window === owned.window &&
			owned.input.window === owned.window
		)
	}
	const refresh = () => {
		if (disposed) {
			return
		}
		const current = options.state(),
			rising = current.open && !wasOpen
		wasOpen = current.open
		if (!current.open) {
			canceled = false
			try {
				retire()
			} finally {
				stop()
			}

			return
		}
		if (rising) {
			canceled = false
		}
		if (canceled) {
			return
		}
		if (
			session &&
			(!session.live ||
				session.released ||
				session.handle?.closed ||
				session.anchor.window !== session.window ||
				session.input.window !== session.window)
		) {
			canceled = true
			try {
				retire()
			} finally {
				stop()
			}

			options.dismiss()
			return
		}
		if (!observed) {
			const host = native(),
				center = host.NSNotificationCenter?.defaultCenter

			if (center?.addObserverForNameObjectQueueUsingBlock && center?.removeObserver) {
				const token = center.addObserverForNameObjectQueueUsingBlock(
					host.NSWindowDidUpdateNotification ?? 'NSWindowDidUpdateNotification',
					null,
					null,
					(note: { object: unknown }) => {
						const latest = options.state()
						if (note.object === latest.input?.window || note.object === session?.window) {
							update()
						}
					},
				)

				if (token != null) {
					if (disposed) {
						center.removeObserver(token)
					} else {
						observed = () => center.removeObserver(token)
					}
				}
			}
		}
		const anchor = current.anchor,
			input = current.input
		if (!nativeAnchor(anchor) || !input?.window || anchor.window !== input.window) {
			retire()
			return
		}
		if (session && (session.anchor !== anchor || session.input !== input)) {
			retire()
		}
		const window = input.window,
			content = window.contentView,
			viewport = content?.bounds
		if (
			!content ||
			!viewport ||
			![viewport.size.width, viewport.size.height].every(Number.isFinite) ||
			viewport.size.width <= 0 ||
			viewport.size.height <= 0
		) {
			return
		}
		const rect = anchor.convertRectToView(anchor.bounds, content)
		const bounds = {
			left: rect.origin.x - viewport.origin.x,
			top: content.flipped
				? rect.origin.y - viewport.origin.y
				: viewport.size.height - (rect.origin.y - viewport.origin.y) - rect.size.height,
			width: rect.size.width,
			height: rect.size.height,
		}
		if (
			![bounds.left, bounds.top, bounds.width, bounds.height].every(Number.isFinite) ||
			bounds.width <= 0 ||
			bounds.height <= 0
		) {
			return
		}
		resize(
			sizeFor(
				bounds,
				{ left: 0, top: 0, width: viewport.size.width, height: viewport.size.height },
				current,
			),
		)
		if (session) {
			if (session.handle && !session.released) {
				session.handle.update({})
			}

			return
		}
		const host = bridge(),
			show = host?.showLayer
		if (typeof show !== 'function') {
			throw new Error('AppKit typeahead results require the source-owned window-layer host')
		}
		const owned: Session = {
			token: {},
			anchor,
			input,
			window,
			handle: null,
			target: null,
			live: true,
			released: false,
			committed: false,
			revealed: false,
			waiters: [],
		}
		session = owned
		try {
			const handle: Layer | null =
				show.call(host, {
					anchor,
					deferPresentation: true,
					lightDismiss: true,
					excludeAnchorFromDismiss: true,
					position: (
						bounds: PopoverRect,
						panel: { width: number; height: number },
						viewport: PopoverRect,
					) => {
						const latest = options.state()
						if (valid(owned)) {
							resize(sizeFor(bounds, viewport, latest))
						}
						const placement = latest.placement ?? 'bottom'
						return positionPopover(
							bounds,
							panel,
							viewport,
							placement,
							8,
							resolveLayerAlignment('start', placement, latest.rtl),
						)
					},
					createContentRoot: (target: NSView) => {
						owned.target = target
						if (valid(owned)) {
							options.publish({ token: owned.token, view: target })
						}
						return {
							render() {},
							whenCommitted(callback: () => void) {
								if (!valid(owned)) {
									return
								}
								if (owned.committed) {
									callback()
								} else {
									owned.waiters.push(callback)
								}
							},
							unmount() {
								owned.released = true
								owned.committed = false
								owned.waiters = []
								if (!disposed && session === owned) {
									options.publish(null, owned.token)
								}
							},
						}
					},
					onClose: () => {
						if (disposed || session !== owned || !owned.live) {
							return
						}
						if (owned.released || owned.handle?.closed) {
							canceled = true
							try {
								retire(owned)
							} finally {
								stop()
							}

							options.dismiss()
						} else if (valid(owned) && options.canDismiss()) {
							options.dismiss()
						}
					},
				}) ?? null

			owned.handle = handle
			if (!valid(owned)) {
				if (session === owned) {
					retire(owned)
				} else {
					handle?.close()
				}

				if (!disposed && !canceled && (anchor.window !== window || input.window !== window)) {
					canceled = true
					stop()
					options.dismiss()
				}

				return
			}

			if (!handle || handle.closed) {
				retire(owned)
				canceled = true
				stop()
				options.dismiss()
				return
			}

			if (
				!owned.target ||
				typeof handle.show !== 'function' ||
				typeof handle.update !== 'function' ||
				typeof handle.close !== 'function'
			) {
				throw new TypeError(
					'AppKit typeahead results require a source outlet and staged window-layer handle',
				)
			}

			if (owned.committed) {
				handle.update({})
				if (owned.committed) {
					handle.show()
					owned.revealed = true
				}
			}
		} catch (error) {
			try {
				retire(owned)
			} catch {}

			try {
				stop()
			} catch {}

			throw error
		}
	}
	const update = (): void => {
		if (disposed) {
			return
		}
		if (updating) {
			if (!queued) {
				queued = true
				void Promise.resolve().then(() => {
					queued = false
					update()
				})
			}

			return
		}
		updating = true
		try {
			refresh()
		} catch (error) {
			try {
				retire()
			} catch {}

			try {
				stop()
			} catch {}

			throw error
		} finally {
			updating = false
		}
	}
	return {
		update,
		isPresent: (): boolean => !!session?.handle && valid(session) && session.revealed,
		committed(token: object): boolean | undefined {
			const owned = session
			if (!owned || owned.token !== token || !valid(owned)) {
				return
			}
			owned.committed = true
			const waiting = owned.waiters.splice(0)
			for (const ready of waiting) {
				if (!valid(owned)) {
					return
				}

				ready()
			}
			if (!valid(owned) || !owned.committed || !owned.handle) {
				return
			}
			if (!waiting.length) {
				owned.handle.update({})
			}
			if (valid(owned) && owned.committed && !owned.revealed) {
				owned.handle.show()
				owned.revealed = true
			}
			return valid(owned) && owned.committed && owned.revealed
		},
		dispose(): void {
			if (disposed) {
				return
			}
			disposed = true
			try {
				retire()
			} finally {
				stop()
			}
		},
	}
}

/** Field and detached result views form one native blur boundary. Include the
 * shared field editor's delegate when the first responder is not a view child. */
export function appKitTypeaheadOwnsFocus(roots: readonly (NSView | null)[]): boolean {
	const read = (view: object | null | undefined, key: string) => {
		const value = view && Reflect.get(view, key)
		return typeof value === 'function' ? value.call(view) : value
	}
	for (const root of roots) {
		if (!root?.window) {
			continue
		}

		const responder = root.window.firstResponder
		for (const start of [responder, read(responder, 'delegate')]) {
			const seen = new Set<object>()
			for (let view = start; view && !seen.has(view); view = read(view, 'superview')) {
				if (view === root) {
					return true
				}

				seen.add(view)
			}
		}
	}
	return false
}
