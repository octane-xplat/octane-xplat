/** @jsxImportSource @octane-xplat/jsx */
import { useCallback, useEffect, useRef, useState } from 'octane'
import { View } from '@nativescript/core'
import type { ViewBase } from '@nativescript/core'
import { NSWinRT } from '@octane-xplat/platform/windows'
import type { MeasureBounds, MeasureResult, UseMeasureOptions } from './props'

// The preview's event-property projection owns one JS handler per native event.
// Multiplex hook readers rather than replacing each other's LayoutUpdated delegate.
type LayoutObserver = {
	native: any
	delegate: any
	callbacks: Set<() => void>
	sync: () => void
}

const layoutObservers = new WeakMap<View, LayoutObserver>()

function observeLayout(view: View, callback: () => void): () => void {
	let entry = layoutObservers.get(view)
	if (!entry) {
		const callbacks = new Set<() => void>()
		const state: LayoutObserver = {
			native: undefined,
			delegate: undefined,
			callbacks,
			sync: () => {
				const native = view.nativeViewProtected
				if (native === state.native) {
					return
				}

				if (state.native && state.native.LayoutUpdated === state.delegate) {
					state.native.LayoutUpdated = null
				}

				state.native = undefined
				state.delegate = undefined
				if (!native) {
					return
				}

				if (native.LayoutUpdated != null) {
					throw new Error(
						'Windows useMeasure requires ownership of the native LayoutUpdated handler',
					)
				}

				if (native.LayoutUpdated != null) {
					throw new Error(
						'Windows useMeasure requires ownership of the native LayoutUpdated handler',
					)
				}

				const delegate = NSWinRT.asDelegate('Windows.Foundation.EventHandler`1<Object>', () => {
					for (const notify of callbacks) {
						notify()
					}
				})

				native.LayoutUpdated = delegate
				state.native = native
				state.delegate = delegate
			},
		}

		entry = state
		layoutObservers.set(view, entry)
		view.on('loaded', entry.sync)
	}

	entry.callbacks.add(callback)
	const observed = entry
	let active = true
	const release = () => {
		if (!active) {
			return
		}

		active = false
		observed.callbacks.delete(callback)
		if (observed.callbacks.size) {
			return
		}

		view.off('loaded', observed.sync)
		if (observed.native && observed.native.LayoutUpdated === observed.delegate) {
			observed.native.LayoutUpdated = null
		}

		observed.native = undefined
		observed.delegate = undefined
		layoutObservers.delete(view)
	}

	try {
		observed.sync()
	} catch (error) {
		release()
		throw error
	}

	return release
}

/** Screen position of the app surface's top-left — the topmost attached
 *  ancestor's location. `(0,0)` for full-screen windows; non-zero under
 *  Android multi-window or a moved iPadOS window. A detached or oddly
 *  rooted ancestor still reports its own position, so the subtraction
 *  degrades to the old screen-relative value rather than failing. */
function surfaceOrigin(view: View): { x: number; y: number } {
	let root: ViewBase = view
	while (root?.parent) {
		root = root.parent
	}

	const point = root instanceof View ? root.getLocationOnScreen() : undefined
	return point ? { x: point.x, y: point.y } : { x: 0, y: 0 }
}

function readBounds(view: View): MeasureBounds | null {
	const point = view?.getLocationOnScreen?.()
	const size = view?.getActualSize?.()
	if (!point || !size) {
		return null
	}

	const origin = surfaceOrigin(view)
	return {
		x: point.x - origin.x,
		y: point.y - origin.y,
		width: size.width,
		height: size.height,
	}
}

/** Observe Windows layout, including same-size native views reattached by keyed moves. */
export function useMeasure(options: UseMeasureOptions = {}): MeasureResult {
	const [bounds, setBounds] = useState<MeasureBounds | null>(null)
	const detach = useRef<(() => void) | null>(null)
	const observe = options.observe ?? true
	const ref = useCallback(
		(element: unknown) => {
			detach.current?.()
			detach.current = null
			if (!(element instanceof View)) {
				setBounds(null)
				return
			}

			const view = element
			const update = () => {
				const next = readBounds(view)
				// Fresh object each read — skip the setState when nothing moved
				// or the re-render → layoutChanged → update loop never ends.
				setBounds((prev: MeasureBounds | null) => {
					return prev &&
						next &&
						prev.x === next.x &&
						prev.y === next.y &&
						prev.width === next.width &&
						prev.height === next.height
						? prev
						: next
				})
			}

			// Reattached same-size views may not emit SizeChanged. LayoutUpdated
			// observes their final arrange; defer state writes out of that callback.
			let pending: ReturnType<typeof setTimeout> | undefined
			const afterAttach = () => {
				if (pending !== undefined) {
					return
				}

				pending = setTimeout(() => {
					pending = undefined
					update()
				}, 0)
			}

			let releaseLayout: (() => void) | undefined
			const attachLayout = () => {
				releaseLayout ??= observeLayout(view, () => {
					afterAttach()
					if (!observe) {
						releaseLayout?.()
						releaseLayout = undefined
					}
				})
			}

			update()
			attachLayout()
			view.on('loaded', attachLayout)
			const scrollParents: ViewBase[] = []
			if (observe) {
				view.on?.('layoutChanged', update)
				let parent = view.parent
				while (parent) {
					parent.on?.('scroll', update)
					scrollParents.push(parent)
					parent = parent.parent
				}
			}

			detach.current = () => {
				view.off('loaded', attachLayout)
				releaseLayout?.()
				if (pending !== undefined) {
					clearTimeout(pending)
				}

				if (observe) {
					view.off?.('layoutChanged', update)
					for (const parent of scrollParents) {
						parent.off?.('scroll', update)
					}
				}
			}
		},
		[observe],
	)

	useEffect(() => () => detach.current?.(), [])

	return { ref, bounds }
}
