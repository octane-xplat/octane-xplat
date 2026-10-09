import { DragDropManager, Draggable, Droppable, Sensor } from '@dnd-kit/abstract'
import { defaultCollisionDetection } from '@dnd-kit/collision'
import { batch, effect, signal, untracked } from '@dnd-kit/state'
import type { Rectangle } from '@dnd-kit/geometry'
import type { PanEvent } from '@octane-xplat/ui'
import type {
	DndContextProps,
	DndId,
	DndSnapshot,
	DragEvent,
	DraggableOptions,
	DroppableOptions,
} from './props'

import { measure } from './geometry'

class PanDraggable extends Draggable {
	onPan?: (event: PanEvent) => void
	activationDistance = 0
	setActivationDistance(value?: number) {
		const distance = value ?? 0
		if (!Number.isFinite(distance) || distance < 0) {
			throw new RangeError('activationDistance must be a finite non-negative number')
		}

		this.activationDistance = distance
	}
}

/** Xplat View supplies normalized pan input; the abstract core owns the drag lifecycle. */
class PanSensor extends Sensor<DragDropManager<PanDraggable, Droppable>> {
	bind(input: Draggable) {
		const source = input as PanDraggable
		let origin: Rectangle | null = null
		let pendingOrigin: Rectangle | null = null
		let bound = true
		let base = { x: 0, y: 0 }
		let activationDistance = 0
		let queue = Promise.resolve()
		const manager = this.manager as unknown as DndController
		const start = async (shape: Rectangle) => {
			origin = shape
			manager.scrollShift$.value = { x: 0, y: 0 }
			manager.actions.start({ source, coordinates: shape.center })
			manager.dragOperation.shape = shape
			manager.refresh()
			manager.startAutoScroll()
			await manager.renderer.rendering
		}
		const handle = async (event: PanEvent) => {
			if (!bound) {
				return
			}

			if (event.state === 'began') {
				if (source.disabled || !manager.dragOperation.status.idle) {
					return
				}

				const measured = measure(manager.draggableNodes.get(source.id))
				if (!measured) {
					return
				}

				origin = null
				pendingOrigin = measured
				base = { x: event.dx, y: event.dy }
				activationDistance = source.activationDistance
				if (activationDistance === 0) {
					pendingOrigin = null
					await start(measured)
				}

				return
			}

			if (pendingOrigin) {
				if (event.state === 'cancelled' || (event.state !== 'ended' && source.disabled)) {
					pendingOrigin = null
					return
				}

				const x = event.dx - base.x
				const y = event.dy - base.y
				if (Math.hypot(x, y) >= activationDistance) {
					if (source.disabled || !manager.dragOperation.status.idle) {
						pendingOrigin = null
						return
					}

					const measured = pendingOrigin
					pendingOrigin = null
					await start(measured)
				} else {
					if (event.state === 'ended') {
						pendingOrigin = null
					}

					return
				}
			}

			if (
				!origin ||
				manager.dragOperation.source?.id !== source.id ||
				!manager.dragOperation.status.dragging
			) {
				return
			}

			const x = event.dx - base.x
			const y = event.dy - base.y
			manager.actions.move({ to: { x: origin.center.x + x, y: origin.center.y + y } })
			// The core commits movement in a microtask. Serialize release after it.
			await Promise.resolve()
			manager.dragOperation.shape = origin.translate(x, y)
			manager.refresh()
			if (event.state === 'ended' || event.state === 'cancelled') {
				manager.actions.stop({ canceled: event.state === 'cancelled' })
				origin = null
			} else {
				manager.startAutoScroll()
			}
		}

		source.onPan = (event) => {
			queue = queue
				.then(() => handle(event))
				.catch((error) => {
					origin = null

					manager.cancel()
					console.error('[dnd-kit] pan failed', error)
				})
		}

		return () => {
			bound = false
			source.onPan = undefined
			origin = null
			pendingOrigin = null
		}
	}
}

/** One controller per DndContext; no global registry or cross-root context assumptions. */
export class DndController extends DragDropManager<PanDraggable, Droppable> {
	options: DndContextProps = {}
	readonly draggableNodes = new Map<DndId, any>()
	readonly droppableNodes = new Map<DndId, any>()
	readonly scrollShift$ = signal({ x: 0, y: 0 })
	private listeners = new Set<() => void>()
	private snapshot: DndSnapshot = {
		active: null,
		over: null,
		transform: { x: 0, y: 0 },
		isDragging: false,
	}
	private dispose: () => void
	private scrollTimer: ReturnType<typeof setInterval> | undefined
	private destroyed = false
	constructor() {
		super({ sensors: [PanSensor] })
		this.dispose = effect(() => {
			const operation = this.dragOperation
			const active = operation.source
			const over = operation.target
			const transform = operation.transform
			const isDragging = operation.status.dragging
			this.snapshot = {
				active: active && !operation.status.idle ? { id: active.id, data: active.data } : null,
				over: over && !operation.status.idle ? { id: over.id, data: over.data } : null,
				transform: {
					x: operation.status.idle ? 0 : transform.x + this.scrollShift$.value.x,
					y: operation.status.idle ? 0 : transform.y + this.scrollShift$.value.y,
				},
				isDragging,
			}

			untracked(() => {
				for (const listener of this.listeners) {
					listener()
				}
			})
		})

		const event = (canceled = false): DragEvent => {
			const operation = this.dragOperation
			return {
				active: operation.source ? { id: operation.source.id, data: operation.source.data } : null,
				over: operation.target ? { id: operation.target.id, data: operation.target.data } : null,
				transform: { ...operation.transform },
				isDragging: operation.status.dragging,
				canceled,
			}
		}

		this.monitor.addEventListener('dragstart', () => this.options.onDragStart?.(event()))
		this.monitor.addEventListener('dragover', () => this.options.onDragOver?.(event()))
		// dragmove fires before position is committed, so deliver the committed snapshot.
		this.monitor.addEventListener('dragmove', () =>
			queueMicrotask(() =>
				queueMicrotask(() => {
					if (!this.destroyed && this.dragOperation.status.dragging) {
						this.options.onDragMove?.(event())
					}
				}),
			),
		)

		this.monitor.addEventListener('dragend', ({ canceled }) => {
			this.stopAutoScroll()
			if (canceled) {
				this.options.onDragCancel?.(event(true))
			} else {
				this.options.onDragEnd?.(event())
			}
		})
	}
	getSnapshot = (): DndSnapshot => this.snapshot
	subscribe = (listener: () => void) => {
		this.listeners.add(listener)
		return () => {
			this.listeners.delete(listener)
		}
	}
	registerDraggable(options: DraggableOptions) {
		if (this.registry.draggables.has(options.id)) {
			throw new Error(`Duplicate draggable id: ${options.id}`)
		}

		const source: PanDraggable = new PanDraggable(
			{
				...options,
				register: false,
				effects: () => [() => this.registry.sensors.get(PanSensor)!.bind(source)],
			},
			this,
		)

		source.setActivationDistance(options.activationDistance)
		source.register()
		return source
	}
	registerDroppable(options: DroppableOptions) {
		if (this.registry.droppables.has(options.id)) {
			throw new Error(`Duplicate droppable id: ${options.id}`)
		}

		const target = new Droppable(
			{
				...options,
				register: false,
				accept: options.accept
					? (source) => options.accept!({ id: source.id, data: source.data })
					: undefined,
				collisionDetector: (input) =>
					input.dragOperation.source?.id === input.droppable.id
						? null
						: (this.options.collisionDetection ?? defaultCollisionDetection)(input),
			},
			this,
		)

		target.register()
		return target
	}
	refresh() {
		batch(() => {
			for (const droppable of this.registry.droppables) {
				droppable.shape = measure(this.droppableNodes.get(droppable.id)) ?? undefined
			}
		})

		this.collisionObserver.forceUpdate()
	}
	cancel() {
		this.stopAutoScroll()
		this.actions.stop({ canceled: true })
	}
	startAutoScroll() {
		if (this.scrollTimer || !this.options.autoScroll) {
			return
		}

		this.scrollTimer = setInterval(() => {
			const scroll = this.options.autoScroll
			if (!scroll || !this.dragOperation.status.dragging) {
				this.stopAutoScroll()
				return
			}

			const bounds = scroll.bounds()
			if (!bounds) {
				return
			}

			const horizontal = scroll.axis === 'x'
			const start = horizontal ? bounds.x : bounds.y
			const size = horizontal ? bounds.width : bounds.height
			const point = horizontal
				? this.dragOperation.position.current.x
				: this.dragOperation.position.current.y

			const threshold = Math.min(scroll.threshold ?? 40, size / 2)
			if (threshold <= 0 || point < start || point > start + size) {
				return
			}

			const strength =
				point < start + threshold
					? -(1 - (point - start) / threshold)
					: point > start + size - threshold
						? 1 - (start + size - point) / threshold
						: 0

			const next = Math.max(
				0,
				Math.min(scroll.maxOffset(), scroll.offsetRef.current + strength * (scroll.speed ?? 12)),
			)

			if (next !== scroll.offsetRef.current) {
				const before = scroll.offsetRef.current
				scroll.scrollTo(next)
				const delta = scroll.offsetRef.current - before
				const shift = this.scrollShift$.peek()
				this.scrollShift$.value = {
					x: shift.x + (horizontal ? delta : 0),
					y: shift.y + (horizontal ? 0 : delta),
				}

				this.refresh()
			}
		}, 16)
	}
	private stopAutoScroll() {
		if (this.scrollTimer) {
			clearInterval(this.scrollTimer)
		}

		this.scrollTimer = undefined
	}
	disposeController() {
		this.destroyed = true
		this.cancel()
		this.dispose()
		this.listeners.clear()
		this.draggableNodes.clear()
		this.droppableNodes.clear()
		this.destroy()
	}
}
