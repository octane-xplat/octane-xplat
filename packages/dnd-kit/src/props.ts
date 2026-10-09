import type { CollisionDetector, Data, UniqueIdentifier } from '@dnd-kit/abstract'
import type { PanEvent, ViewProps } from '@octane-xplat/ui'

export type DndId = UniqueIdentifier
export interface DndItem {
	id: DndId
	data: Data
}

export interface DndSnapshot {
	active: DndItem | null
	over: DndItem | null
	transform: { x: number; y: number }
	isDragging: boolean
}

export interface DragEvent extends DndSnapshot {
	canceled: boolean
}

/** Supply current viewport bounds and offsets; scrollTo must update offsetRef synchronously. */
export interface AutoScroll {
	bounds(): { x: number; y: number; width: number; height: number } | null
	offsetRef: { current: number }
	maxOffset(): number
	scrollTo(offset: number): void
	axis?: 'x' | 'y'
	threshold?: number
	speed?: number
}

export interface DndContextProps {
	children?: ViewProps['children']
	collisionDetection?: CollisionDetector
	autoScroll?: AutoScroll
	onDragStart?: (event: DragEvent) => void
	onDragMove?: (event: DragEvent) => void
	onDragOver?: (event: DragEvent) => void
	onDragEnd?: (event: DragEvent) => void
	onDragCancel?: (event: DragEvent) => void
}

export interface DraggableOptions {
	id: DndId
	data?: Data
	disabled?: boolean
	/** Minimum pointer movement before a drag starts, in platform logical units. Defaults to 0. */
	activationDistance?: number
}

export interface DroppableOptions extends DraggableOptions {
	accept?: (source: DndItem) => boolean
}

export interface DraggableResult {
	ref(element: any): void
	/** Attach to the drag surface; it may be a descendant of the measured `ref` node. */
	onPan(event: PanEvent): void
	isDragging: boolean
	transform: { x: number; y: number }
	/** Spread into View with ref and onPan. */
	style: NonNullable<ViewProps['style']>
}

export interface DroppableResult {
	ref(element: any): void
	isOver: boolean
}

export interface SortableResult extends DraggableResult {
	isOver: boolean
}

export interface SortableContextProps {
	items: readonly DndId[]
	children?: ViewProps['children']
}

export interface SortableListProps<T extends DndId = DndId> extends Omit<ViewProps, 'children'> {
	items: readonly T[]
	renderItem(id: T, index: number): ViewProps['children']
	/** Minimum movement before any row starts dragging, in platform logical units. Defaults to 0. */
	activationDistance?: number
	/** Render a separate drag surface; when supplied, row pan input is attached only to this handle. */
	renderHandle?(id: T, index: number, onPan: DraggableResult['onPan']): ViewProps['children']
	/** Called after a successful drop within this list; caller owns the item order. */
	onReorder(items: T[], event: DragEvent): void
	disabled?: boolean
	dnd?: Omit<DndContextProps, 'children'>
}
