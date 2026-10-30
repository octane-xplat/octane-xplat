import type { CollisionDetector, Data, UniqueIdentifier } from '@dnd-kit/abstract'
import type { PanEvent, ViewProps } from '@octane-xplat/ui'

/** Identifier type for draggables/droppables. */
export type DndId = UniqueIdentifier
/** A registered draggable/droppable record. */
export interface DndItem {
	/** Registry id — reported back in events. */
	id: DndId
	/** Opaque payload carried through drag events. */
	data: Data
}

/** Point-in-time drag state delivered to listeners. */
export interface DndSnapshot {
	/** The currently dragged draggable, when dragging. */
	active: DndItem | null
	/** The droppable currently under the pointer. */
	over: DndItem | null
	/** Current drag offset applied to the element. */
	transform: { x: number; y: number }
	/** True while this node is the active drag. */
	isDragging: boolean
}

/** Payload for drag lifecycle callbacks. */
export interface DragEvent extends DndSnapshot {
	/** True when the drag was cancelled rather than dropped. */
	canceled: boolean
}

/** Supply current viewport bounds and offsets; scrollTo must update offsetRef synchronously. */
export interface AutoScroll {
	/** Measured bounds of the dragged element. */
bounds(): { x: number; y: number; width: number; height: number } | null
	/** Mutable offset updated during drag without re-render. */
	offsetRef: { current: number }
	/** Scroll travel cap per frame. */
maxOffset(): number
	/** Scroll the container by a delta. */
scrollTo(offset: number): void
	/** Constrain autoscroll to an axis. */
	axis?: 'x' | 'y'
	/** Distance from the edge (px) that triggers autoscroll. */
	threshold?: number
	/** Autoscroll speed factor. */
	speed?: number
}

/** Props for the DndContext provider element. */
export interface DndContextProps {
	/** Content the context wraps; `unknown` accepts any renderable. */
	children?: ViewProps['children']
	/** Strategy choosing which droppable wins overlap. */
	collisionDetection?: CollisionDetector
	/** Viewport scroll behavior near edges during drag. */
	autoScroll?: AutoScroll
	/** Drag began — carries the active draggable. */
	onDragStart?: (event: DragEvent) => void
	/** Pointer moved mid-drag; fires per frame. */
	onDragMove?: (event: DragEvent) => void
	/** The droppable under the pointer changed. */
	onDragOver?: (event: DragEvent) => void
	/** Drag finished (drop or release outside). */
	onDragEnd?: (event: DragEvent) => void
	/** Drag cancelled (Escape). */
	onDragCancel?: (event: DragEvent) => void
}

/** Options for useDraggable. */
export interface DraggableOptions {
	/** Registry id — reported back in events. */
	id: DndId
	/** Opaque payload carried through drag events. */
	data?: Data
	/** Opt the node out of dragging/dropping. */
	disabled?: boolean
	/** Minimum pointer movement before a drag starts, in platform logical units. Defaults to 0. */
	activationDistance?: number
}

/** Options for useDroppable. */
export interface DroppableOptions extends DraggableOptions {
	/** Restrict which draggables this droppable accepts. */
	accept?: (source: DndItem) => boolean
}

/** Handle/state returned by useDraggable. */
export interface DraggableResult {
	/** Ref callback wiring the node into the dnd registry. */
	ref(element: any): void
	/** Attach to the drag surface; it may be a descendant of the measured `ref` node. */
	onPan(event: PanEvent): void
	/** True while this node is the active drag. */
	isDragging: boolean
	/** Current drag offset applied to the element. */
	transform: { x: number; y: number }
	/** Spread into View with ref and onPan. */
	style: NonNullable<ViewProps['style']>
}

/** Handle/state returned by useDroppable. */
export interface DroppableResult {
	/** Ref callback wiring the node into the dnd registry. */
	ref(element: any): void
	/** True while the pointer is over this droppable. */
	isOver: boolean
}

/** Handle/state returned by useSortable. */
export interface SortableResult extends DraggableResult {
	/** True while the pointer is over this droppable. */
	isOver: boolean
}

/** Props for the SortableContext provider. */
export interface SortableContextProps {
	/** Ordered item ids/data for sorting. */
	items: readonly DndId[]
	/** Content the context wraps; `unknown` accepts any renderable. */
	children?: ViewProps['children']
}

/** Props for the SortableList element. */
export interface SortableListProps<T extends DndId = DndId> extends Omit<ViewProps, 'children'> {
	/** Ordered item ids/data for sorting. */
	items: readonly T[]
	/** Row renderer — receives the item; any renderable. */
	renderItem(id: T, index: number): ViewProps['children']
	/** Minimum movement before any row starts dragging, in platform logical units. Defaults to 0. */
	activationDistance?: number
	/** Render a separate drag surface; when supplied, row pan input is attached only to this handle. */
	renderHandle?(id: T, index: number, onPan: DraggableResult['onPan']): ViewProps['children']
	/** Called after a successful drop within this list; caller owns the item order. */
	onReorder(items: T[], event: DragEvent): void
	/** Opt the node out of dragging/dropping. */
	disabled?: boolean
	/** The shared DndContext handle. */
	dnd?: Omit<DndContextProps, 'children'>
}
