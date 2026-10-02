import {
	createContext,
	useContext,
	useRef,
	useEffect,
	useCallback,
	useSyncExternalStore,
} from 'octane'

import { View, useMeasure } from '@octane-xplat/ui'
import { DndController } from './controller'
import { dragStyle } from './geometry'
import { arrayMove } from './sort'
import type {
	DndId,
	DndContextProps,
	DndSnapshot,
	DraggableOptions,
	DraggableResult,
	DroppableOptions,
	DroppableResult,
	SortableContextProps,
	SortableResult,
	SortableListProps,
} from './props'

const Context = createContext<DndController | null>(null)
const SortContext = createContext<readonly (string | number)[] | null>(null)

/** Scope registrations to one renderer root. Nested roots need their own DndContext. */
export function DndContext(props: DndContextProps) {
	const ref = useRef<DndController | null>(null)
	if (!ref.current) {
		ref.current = new DndController()
	}

	const controller = ref.current
	controller.options = props
	useEffect(() => () => controller.disposeController(), [controller])
	return <Context value={controller}>{props.children}</Context>
}

function useController(): DndController {
	const controller = useContext(Context)
	if (!controller) {
		throw new Error('Drag and drop hooks require DndContext')
	}

	return controller
}

/** Subscribes independently so retained native children observe drag state. */
export function useDndContext(): DndSnapshot {
	const controller = useController()
	return useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot)
}

export function useDraggable(options: DraggableOptions): DraggableResult {
	const controller = useController()
	const snapshot = useDndContext()
	const entity = useRef<ReturnType<DndController['registerDraggable']> | null>(null)
	const node = useRef<any>(null)
	const latest = useRef(options)
	latest.current = options
	const measurement = useMeasure()
	useEffect(() => {
		const registered = controller.registerDraggable(latest.current)
		entity.current = registered
		if (node.current) {
			controller.draggableNodes.set(options.id, node.current)
		}

		return () => {
			if (controller.getSnapshot().active?.id === options.id) {
				controller.cancel()
			}

			registered.destroy()
			entity.current = null
			controller.draggableNodes.delete(options.id)
		}
	}, [controller, options.id])

	useEffect(() => {
		if (!entity.current) {
			return
		}

		entity.current.data = options.data ?? {}
		entity.current.disabled = options.disabled ?? false
		if (options.disabled && controller.getSnapshot().active?.id === options.id) {
			controller.cancel()
		}
	}, [controller, options.id, options.data, options.disabled])

	const ref = useCallback(
		(element: any) => {
			node.current = element
			measurement.ref(element)
			if (element) {
				controller.draggableNodes.set(options.id, element)
			} else {
				controller.draggableNodes.delete(options.id)
			}
		},
		[controller, options.id, measurement.ref],
	)

	const onPan = useCallback(
		(event: Parameters<DraggableResult['onPan']>[0]) => entity.current?.onPan?.(event),
		[],
	)

	const isDragging = snapshot.isDragging && snapshot.active?.id === options.id
	const transform = isDragging ? snapshot.transform : { x: 0, y: 0 }
	return { ref, onPan, isDragging, transform, style: dragStyle(transform.x, transform.y) }
}

export function useDroppable(options: DroppableOptions): DroppableResult {
	const controller = useController()
	const snapshot = useDndContext()
	const entity = useRef<ReturnType<DndController['registerDroppable']> | null>(null)
	const node = useRef<any>(null)
	const latest = useRef(options)
	latest.current = options
	const measurement = useMeasure()
	useEffect(() => {
		const registered = controller.registerDroppable(latest.current)
		entity.current = registered
		if (node.current) {
			controller.droppableNodes.set(options.id, node.current)
		}

		controller.refresh()
		return () => {
			registered.destroy()
			entity.current = null
			controller.droppableNodes.delete(options.id)
			controller.refresh()
		}
	}, [controller, options.id])

	useEffect(() => {
		if (!entity.current) {
			return
		}

		entity.current.data = options.data ?? {}
		entity.current.disabled = options.disabled ?? false
		entity.current.accept = options.accept
			? (source) => options.accept!({ id: source.id, data: source.data })
			: undefined

		controller.refresh()
	}, [
		controller,
		options.data,
		options.disabled,
		options.accept,
		controller.options.collisionDetection,
		measurement.bounds,
	])

	const ref = useCallback(
		(element: any) => {
			node.current = element
			measurement.ref(element)
			if (element) {
				controller.droppableNodes.set(options.id, element)
			} else {
				controller.droppableNodes.delete(options.id)
			}
		},
		[controller, options.id, measurement.ref],
	)

	return { ref, isOver: snapshot.isDragging && snapshot.over?.id === options.id }
}

/** Declares list membership for useSortable; it does not own item order. */
export function SortableContext(props: SortableContextProps) {
	if (new Set(props.items).size !== props.items.length) {
		throw new Error('SortableContext requires unique item ids')
	}

	return <SortContext value={props.items}>{props.children}</SortContext>
}

/** Bind and spread onPan/style onto one View. Order changes only when the owner commits a drop. */
export function useSortable(options: DraggableOptions): SortableResult {
	const items = useContext(SortContext)
	if (!items?.includes(options.id)) {
		throw new Error('useSortable requires membership in SortableContext')
	}

	const drag = useDraggable(options)
	const drop = useDroppable(options)
	const ref = useCallback(
		(element: any) => {
			drag.ref(element)
			drop.ref(element)
		},
		[drag.ref, drop.ref],
	)

	return { ...drag, ref, isOver: drop.isOver }
}

function SortableRow<T extends DndId>(props: { id: T; index: number; list: SortableListProps<T> }) {
	const sortable = useSortable({ id: props.id, disabled: props.list.disabled })
	return (
		<View ref={sortable.ref} onPan={sortable.onPan} style={sortable.style}>
			{props.list.renderItem(props.id, props.index)}
		</View>
	)
}

/** A controlled sortable list. Provide stable unique ids and save the order in onReorder. */
export function SortableList<T extends DndId>(props: SortableListProps<T>) {
	const {
		items,
		renderItem: _renderItem,
		onReorder,
		disabled: _disabled,
		dnd,
		...viewProps
	} = props

	return (
		<DndContext
			{...dnd}
			onDragEnd={(event) => {
				if (event.active && event.over) {
					const from = items.findIndex((id) => id === event.active!.id)
					const to = items.findIndex((id) => id === event.over!.id)
					if (from >= 0 && to >= 0 && from !== to) {
						onReorder(arrayMove(items, from, to), event)
					}
				}

				dnd?.onDragEnd?.(event)
			}}
		>
			<SortableContext items={items}>
				<View {...viewProps}>
					{items.map((id, index) => (
						<SortableRow key={id} id={id} index={index} list={props} />
					))}
				</View>
			</SortableContext>
		</DndContext>
	)
}
