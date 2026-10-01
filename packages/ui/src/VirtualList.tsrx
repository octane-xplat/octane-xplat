/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useMemo, useRef, useState } from 'octane'
import type { VirtualListProps } from './props'
import {
	createVirtualListEntries,
	estimateVirtualListSizes,
	virtualListMeasurementKey,
	virtualListRange,
	VirtualListSizeIndex,
	VIRTUAL_LIST_ESTIMATED_ROW_SIZE,
	VIRTUAL_LIST_MIN_TYPE_SAMPLES,
	type VirtualListEntry,
	type VirtualListSizeRecord,
} from './virtual-list-layout'

import { VirtualListCellPool, type VirtualListCell } from './virtual-list-cell-pool'

import { cx } from './cx'
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from './escape-props'
import { layoutChildProps } from './layout-child'

function sameSize(a: number, b: number) {
	return Math.abs(a - b) < 0.5
}

function scheduleListFrame(callback: () => void): () => void {
	const requestFrame = (globalThis as any).requestAnimationFrame
	const cancelFrame = (globalThis as any).cancelAnimationFrame
	if (typeof requestFrame !== 'function' || typeof cancelFrame !== 'function') {
		const timer = setTimeout(callback, 16)
		return () => clearTimeout(timer)
	}

	let cancelled = false
	let current: number | null = null
	let next: number | null = null
	// NativeScript dispatches an initial rAF through a macrotask. A nested
	// request joins Choreographer/CADisplayLink rather than a free-running timer.
	current = requestFrame(() => {
		current = null
		if (cancelled) return
		next = requestFrame(() => {
			next = null
			if (!cancelled) callback()
		})
	})

	return () => {
		cancelled = true
		if (current != null) cancelFrame(current)
		if (next != null) cancelFrame(next)
	}
}

interface VirtualListAnchor {
	rowKey: string
	index: number
	within: number
}

/** Shared vertical virtualization with pooled outer hosts and keyed logical
 *  rows. Off-window item subtrees unmount; measured heights position cells and
 *  preserve the visible keyed anchor after layout. */
export function VirtualList<T = any>(props: VirtualListProps<T>) @{
	const entries = useMemo(
		() => createVirtualListEntries(props.items, props.keyExtractor, props.getItemType),
		[props.items, props.keyExtractor, props.getItemType],
	)

	const [windowVersion, setWindowVersion] = useState(0)
	const sizeIndexRef = useRef(new VirtualListSizeIndex())
	const cellsRef = useRef(new VirtualListCellPool<T>())
	const cellNodesRef = useRef(new Map<number, any>())
	const cellCallbacksRef = useRef(new Map<number, (view: any) => void>())
	const measuredAssignmentsRef = useRef(new Map<number, number>())
	const sizeCacheRef = useRef(new Map<string, VirtualListSizeRecord>())
	const typeSamplesRef = useRef(new Map<string, { sum: number; count: number }>())
	const appliedEstimatesRef = useRef(new Map<string, number>())
	const estimateDirtyTypesRef = useRef(new Set<string>())
	const entriesRef = useRef<VirtualListEntry<T>[]>([])
	const indexByRowKeyRef = useRef(new Map<string, number>())
	const scrollRef = useRef<any>(null)
	const scrollOffsetRef = useRef(0)
	const viewportHeightRef = useRef(0)
	const viewportWidthRef = useRef(0)
	const contentWidthRef = useRef(0)
	const headerHeightRef = useRef(0)
	const estimateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const frameCancelRef = useRef<(() => void) | null>(null)
	const disposedRef = useRef(false)
	const pendingOffsetDeltaRef = useRef(0)
	const measurementsRef = useRef(
		new Map<string, { entry: VirtualListEntry<T>; width: number; height: number; cellId: number; generation: number; view?: any }>(),
	)

	const rangeRef = useRef({ start: -1, end: -1, top: -1, bottom: -1 })
	const pendingAnchorRef = useRef<VirtualListAnchor | null>(null)
	const pendingAnchorRowsRef = useRef(new Set<string>())
	const anchorRestoreScheduledRef = useRef(false)
	const anchorRestoreTimerRef = useRef<any>(null)
	const hasSeparator = Boolean(props.renderSeparator)
	const hasSeparatorRef = useRef(hasSeparator)
	const separatorChanged = hasSeparatorRef.current !== hasSeparator
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

		const samples = new Map<string, { sum: number; count: number }>()
		for (const entry of nextEntries) {
			const cached = sizeCacheRef.current.get(virtualListMeasurementKey(
				entry.rowKey, hasSeparatorRef.current && entry.index < nextEntries.length - 1,
			))

			if (!cached) continue
			const sample = samples.get(entry.typeKey) ?? { sum: 0, count: 0 }
			sample.sum += cached.height
			sample.count++
			samples.set(entry.typeKey, sample)
		}

		typeSamplesRef.current = samples
		estimateDirtyTypesRef.current.clear()
		appliedEstimatesRef.current = new Map([...samples].map(([type, sample]) => [
			type, sample.count >= VIRTUAL_LIST_MIN_TYPE_SAMPLES
				? sample.sum / sample.count : VIRTUAL_LIST_ESTIMATED_ROW_SIZE,
		]))

		indexByRowKeyRef.current = indexByKey
		sizeIndexRef.current.reset(
			estimateVirtualListSizes(
				nextEntries, hasSeparatorRef.current, contentWidthRef.current || width, sizeCacheRef.current,
			),
		)
	}

	if (entries !== entriesRef.current || separatorChanged) {
		const anchor = captureCurrentAnchor()
		const previousByKey = new Map(entriesRef.current.map((entry) => [entry.rowKey, entry]))
		const changedRows = entries.filter((entry) => previousByKey.get(entry.rowKey)?.item !== entry.item)
		const previousRange = rangeRef.current
		rebuildLayout(entries, viewportWidthRef.current)
		const anchorIndex = anchor ? indexByRowKeyRef.current.get(anchor.rowKey) : undefined
		const pendingRows = new Set(
			changedRows
				.filter(
					(entry) =>
						anchorIndex !== undefined &&
						entry.index < anchorIndex &&
						entry.index >= previousRange.start &&
						entry.index < previousRange.end,
				)
				.map((entry) => entry.rowKey),
		)

		pendingAnchorRef.current = pendingRows.size > 0 ? anchor : null
		pendingAnchorRowsRef.current = pendingRows

		if (anchor) restoreAnchor(anchor)
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

	function commitWindow() {
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

	function refreshWindow() {
		if (disposedRef.current || frameCancelRef.current != null) return
		frameCancelRef.current = scheduleListFrame(() => {
			frameCancelRef.current = null
			if (disposedRef.current) return
			const measurements = [...measurementsRef.current.values()]
			measurementsRef.current.clear()
			for (const measurement of measurements) {
				if (!cellsRef.current.isCurrent(measurement.cellId, measurement.entry.rowKey, measurement.generation)) continue
				const index = indexByRowKeyRef.current.get(measurement.entry.rowKey)
				if (index === undefined || entriesRef.current[index]?.item !== measurement.entry.item ||
					entriesRef.current[index]?.index !== measurement.entry.index) continue

				if (measurement.view?.isLoaded === false) continue
				if (measurement.view?.isLayoutValid === false) {
					measurementsRef.current.set(measurement.entry.rowKey, measurement)
					refreshWindow()
					continue
				}

				const size = measurement.view?.getActualSize?.() ?? measurement
				if (size.width > 0 && size.height >= 0) recordRowSize(measurement.entry.rowKey, size.width, size.height)
			}

			commitWindow()
		})
	}

	function captureAnchor(): VirtualListAnchor | null {
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

	function captureCurrentAnchor() {
		const nativeOffset = Number(scrollRef.current?.verticalOffset)
		if (Number.isFinite(nativeOffset)) scrollOffsetRef.current = nativeOffset + pendingOffsetDeltaRef.current
		return captureAnchor()
	}

	function restoreAnchor(anchor: VirtualListAnchor | null) {
		if (!anchor || disposedRef.current) return
		const index = indexByRowKeyRef.current.get(anchor.rowKey)
		const view = scrollRef.current
		if (index === undefined || !view) return
		const nextOffset = Math.max(0, headerHeightRef.current + sizeIndexRef.current.prefix(index) + anchor.within)
		const delta = nextOffset - scrollOffsetRef.current
		if (sameSize(delta, 0)) return
		// Apply geometry corrections to the live offset, preserving intervening input.
		pendingOffsetDeltaRef.current += delta
		scrollOffsetRef.current = nextOffset
		if (anchorRestoreScheduledRef.current) return
		anchorRestoreScheduledRef.current = true
		const timer = setTimeout(() => {
			if (anchorRestoreTimerRef.current !== timer) return
			anchorRestoreTimerRef.current = null
			anchorRestoreScheduledRef.current = false
			if (disposedRef.current || scrollRef.current !== view) return
			const correction = pendingOffsetDeltaRef.current
			pendingOffsetDeltaRef.current = 0
			const nativeOffset = Number(view.verticalOffset)
			const target = Math.max(0, nativeOffset + correction)
			scrollOffsetRef.current = target
			if (sameSize(target, nativeOffset)) return
			const nativeView = view.nativeViewProtected
			const makePoint = (globalThis as any).CGPointMake
			if (typeof nativeView?.setContentOffsetAnimated === 'function' && typeof makePoint === 'function') {
				const current = nativeView.contentOffset
				nativeView.setContentOffsetAnimated(makePoint(current.x, target), false)
			} else if (typeof view.scrollToVerticalOffset === 'function') {
				view.scrollToVerticalOffset(target, false)
			}
		}, 0)

		anchorRestoreTimerRef.current = timer
	}

	function cancelAnchorRestore() {
		if (anchorRestoreTimerRef.current != null) clearTimeout(anchorRestoreTimerRef.current)
		anchorRestoreTimerRef.current = null
		anchorRestoreScheduledRef.current = false
		pendingOffsetDeltaRef.current = 0
	}

	function scheduleEstimateRebuild() {
		if (estimateTimerRef.current != null) clearTimeout(estimateTimerRef.current)
		estimateTimerRef.current = setTimeout(() => {
			estimateTimerRef.current = null
			if (disposedRef.current || estimateDirtyTypesRef.current.size === 0) return
			const anchor = captureCurrentAnchor()
			rebuildLayout(entriesRef.current, viewportWidthRef.current)
			restoreAnchor(anchor)
			refreshWindow()
		}, 120)
	}

	function recordRowSize(rowKey: string, width: number, height: number) {
		if (!Number.isFinite(height) || height < 0) return
		const index = indexByRowKeyRef.current.get(rowKey)
		if (index === undefined) return
		const entry = entriesRef.current[index]
		if (!entry) return

		const hasRowSeparator = hasSeparatorRef.current && index < entriesRef.current.length - 1
		const cacheKey = virtualListMeasurementKey(rowKey, hasRowSeparator)
		const pendingAnchor = pendingAnchorRowsRef.current.has(rowKey) ? pendingAnchorRef.current : null
		const previous = sizeCacheRef.current.get(cacheKey)
		if (previous && sameSize(previous.width, width) && sameSize(previous.height, height) && sameSize(sizeIndexRef.current.get(index), height)) {
			pendingAnchorRowsRef.current.delete(rowKey)
			if (pendingAnchorRowsRef.current.size === 0) pendingAnchorRef.current = null
			return
		}

		const anchor = pendingAnchor ?? captureCurrentAnchor()
		sizeCacheRef.current.set(cacheKey, { width, height })
		const sample = typeSamplesRef.current.get(entry.typeKey) ?? { sum: 0, count: 0 }
		sample.sum += height - (previous?.height ?? 0)
		if (!previous) sample.count++
		typeSamplesRef.current.set(entry.typeKey, sample)
		const applied = appliedEstimatesRef.current.get(entry.typeKey) ?? VIRTUAL_LIST_ESTIMATED_ROW_SIZE
		const estimateChanged = sample.count >= VIRTUAL_LIST_MIN_TYPE_SAMPLES &&
			Math.abs(sample.sum / sample.count - applied) > Math.max(1, applied * 0.02)

		const delta = sizeIndexRef.current.set(index, height)
		if (Math.abs(delta) >= 0.5) {
			const anchorIndex = anchor ? indexByRowKeyRef.current.get(anchor.rowKey) : undefined
			if (anchor && anchorIndex !== undefined && index < anchorIndex) restoreAnchor(anchor)
		}

		// Exact measurements always apply. Tiny changes to a type average do not
		// justify rebuilding every unvisited estimate and relaying out the list.
		if (estimateChanged) {
			estimateDirtyTypesRef.current.add(entry.typeKey)
			scheduleEstimateRebuild()
		} else {
			estimateDirtyTypesRef.current.delete(entry.typeKey)
			if (estimateDirtyTypesRef.current.size === 0 && estimateTimerRef.current != null) {
				clearTimeout(estimateTimerRef.current)
				estimateTimerRef.current = null
			}
		}

		if (pendingAnchor) {
			pendingAnchorRowsRef.current.delete(rowKey)
			if (pendingAnchorRowsRef.current.size === 0) pendingAnchorRef.current = null
		}
	}

	function syncViewport(view = scrollRef.current) {
		if (!view) return
		const size = view.getActualSize?.()
		if (!size) return

		const initialViewport = viewportHeightRef.current <= 0
		const widthChanged = !sameSize(size.width, viewportWidthRef.current)
		viewportHeightRef.current = size.height
		if (widthChanged) {
			const anchor = initialViewport ? null : captureCurrentAnchor()
			viewportWidthRef.current = size.width
			rebuildLayout(entriesRef.current, size.width)
			restoreAnchor(anchor)
		}

		// Populate the first viewport before its initial native layout finishes.
		if (initialViewport) commitWindow()
		else refreshWindow()
	}

	function onScroll(event: any) {
		const view = event.object ?? scrollRef.current
		const nextOffset = Number(view?.verticalOffset ?? 0)
		if (Math.abs(nextOffset + pendingOffsetDeltaRef.current - scrollOffsetRef.current) > viewportHeightRef.current) {
			cancelAnchorRestore()
		}

		if (!sameSize(nextOffset + pendingOffsetDeltaRef.current, scrollOffsetRef.current)) {
			pendingAnchorRef.current = null
			pendingAnchorRowsRef.current.clear()
		}

		scrollOffsetRef.current = nextOffset + pendingOffsetDeltaRef.current
		if (estimateTimerRef.current != null) scheduleEstimateRebuild()
		refreshWindow()
	}

	function onContentLayout(event: any) {
		const width = Number(event.object?.getActualSize?.().width ?? 0)
		if (width <= 0 || sameSize(width, contentWidthRef.current)) return
		const anchor = scrollOffsetRef.current > 0 ? captureCurrentAnchor() : null
		contentWidthRef.current = width
		rebuildLayout(entriesRef.current, viewportWidthRef.current)
		restoreAnchor(anchor)
		refreshWindow()
	}

	function onHeaderLayout(event: any) {
		const height = Number(event.object?.getActualSize?.().height ?? 0)
		if (sameSize(height, headerHeightRef.current)) return
		const anchor = scrollOffsetRef.current > 0 ? captureCurrentAnchor() : null
		headerHeightRef.current = height
		restoreAnchor(anchor)
		refreshWindow()
	}

	function cellCallback(id: number) {
		let callback = cellCallbacksRef.current.get(id)
		if (!callback) {
			callback = (view: any) => {
				if (view) {
					// Preserve native widgets when the renderer moves a keyed host.
					view.reusable = true
					cellNodesRef.current.set(id, view)
				} else {
					cellNodesRef.current.get(id)?.destroyNode?.(true)
					cellNodesRef.current.delete(id)
					cellCallbacksRef.current.delete(id)
				}
			}

			cellCallbacksRef.current.set(id, callback)
		}

		return callback
	}

	function onRowLayout(cell: VirtualListCell<T>, event: any) {
		const entry = cell.entry
		const size = event.object?.getActualSize?.()
		if (!entry || !size || disposedRef.current) return
		measurementsRef.current.set(entry.rowKey, { entry, width: size.width, height: size.height, cellId: cell.id, generation: cell.generation })
		refreshWindow()
	}

	useEffect(() => {
		disposedRef.current = false
		return () => {
			disposedRef.current = true
			frameCancelRef.current?.()
			if (estimateTimerRef.current != null) clearTimeout(estimateTimerRef.current)
			frameCancelRef.current = null
			estimateTimerRef.current = null
			measurementsRef.current.clear()
			cellsRef.current.clear()
			cellNodesRef.current.clear()
			cellCallbacksRef.current.clear()
			measuredAssignmentsRef.current.clear()
			cancelAnchorRestore()
		}
	}, [])

	const range = currentRange()
	rangeRef.current = range
	void windowVersion
	const cells = cellsRef.current.update(entries.slice(range.start, range.end)).map((cell) => ({
		...cell, top: cell.entry ? sizeIndexRef.current.prefix(cell.entry.index) : 0,
	}))

	const contentHeight = sizeIndexRef.current.total
	useEffect(() => {
		for (const cell of cells) {
			if (!cell.entry || measuredAssignmentsRef.current.get(cell.id) === cell.generation) continue
			const view = cellNodesRef.current.get(cell.id)
			if (!view) continue
			measuredAssignmentsRef.current.set(cell.id, cell.generation)
			measurementsRef.current.set(cell.entry.rowKey, {
				entry: cell.entry, width: 0, height: 0, view, cellId: cell.id, generation: cell.generation,
			})

			refreshWindow()
		}

		for (const id of measuredAssignmentsRef.current.keys()) {
			if (!cellNodesRef.current.has(id)) measuredAssignmentsRef.current.delete(id)
		}
	}, [cells])

	const style = { ...props.style, minHeight: props.style?.minHeight ?? 0 }

	<scrollview
		ref={(view: any) => {
			scrollRef.current = view
			if (view) applyEscapeProps(view, props)
		}}
		id={props.id}
		{...layoutChildProps(props)}
		className={cx('vx-virtual-list', props.className)}
		style={style}
		orientation="vertical"
		accessible={props.accessible}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityRole={nativeAccessibilityRole(props.accessibilityRole) as any}
		accessibilityHint={props.accessibilityHint}
		accessibilityValue={props.accessibilityValue}
		accessibilityState={nativeAccessibilityState(props.accessibilityState) as any}
		accessibilityLiveRegion={props.accessibilityLiveRegion as any}
		onLoaded={(event: any) => syncViewport(event.object)}
		onLayoutChanged={(event: any) => syncViewport(event.object)}
		onScroll={onScroll}
	>
		<flexboxlayout flexDirection="column" className={cx('vx-virtual-list-content')} onLayoutChanged={onContentLayout}>
			{props.renderHeader ? (
				<flexboxlayout
					flexDirection="column"
					className="vx-virtual-list-header"
					flexShrink={0}
					onLayoutChanged={onHeaderLayout}
				>
					{props.renderHeader()}
				</flexboxlayout>
			) : null}
			{entries.length === 0 ? (
				props.renderEmpty ? (
					<flexboxlayout flexDirection="column" className="vx-virtual-list-empty">
						{props.renderEmpty()}
					</flexboxlayout>
				) : null
			) : (
				<absolutelayout className="vx-virtual-list-body" style={{ height: contentHeight, flexShrink: 0 }}>
					@for (const cell of cells; key cell.id) {
						<flexboxlayout
							ref={cellCallback(cell.id)}
							flexDirection="column"
							className={cell.entry ? 'vx-virtual-list-cell vx-virtual-list-row' : 'vx-virtual-list-cell'}
							visibility={cell.entry ? 'visible' : 'collapse'}
							left={0}
							top={cell.top}
							width={contentWidthRef.current || viewportWidthRef.current || '100%'}
							onLayoutChanged={(event: any) => onRowLayout(cell, event)}
						>
							@for (const entry of cell.rows; key entry.rowKey) {
								<>
									<flexboxlayout flexDirection="column" className="vx-virtual-list-item">
										{props.renderItem(entry.item, entry.index)}
									</flexboxlayout>
									{hasSeparator && entry.index < entries.length - 1 ? (
										<flexboxlayout flexDirection="column" className="vx-virtual-list-separator">
											{props.renderSeparator?.()}
										</flexboxlayout>
									) : null}
								</>
							}
						</flexboxlayout>
					}
				</absolutelayout>
			)}
			{props.renderFooter ? (
				<flexboxlayout flexDirection="column" className="vx-virtual-list-footer" flexShrink={0}>
					{props.renderFooter()}
				</flexboxlayout>
			) : null}
		</flexboxlayout>
	</scrollview>
}
