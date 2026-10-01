import { useEffect, useMemo, useRef, useState } from 'octane'
import type { VirtualListProps } from './props'
import {
	createVirtualListEntries,
	estimateVirtualListSizes,
	virtualListMeasurementKey,
	virtualListRange,
	VirtualListSizeIndex,
	type VirtualListEntry,
	type VirtualListSizeRecord,
} from './virtual-list-layout'

import { VirtualListCellPool } from './virtual-list-cell-pool'

import { applyEscapeProps } from './escape-props'
import { layoutChildProps } from './layout-child.web'

type NodeMeta =
	| { kind: 'viewport' }
	| { kind: 'row'; rowKey: string; cellId: number; generation: number }
	| { kind: 'header' }
	| { kind: 'footer' }

function sameSize(a: number, b: number) {
	return Math.abs(a - b) < 0.5
}

/** Shared vertical virtualization over a DOM scroll container. Rows outside
 *  the viewport plus one viewport of overscan are unmounted. */
export function VirtualList<T = any>(props: VirtualListProps<T>) @{
	const entries = useMemo(
		() => createVirtualListEntries(props.items, props.keyExtractor, props.getItemType),
		[props.items, props.keyExtractor, props.getItemType],
	)

	const [windowVersion, setWindowVersion] = useState(0)
	const sizeIndexRef = useRef(new VirtualListSizeIndex())
	const cellsRef = useRef(new VirtualListCellPool<T>())
	const cellCallbacksRef = useRef(new Map<number, (node: Element | null) => void>())
	const measuredAssignmentsRef = useRef(new Map<number, number>())
	const disposedRef = useRef(false)
	const sizeCacheRef = useRef(new Map<string, VirtualListSizeRecord>())
	const entriesRef = useRef<VirtualListEntry<T>[]>([])
	const indexByRowKeyRef = useRef(new Map<string, number>())
	const scrollRef = useRef<HTMLElement | null>(null)
	const scrollOffsetRef = useRef(0)
	const viewportHeightRef = useRef(0)
	const viewportWidthRef = useRef(0)
	const headerHeightRef = useRef(0)
	const footerHeightRef = useRef(0)
	const observerRef = useRef<ResizeObserver | null>(null)
	const estimateScheduledRef = useRef(false)
	const nodesBySlotRef = useRef(new Map<string, Element>())
	const metaByNodeRef = useRef(new WeakMap<Element, NodeMeta>())
	const rangeRef = useRef({ start: -1, end: -1, top: -1, bottom: -1 })
	const handlersRef = useRef<(meta: NodeMeta, entry: ResizeObserverEntry) => void>(() => {})
	const hasSeparator = Boolean(props.renderSeparator)
	const hasSeparatorRef = useRef(hasSeparator)
	hasSeparatorRef.current = hasSeparator

	function rebuildLayout(nextEntries: VirtualListEntry<T>[], width: number) {
		entriesRef.current = nextEntries
		const indexByKey = new Map<string, number>()
		const activeMeasurements = new Set<string>()

		for (const entry of nextEntries) {
			indexByKey.set(entry.rowKey, entry.index)
			const cacheKey = virtualListMeasurementKey(
				entry.rowKey,
				hasSeparatorRef.current && entry.index < nextEntries.length - 1,
			)

			activeMeasurements.add(cacheKey)
		}

		for (const cacheKey of sizeCacheRef.current.keys()) {
			if (!activeMeasurements.has(cacheKey)) sizeCacheRef.current.delete(cacheKey)
		}

		indexByRowKeyRef.current = indexByKey
		sizeIndexRef.current.reset(
			estimateVirtualListSizes(nextEntries, hasSeparatorRef.current, width, sizeCacheRef.current),
		)
	}

	if (entries !== entriesRef.current) {
		const anchor = captureAnchor()
		rebuildLayout(entries, viewportWidthRef.current)
		restoreAnchor(anchor)
	}

	function currentRange() {
		const listOffset = Math.max(0, scrollOffsetRef.current - headerHeightRef.current)
		return virtualListRange(
			sizeIndexRef.current,
			listOffset,
			viewportHeightRef.current,
			viewportHeightRef.current,
		)
	}

	function refreshWindow() {
		if (disposedRef.current) return
		const next = currentRange()
		const previous = rangeRef.current
		if (
			next.start !== previous.start ||
			next.end !== previous.end ||
			!sameSize(next.top, previous.top) ||
			!sameSize(next.bottom, previous.bottom)
		) {
			rangeRef.current = next
			setWindowVersion((version) => version + 1)
		}
	}

	function captureAnchor() {
		const listOffset = scrollOffsetRef.current - headerHeightRef.current
		if (listOffset < 0 || entriesRef.current.length === 0) return null

		const index = sizeIndexRef.current.indexAt(listOffset)
		const entry = entriesRef.current[index]
		if (!entry) return null
		return {
			rowKey: entry.rowKey,
			index,
			within: listOffset - sizeIndexRef.current.prefix(index),
		}
	}

	function restoreAnchor(anchor: ReturnType<typeof captureAnchor>) {
		if (!anchor) return
		const index = indexByRowKeyRef.current.get(anchor.rowKey)
		if (index === undefined) return
		const nextOffset = Math.max(
			0,
			headerHeightRef.current + sizeIndexRef.current.prefix(index) + anchor.within,
		)

		if (sameSize(nextOffset, scrollOffsetRef.current)) return

		scrollOffsetRef.current = nextOffset
		if (scrollRef.current) scrollRef.current.scrollTop = nextOffset
	}

	function scheduleEstimateRebuild() {
		if (estimateScheduledRef.current) return
		estimateScheduledRef.current = true
		Promise.resolve().then(() => {
			estimateScheduledRef.current = false
			if (disposedRef.current) return
			const anchor = captureAnchor()
			rebuildLayout(entriesRef.current, viewportWidthRef.current)
			restoreAnchor(anchor)
			refreshWindow()
		})
	}

	function recordRowSize(rowKey: string, width: number, height: number) {
		if (disposedRef.current || !Number.isFinite(height) || height < 0) return
		const index = indexByRowKeyRef.current.get(rowKey)
		if (index === undefined) return
		const entry = entriesRef.current[index]
		if (!entry) return

		const hasRowSeparator = hasSeparatorRef.current && index < entriesRef.current.length - 1
		const cacheKey = virtualListMeasurementKey(rowKey, hasRowSeparator)
		sizeCacheRef.current.set(cacheKey, { width, height })
		const anchor = captureAnchor()
		const delta = sizeIndexRef.current.set(index, height)
		if (Math.abs(delta) >= 0.5) {
			if (anchor && index < anchor.index) restoreAnchor(anchor)
			refreshWindow()
		}

		scheduleEstimateRebuild()
	}

	function bindObservedNode(slot: string, node: Element | null, meta: NodeMeta) {
		const previous = nodesBySlotRef.current.get(slot)
		if (previous && previous !== node) {
			observerRef.current?.unobserve(previous)
			metaByNodeRef.current.delete(previous)
			nodesBySlotRef.current.delete(slot)
		}

		if (!node) {
			if (previous) {
				observerRef.current?.unobserve(previous)
				metaByNodeRef.current.delete(previous)
				nodesBySlotRef.current.delete(slot)
			}

			return
		}

		nodesBySlotRef.current.set(slot, node)
		metaByNodeRef.current.set(node, meta)
		observerRef.current?.observe(node)
	}

	function cellCallback(id: number) {
		let callback = cellCallbacksRef.current.get(id)
		if (!callback) {
			callback = (node: Element | null) => {
				const cell = cellsRef.current.get(id)
				bindObservedNode('cell:' + id, node, {
					kind: 'row', rowKey: cell?.entry?.rowKey ?? '', cellId: id, generation: cell?.generation ?? 0,
				})

				if (!node) cellCallbacksRef.current.delete(id)
			}

			cellCallbacksRef.current.set(id, callback)
		}

		return callback
	}

	handlersRef.current = (meta, entry) => {
		if (meta.kind === 'viewport') {
			const width = scrollRef.current?.clientWidth ?? entry.contentRect.width
			const height = scrollRef.current?.clientHeight ?? entry.contentRect.height
			const widthChanged = !sameSize(width, viewportWidthRef.current)
			viewportHeightRef.current = height
			if (widthChanged) {
				const anchor = captureAnchor()
				viewportWidthRef.current = width
				rebuildLayout(entriesRef.current, width)
				restoreAnchor(anchor)
			}

			refreshWindow()
			return
		}

		const height = entry.contentRect.height
		if (meta.kind === 'row') {
			if (!cellsRef.current.isCurrent(meta.cellId, meta.rowKey, meta.generation)) return
			// A reused node may have an older ResizeObserver record. Read its
			// current box after assignment rather than caching the former row.
			const bounds = entry.target.getBoundingClientRect()
			recordRowSize(meta.rowKey, bounds.width, bounds.height)
			return
		}

		if (meta.kind === 'header' && !sameSize(height, headerHeightRef.current)) {
			const anchor = captureAnchor()
			headerHeightRef.current = height
			restoreAnchor(anchor)
			refreshWindow()
		} else if (meta.kind === 'footer' && !sameSize(height, footerHeightRef.current)) {
			footerHeightRef.current = height
			refreshWindow()
		}
	}

	useEffect(() => {
		disposedRef.current = false
		return () => {
			disposedRef.current = true
			cellsRef.current.clear()
			cellCallbacksRef.current.clear()
			measuredAssignmentsRef.current.clear()
			nodesBySlotRef.current.clear()
			metaByNodeRef.current = new WeakMap()
		}
	}, [])

	useEffect(() => {
		if (typeof ResizeObserver === 'undefined') return

		const observer = new ResizeObserver((records) => {
			for (const record of records) {
				const meta = metaByNodeRef.current.get(record.target)
				if (meta) handlersRef.current(meta, record)
			}
		})

		observerRef.current = observer
		for (const node of nodesBySlotRef.current.values()) observer.observe(node)

		return () => {
			observer.disconnect()
			observerRef.current = null
		}
	}, [])

	function onScroll(event: any) {
		const root = event.currentTarget as HTMLElement
		scrollOffsetRef.current = root.scrollTop
		refreshWindow()
	}

	const range = currentRange()
	rangeRef.current = range
	void windowVersion
	const cells = cellsRef.current.update(entries.slice(range.start, range.end)).map((cell) => ({
		...cell, top: cell.entry ? sizeIndexRef.current.prefix(cell.entry.index) : 0,
	}))

	const contentHeight = sizeIndexRef.current.total
	for (const cell of cells) {
		const node = nodesBySlotRef.current.get('cell:' + cell.id)
		if (node) metaByNodeRef.current.set(node, {
			kind: 'row', rowKey: cell.entry?.rowKey ?? '', cellId: cell.id, generation: cell.generation,
		})
	}

	useEffect(() => {
		for (const cell of cells) {
			if (!cell.entry || measuredAssignmentsRef.current.get(cell.id) === cell.generation) continue
			const node = nodesBySlotRef.current.get('cell:' + cell.id)
			if (!node || !cellsRef.current.isCurrent(cell.id, cell.entry.rowKey, cell.generation)) continue
			const bounds = node.getBoundingClientRect()
			measuredAssignmentsRef.current.set(cell.id, cell.generation)
			recordRowSize(cell.entry.rowKey, bounds.width, bounds.height)
		}

		for (const id of measuredAssignmentsRef.current.keys()) {
			if (!nodesBySlotRef.current.has('cell:' + id)) measuredAssignmentsRef.current.delete(id)
		}
	}, [cells])

	const style = {
		...props.style,
		minHeight: props.style?.minHeight ?? 0,
		overflowY: 'auto',
		overflowX: 'hidden',
		overflowAnchor: 'none',
	}

	<div
		ref={(node: any) => {
			scrollRef.current = node
			if (node) applyEscapeProps(node, props)
			bindObservedNode('viewport', node, { kind: 'viewport' })
		}}
		id={props.id}
		className={['vx-virtual-list', props.className]}
		{...layoutChildProps(props, style)}
		role={props.accessibilityRole}
		aria-label={props.accessibilityLabel}
		aria-hidden={props.accessible === false ? true : undefined}
		aria-description={props.accessibilityHint}
		aria-valuetext={props.accessibilityValue}
		aria-disabled={props.accessibilityState?.disabled}
		aria-selected={props.accessibilityState?.selected}
		aria-checked={props.accessibilityState?.checked}
		aria-live={props.accessibilityLiveRegion === 'none' ? 'off' : props.accessibilityLiveRegion}
		onScroll={onScroll}
	>
		{props.renderHeader ? (
			<div
				className="vx-virtual-list-header"
				ref={(node: any) => bindObservedNode('header', node, { kind: 'header' })}
			>
				{props.renderHeader()}
			</div>
		) : null}
		{entries.length === 0 ? (
			props.renderEmpty ? <div className="vx-virtual-list-empty">{props.renderEmpty()}</div> : null
		) : (
			<div className="vx-virtual-list-body" style={{ position: 'relative', height: contentHeight }}>
				@for (const cell of cells; key cell.id) {
					<div
						className={cell.entry ? 'vx-virtual-list-cell vx-virtual-list-row' : 'vx-virtual-list-cell'}
						data-vx-row={cell.entry ? 'true' : undefined}
						hidden={!cell.entry}
						style={{ position: 'absolute', top: cell.top, left: 0, width: '100%' }}
						ref={cellCallback(cell.id)}
					>
						@for (const entry of cell.rows; key entry.rowKey) {
							<>
								<div className="vx-virtual-list-item">{props.renderItem(entry.item, entry.index)}</div>
								{hasSeparator && entry.index < entries.length - 1 ? (
									<div className="vx-virtual-list-separator">{props.renderSeparator?.()}</div>
								) : null}
							</>
						}
					</div>
				}
			</div>
		)}
		{props.renderFooter ? (
			<div
				className="vx-virtual-list-footer"
				ref={(node: any) => bindObservedNode('footer', node, { kind: 'footer' })}
			>
				{props.renderFooter()}
			</div>
		) : null}
	</div>
}
