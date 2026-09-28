/** @jsxImportSource @nativescript-community/octane */
import { useMemo, useRef, useState } from 'octane'
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
import { cx } from './cx'
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from './escape-props'
import { layoutChildProps } from './layout-child'

function sameSize(a: number, b: number) {
	return Math.abs(a - b) < 0.5
}

interface VirtualListAnchor {
	rowKey: string
	index: number
	within: number
}

/** Shared vertical virtualization over NativeScript ScrollView. Off-window
 *  rows unmount; measured row-height changes above the visible anchor adjust
 *  the native scroll offset after layout. */
export function VirtualList<T = any>(props: VirtualListProps<T>) @{
	const entries = useMemo(
		() => createVirtualListEntries(props.items, props.keyExtractor, props.getItemType),
		[props.items, props.keyExtractor, props.getItemType],
	)
	const [windowVersion, setWindowVersion] = useState(0)
	const sizeIndexRef = useRef(new VirtualListSizeIndex())
	const sizeCacheRef = useRef(new Map<string, VirtualListSizeRecord>())
	const entriesRef = useRef<VirtualListEntry<T>[]>([])
	const indexByRowKeyRef = useRef(new Map<string, number>())
	const scrollRef = useRef<any>(null)
	const scrollOffsetRef = useRef(0)
	const viewportHeightRef = useRef(0)
	const viewportWidthRef = useRef(0)
	const headerHeightRef = useRef(0)
	const estimateScheduledRef = useRef(false)
	const estimateAnchorRef = useRef<VirtualListAnchor | null>(null)
	const rangeRef = useRef({ start: -1, end: -1, top: -1, bottom: -1 })
	const pendingAnchorRef = useRef<VirtualListAnchor | null>(null)
	const pendingAnchorRowsRef = useRef(new Set<string>())
	const queuedAnchorRestoreRef = useRef<VirtualListAnchor | null>(null)
	const anchorRestoreScheduledRef = useRef(false)
	const anchorRestoreTimerRef = useRef<any>(null)
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

	function refreshWindow() {
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
		if (Number.isFinite(nativeOffset)) scrollOffsetRef.current = nativeOffset
		return captureAnchor()
	}

	function restoreAnchor(anchor: VirtualListAnchor | null) {
		if (!anchor) return
		queuedAnchorRestoreRef.current = anchor
		if (anchorRestoreScheduledRef.current) return
		const view = scrollRef.current
		if (!view) return

		anchorRestoreScheduledRef.current = true
		const timer = setTimeout(() => {
			if (anchorRestoreTimerRef.current !== timer) return
			anchorRestoreTimerRef.current = null
			anchorRestoreScheduledRef.current = false
			if (scrollRef.current !== view) return

			const queuedAnchor = queuedAnchorRestoreRef.current
			queuedAnchorRestoreRef.current = null
			if (!queuedAnchor) return
			const index = indexByRowKeyRef.current.get(queuedAnchor.rowKey)
			if (index === undefined) return

			const nextOffset = Math.max(
				0,
				headerHeightRef.current + sizeIndexRef.current.prefix(index) + queuedAnchor.within,
			)
			const nativeOffset = Number(view.verticalOffset)
			if (sameSize(nextOffset, nativeOffset)) {
				scrollOffsetRef.current = nativeOffset
				return
			}

			scrollOffsetRef.current = nextOffset
			const nativeView = view.nativeViewProtected
			const makePoint = (globalThis as any).CGPointMake
			if (typeof nativeView?.setContentOffsetAnimated === 'function' && typeof makePoint === 'function') {
				const current = nativeView.contentOffset
				nativeView.setContentOffsetAnimated(makePoint(current.x, nextOffset), false)
			} else if (typeof view.scrollToVerticalOffset === 'function') {
				view.scrollToVerticalOffset(nextOffset, false)
			}
		}, 0)
		anchorRestoreTimerRef.current = timer
	}

	function cancelAnchorRestore() {
		if (anchorRestoreTimerRef.current != null) clearTimeout(anchorRestoreTimerRef.current)
		anchorRestoreTimerRef.current = null
		anchorRestoreScheduledRef.current = false
		queuedAnchorRestoreRef.current = null
	}

	function scheduleEstimateRebuild(anchor: VirtualListAnchor | null) {
		if (estimateScheduledRef.current) return
		estimateScheduledRef.current = true
		estimateAnchorRef.current = anchor
		Promise.resolve().then(() => {
			estimateScheduledRef.current = false
			const scheduledAnchor = estimateAnchorRef.current
			estimateAnchorRef.current = null
			rebuildLayout(entriesRef.current, viewportWidthRef.current)
			restoreAnchor(scheduledAnchor)
			refreshWindow()
		})
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
		const anchor = pendingAnchor ?? queuedAnchorRestoreRef.current ?? captureCurrentAnchor()
		sizeCacheRef.current.set(cacheKey, { width, height })
		const delta = sizeIndexRef.current.set(index, height)
		if (Math.abs(delta) >= 0.5) {
			const anchorIndex = anchor ? indexByRowKeyRef.current.get(anchor.rowKey) : undefined
			if (anchor && anchorIndex !== undefined && index < anchorIndex) restoreAnchor(anchor)
			refreshWindow()
			scheduleEstimateRebuild(anchor)
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

		const widthChanged = !sameSize(size.width, viewportWidthRef.current)
		viewportHeightRef.current = size.height
		if (widthChanged) {
			const anchor = captureAnchor()
			viewportWidthRef.current = size.width
			rebuildLayout(entriesRef.current, size.width)
			restoreAnchor(anchor)
		}
		refreshWindow()
	}

	function onScroll(event: any) {
		const view = event.object ?? scrollRef.current
		const nextOffset = Number(view?.verticalOffset ?? 0)
		const queuedAnchor = queuedAnchorRestoreRef.current
		if (queuedAnchor && Math.abs(nextOffset - scrollOffsetRef.current) > viewportHeightRef.current) {
			const anchorIndex = indexByRowKeyRef.current.get(queuedAnchor.rowKey)
			const nextIndex = sizeIndexRef.current.indexAt(
				Math.max(0, nextOffset - headerHeightRef.current),
			)
			if (anchorIndex !== undefined && Math.abs(nextIndex - anchorIndex) > 1) cancelAnchorRestore()
		}
		scrollOffsetRef.current = nextOffset
		refreshWindow()
	}

	function onHeaderLayout(event: any) {
		const height = Number(event.object?.getActualSize?.().height ?? 0)
		if (sameSize(height, headerHeightRef.current)) return
		const anchor = captureAnchor()
		headerHeightRef.current = height
		restoreAnchor(anchor)
		refreshWindow()
	}

	function onRowLayout(entry: VirtualListEntry<T>, event: any) {
		const size = event.object?.getActualSize?.()
		if (size) recordRowSize(entry.rowKey, size.width, size.height)
	}

	const range = currentRange()
	rangeRef.current = range
	void windowVersion
	const visibleEntries = entries.slice(range.start, range.end)
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
		<flexboxlayout flexDirection="column" className={cx('vx-virtual-list-content')}>
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
				<>
					<flexboxlayout className="vx-virtual-list-spacer" style={{ height: range.top, flexShrink: 0 }} />
					@for (const entry of visibleEntries; key entry.rowKey) {
						<flexboxlayout
							flexDirection="column"
							className="vx-virtual-list-row"
							style={{ flexShrink: 0 }}
							onLayoutChanged={(event: any) => onRowLayout(entry, event)}
						>
							<flexboxlayout flexDirection="column" className="vx-virtual-list-item">
								{props.renderItem(entry.item, entry.index)}
							</flexboxlayout>
							{hasSeparator && entry.index < entries.length - 1 ? (
								<flexboxlayout flexDirection="column" className="vx-virtual-list-separator">
									{props.renderSeparator?.()}
								</flexboxlayout>
							) : null}
						</flexboxlayout>
					}
					<flexboxlayout className="vx-virtual-list-spacer" style={{ height: range.bottom, flexShrink: 0 }} />
				</>
			)}
			{props.renderFooter ? (
				<flexboxlayout flexDirection="column" className="vx-virtual-list-footer" flexShrink={0}>
					{props.renderFooter()}
				</flexboxlayout>
			) : null}
		</flexboxlayout>
	</scrollview>
}
