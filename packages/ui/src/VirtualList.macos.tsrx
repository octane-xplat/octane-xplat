/** @jsxImportSource @xplat/macos/renderer */
import { useMemo, useRef, useState } from 'octane'
import type { VirtualListProps } from './props'
import { cx } from './cx'
import {
	VirtualListSizeIndex,
	createVirtualListEntries,
	estimateVirtualListSizes,
	virtualListMeasurementKey,
	virtualListRange,
	type VirtualListEntry,
} from './virtual-list-layout'

type AppKitScrollEvent = { verticalOffset: number; viewportHeight: number; contentHeight: number }
type AppKitLayoutEvent = { object: any; width: number; height: number }

const sameSize = (a: number, b: number) => Math.abs(a - b) < 0.5

/** Scrolls an AppKit scrollview to a top-down (scrollTop-style) offset. The
 *  documentView (a vertical NSStackView) is normally flipped so clip origin y
 *  already counts from the top; the isFlipped check keeps non-flipped
 *  documents correct too. */
function scrollViewSetTop(scroll: any, top: number): void {
	const clip = scroll?.contentView
	const doc = scroll?.documentView
	if (!clip) {return}
	const docHeight = Number(doc?.frame?.size?.height ?? 0)
	const clipHeight = Number(clip.bounds?.size?.height ?? 0)
	const flip = typeof doc?.isFlipped === 'function' ? doc.isFlipped() : doc?.isFlipped
	const flipped = flip === true || Number(flip) === 1
	const y = Math.max(0, flipped ? top : docHeight - clipHeight - top)
	clip.scrollToPoint({ x: 0, y })
	scroll.reflectScrolledClipView(clip)
}

function scrollViewOffset(scroll: any): number {
	const clip = scroll?.contentView
	const doc = scroll?.documentView
	if (!clip) {return 0}
	const docHeight = Number(doc?.frame?.size?.height ?? 0)
	const clipHeight = Number(clip.bounds?.size?.height ?? 0)
	const originY = Number(clip.bounds?.origin?.y ?? 0)
	const flip = typeof doc?.isFlipped === 'function' ? doc.isFlipped() : doc?.isFlipped
	const flipped = flip === true || Number(flip) === 1
	return flipped ? originY : docHeight - clipHeight - originY
}

function scrollViewViewport(scroll: any): { width: number; height: number } {
	const bounds = scroll?.contentView?.bounds
	return {
		width: Number(bounds?.size?.width ?? 0),
		height: Number(bounds?.size?.height ?? 0),
	}
}

/** Windowed vertical virtualization for the AppKit host. Rows outside the
 *  visible window + one viewport of overscan stay unmounted; row heights are
 *  measured through `onLayoutChanged` frame notifications and prefix-summed
 *  by the shared VirtualListSizeIndex. */
export function VirtualList<T = any>(props: VirtualListProps<T>) @{
	const entries = useMemo(
		() => createVirtualListEntries(props.items, props.keyExtractor, props.getItemType),
		[props.items, props.keyExtractor, props.getItemType],
	)

	const [windowVersion, setWindowVersion] = useState(0)
	const sizeIndexRef = useRef(new VirtualListSizeIndex())
	const sizeCacheRef = useRef(new Map<string, { width: number; height: number }>())
	const entriesRef = useRef<VirtualListEntry<T>[]>([])
	const indexByRowKeyRef = useRef(new Map<string, number>())
	const scrollRef = useRef<any>(null)
	const scrollOffsetRef = useRef(0)
	const topSpacerRef = useRef<any>(null)
	const topSpacerHeightRef = useRef(0)
	const viewportHeightRef = useRef(0)
	const viewportWidthRef = useRef(0)
	const headerHeightRef = useRef(0)
	const rangeRef = useRef({ start: -1, end: -1, top: -1, bottom: -1 })
	const anchorRestoreTimerRef = useRef<any>(null)
	const anchorRestoreScheduledRef = useRef(false)
	const queuedAnchorRef = useRef<{ rowKey: string; within: number } | null>(null)
	const estimateAnchorRef = useRef<{ rowKey: string; within: number } | null>(null)
	const estimateTimerRef = useRef<any>(null)
	const pendingRowMeasureRef = useRef(new Map<string, number>())
	const programmaticWriteRef = useRef<{ offset: number; until: number } | null>(null)
	/** Convergent deep seek state (FlashList v2's scrollToIndex model): a large
	 *  external scroll jump is tracked and anchor-restore writes are suppressed
	 *  while measurements converge — the clip already sits at the seek target,
	 *  and re-anchoring would rewrite it to the biased estimated prefix. */
	const seekStateRef = useRef<{ target: number; until: number } | null>(null)
	const hasSeparator = Boolean(props.renderSeparator)
	const hasSeparatorRef = useRef(hasSeparator)
	hasSeparatorRef.current = hasSeparator

	function rebuildLayout(nextEntries: VirtualListEntry<T>[], width: number) {
		entriesRef.current = nextEntries
		const indexByKey = new Map<string, number>()
		const activeMeasurements = new Set<string>()

		for (const entry of nextEntries) {
			indexByKey.set(entry.rowKey, entry.index)
			activeMeasurements.add(
				virtualListMeasurementKey(
					entry.rowKey,
					hasSeparatorRef.current && entry.index < nextEntries.length - 1,
				),
			)
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
		rebuildLayout(entries, viewportWidthRef.current)
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

	function captureAnchor(): { rowKey: string; within: number } | null {
		const listOffset = scrollOffsetRef.current - headerHeightRef.current
		if (listOffset < 0 || entriesRef.current.length === 0) {return null}
		const index = sizeIndexRef.current.indexAt(listOffset)
		const entry = entriesRef.current[index]
		if (!entry) {return null}
		return { rowKey: entry.rowKey, within: listOffset - sizeIndexRef.current.prefix(index) }
	}

	function activeSeek() {
		const seek = seekStateRef.current
		if (seek && Date.now() > seek.until) {seekStateRef.current = null}
		return seekStateRef.current
	}

	function restoreAnchor(anchor: { rowKey: string; within: number } | null) {
		if (!anchor || activeSeek()) {return}
		queuedAnchorRef.current = anchor
		if (anchorRestoreScheduledRef.current) {return}
		const scroll = scrollRef.current
		if (!scroll) {return}

		anchorRestoreScheduledRef.current = true
		const timer = setTimeout(() => {
			if (anchorRestoreTimerRef.current !== timer) {return}
			anchorRestoreTimerRef.current = null
			anchorRestoreScheduledRef.current = false
			// A restore scheduled before a deep seek must not fire its write
			// mid-convergence — it would move the clip off the seek target.
			if (activeSeek()) {queuedAnchorRef.current = null; return}
			if (scrollRef.current !== scroll) {return}
			const queued = queuedAnchorRef.current
			queuedAnchorRef.current = null
			if (!queued) {return}
			const index = indexByRowKeyRef.current.get(queued.rowKey)
			if (index === undefined) {return}
			const nextOffset = Math.max(
				0,
				headerHeightRef.current + sizeIndexRef.current.prefix(index) + queued.within,
			)

			if (sameSize(nextOffset, scrollOffsetRef.current)) {return}
			programmaticWriteRef.current = { offset: nextOffset, until: Date.now() + 250 }
			scrollViewSetTop(scroll, nextOffset)
		}, 0)

		anchorRestoreTimerRef.current = timer
	}

	function scheduleEstimateRebuild(anchor: { rowKey: string; within: number } | null) {
		if (anchor) {estimateAnchorRef.current = anchor}
		if (estimateTimerRef.current) {return}
		// Debounce: each rebuild rescales every unmeasured prefix, so one
		// rebuild per measurement burst — not per row — keeps the AppKit
		// relayout/anchor cycle count bounded while samples accumulate.
		estimateTimerRef.current = setTimeout(() => {
			estimateTimerRef.current = null
			// FlashList v2's scrollToIndex model: correction passes stay
			// paused for the whole seek — sizes keep accumulating in the
			// cache/index and one rebuild runs once the seek expires.
			if (activeSeek()) {
				scheduleEstimateRebuild(null)
				return
			}

			const scheduledAnchor = estimateAnchorRef.current
			estimateAnchorRef.current = null
			rebuildLayout(entriesRef.current, viewportWidthRef.current)
			restoreAnchor(scheduledAnchor)
			refreshWindow()
		}, 120)
	}

	function recordRowSize(rowKey: string, width: number, height: number) {
		if (!Number.isFinite(height) || height < 0) {return}
		const index = indexByRowKeyRef.current.get(rowKey)
		if (index === undefined) {return}
		const entry = entriesRef.current[index]
		if (!entry) {return}

		const hasRowSeparator = hasSeparatorRef.current && index < entriesRef.current.length - 1
		const cacheKey = virtualListMeasurementKey(rowKey, hasRowSeparator)
		const cached = sizeCacheRef.current.get(cacheKey)
		// NSViewFrameDidChangeNotification fires on origin moves too, not just
		// resizes — spacer shifts move every mounted row and would otherwise
		// re-run this whole path (and reschedule estimate rebuilds) forever.
		if (cached && sameSize(cached.height, height) && sameSize(cached.width, width)) {return}

		// Keep the seek suppression alive through the measurement storm — the
		// seek ends ~400 ms after the last new/changed size lands (Legend's
		// idle-settle model), not on the first quiet rebuild.
		const seek = activeSeek()
		if (seek) {seek.until = Date.now() + 400}

		const anchor = queuedAnchorRef.current ?? captureAnchor()
		sizeCacheRef.current.set(cacheKey, { width, height })

		const delta = sizeIndexRef.current.set(index, height)
		if (Math.abs(delta) >= 0.5) {
			const anchorIndex = anchor ? indexByRowKeyRef.current.get(anchor.rowKey) : undefined
			if (anchor && anchorIndex !== undefined && index < anchorIndex) {restoreAnchor(anchor)}
			refreshWindow()
		}

		scheduleEstimateRebuild(anchor)
	}

	function syncViewport() {
		const scroll = scrollRef.current
		if (!scroll) {return}
		const size = scrollViewViewport(scroll)
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

	function onScroll(event: AppKitScrollEvent) {
		const scroll = scrollRef.current
		// Prefer the spacer-landmark offset: the top spacer's bottom edge sits
		// at content position `range.top`, so measuring the clip against it
		// reports DOM-style scrollTop with no docH term. Estimate rebuilds
		// resize the document constantly and would phantom-drift the
		// docHeight-derived offset even when the clip never moved.
		const clip = scroll?.contentView
		const spacerBottomY = Number(topSpacerRef.current?.frame?.origin?.y ?? Number.NaN)
		const doc = scroll?.documentView
		const flip = typeof doc?.isFlipped === 'function' ? doc.isFlipped() : doc?.isFlipped
		const flipped = flip === true || Number(flip) === 1
		const originY = Number(clip?.bounds?.origin?.y ?? event?.verticalOffset ?? 0)
		const clipH = Number(clip?.bounds?.size?.height ?? 0)
		let nextOffset: number
		if (Number.isFinite(spacerBottomY)) {
			const clipTopY = flipped ? originY : originY + clipH
			const spacerBottomContent = flipped
				? Number(topSpacerRef.current?.frame?.size?.height ?? 0) + spacerBottomY
				: spacerBottomY

			nextOffset =
				headerHeightRef.current +
				topSpacerHeightRef.current +
				(flipped ? clipTopY - spacerBottomContent : spacerBottomY - clipTopY)
		} else {
			nextOffset = scroll ? scrollViewOffset(scroll) : Number(event?.verticalOffset ?? 0)
		}

		if (props.id) {
			const published = ((globalThis as any).__xplatVlistOffsets ??= {} as Record<string, number>)
			published[props.id] = nextOffset
		}

		let ownWrite = false
		const wrote = programmaticWriteRef.current
		if (wrote !== null) {
			if (sameSize(nextOffset, wrote.offset)) {
				programmaticWriteRef.current = null
				ownWrite = true
			} else if (Date.now() > wrote.until) {
				programmaticWriteRef.current = null
			}
		}

		const jumpThreshold = Math.max(200, viewportHeightRef.current * 1.5)
		// A jump that doesn't match a pending anchor write is an external seek —
		// including one that lands while a stale write flag is still open.
		if (!ownWrite && Math.abs(nextOffset - scrollOffsetRef.current) > jumpThreshold) {
			seekStateRef.current = { target: nextOffset, until: Date.now() + 1000 }
		}

		scrollOffsetRef.current = nextOffset
		viewportHeightRef.current = Number(event?.viewportHeight ?? viewportHeightRef.current)
		refreshWindow()
	}

	function onScrollViewLayout() {
		syncViewport()
	}

	function onHeaderLayout(event: AppKitLayoutEvent) {
		const height = Number(event?.height ?? 0)
		if (sameSize(height, headerHeightRef.current)) {return}
		const anchor = captureAnchor()
		headerHeightRef.current = height
		restoreAnchor(anchor)
		refreshWindow()
	}

	function onRowLayout(entry: VirtualListEntry<T>, event: AppKitLayoutEvent) {
		const view = event?.object
		if (!view) {return}
		// Frame notifications arrive mid-layout: a row can report h=0 (or a
		// stack-stretched transient) before its final size is known, and rows
		// unmounted before the second pass would keep the bogus measurement.
		// Read the frame on the next tick instead, once layout has settled.
		const coalesced = (pendingRowMeasureRef.current.get(entry.rowKey) ?? 0) + 1
		pendingRowMeasureRef.current.set(entry.rowKey, coalesced)
		setTimeout(() => {
			if (pendingRowMeasureRef.current.get(entry.rowKey) !== coalesced) {return}
			pendingRowMeasureRef.current.delete(entry.rowKey)
			if (!view.superview) {return}
			const size = view.frame?.size ?? view.bounds?.size
			recordRowSize(entry.rowKey, Number(size?.width ?? 0), Number(size?.height ?? 0))
		}, 0)
	}

	const range = currentRange()
	rangeRef.current = range
	topSpacerHeightRef.current = range.top
	void windowVersion
	const visibleEntries = entries.slice(range.start, range.end)

	<scrollview
		ref={(view: any) => {
			scrollRef.current = view
			if (view) {setTimeout(() => syncViewport(), 0)}
		}}
		id={props.id}
		className={cx('vx-virtual-list', props.className)}
		style={props.style}
		accessibilityLabel={props.accessibilityLabel}
		onScroll={onScroll}
		onLayoutChanged={onScrollViewLayout}
	>
		<flexboxlayout flexDirection="column">
			@if (props.renderHeader) {
				<flexboxlayout
					className="vx-virtual-list-header"
					flexDirection="column"
					onLayoutChanged={onHeaderLayout}
				>
					{props.renderHeader()}
				</flexboxlayout>
			}
			@if (entries.length === 0) {
				@if (props.renderEmpty) {
					<flexboxlayout className="vx-virtual-list-empty" flexDirection="column">
						{props.renderEmpty()}
					</flexboxlayout>
				}
			} @else {
				<flexboxlayout flexDirection="column">
					<flexboxlayout
						className="vx-virtual-list-spacer"
						style={{ height: range.top }}
						ref={(view: any) => {
							topSpacerRef.current = view
						}}
					/>
					@for (const entry of visibleEntries; key entry.rowKey) {
						<flexboxlayout
							flexDirection="column"
							className="vx-virtual-list-row"
							onLayoutChanged={(event: AppKitLayoutEvent) => onRowLayout(entry, event)}
						>
							{props.renderItem(entry.item, entry.index)}
							{hasSeparator && entry.index < entries.length - 1 ? props.renderSeparator?.() : null}
						</flexboxlayout>
					}
					<flexboxlayout className="vx-virtual-list-spacer" style={{ height: range.bottom }} />
				</flexboxlayout>
			}
			@if (props.renderFooter) {
				<flexboxlayout className="vx-virtual-list-footer" flexDirection="column">
					{props.renderFooter()}
				</flexboxlayout>
			}
		</flexboxlayout>
	</scrollview>;
}
