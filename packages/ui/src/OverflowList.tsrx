/** @jsxImportSource @nativescript-community/octane */
import { useCallback, useEffect, useRef, useState } from 'octane';
import type { OverflowItem, OverflowListProps } from './props';
import { cx } from './cx';
import { applyEscapeProps } from './escape-props';
import { computeOverflow } from './overflow-math';

import { toChildArray } from './child-array';

/** OverflowList — renders the subset of children that fits the row and
 *  hands the rest to `overflowRenderer`. Native leaf: a hidden inert copy
 *  inside a horizontal ScrollView measures each child's intrinsic width;
 *  the visible row renders only what fits. */
export function OverflowList(props: OverflowListProps) @{
	const gap = (props.gap ?? 2) * 4;
	const minVisibleItems = props.minVisibleItems ?? 0;
	const collapseFrom = props.collapseFrom ?? 'end';
	const observeParent = props.behavior === 'observeParent';
	const isMultiRow = props.maxRows != null && props.maxRows > 1;

	const childArray = toChildArray(props.children);
	const itemCount = childArray.length;

	const container = useRef<any>(null);
	const measure = useRef<any>(null);
	const [visibleCount, setVisibleCount] = useState(itemCount);
	const [rowHeight, setRowHeight] = useState(0);

	const calculate = useCallback(() => {
		const host = container.current;
		const rows = measure.current;
		if (!host || !rows) return;

		const parent = host.parent;
		const availableWidth = observeParent && parent
			? (parent.getActualSize?.().width ?? parent.getMeasuredWidth?.() ?? 0)
			: (host.getActualSize?.().width ?? host.getMeasuredWidth?.() ?? 0);

		if (availableWidth <= 0) return;

		const widths: number[] = [];
		let indicatorWidth = 0;
		let measuredRowHeight = 0;
		const count = Math.min(itemCount, rows.getChildrenCount?.() ?? 0);
		for (let i = 0; i < count; i++) {
			const child = rows.getChildAt(i);
			const w = child?.getMeasuredWidth?.() ?? 0;
			widths.push(w);
			measuredRowHeight = Math.max(measuredRowHeight, child?.getMeasuredHeight?.() ?? 0);
		}

		// The indicator sits after the items in the hidden copy.
		const extra = (rows.getChildrenCount?.() ?? 0) - itemCount;
		if (extra > 0) {
			indicatorWidth = rows.getChildAt(itemCount)?.getMeasuredWidth?.() ?? 0;
		}

		if (!widths.length) {
			setVisibleCount(0);
			return;
		}

		const result = computeOverflow({
			widths,
			gap,
			availableWidth,
			indicatorWidth,
			minVisibleItems,
			maxVisibleItems: props.maxVisibleItems,
			maxRows: props.maxRows,
			collapseFrom,
		});

		setVisibleCount(result.visibleCount);
		setRowHeight((prev) => (prev === measuredRowHeight ? prev : measuredRowHeight));
	}, [itemCount, gap, minVisibleItems, props.maxVisibleItems, props.maxRows, collapseFrom, observeParent]);

	const allItems: OverflowItem[] = childArray.map((child, index) => ({ child, index }));
	const visibleItems = collapseFrom === 'end' ? allItems.slice(0, visibleCount) : allItems.slice(itemCount - visibleCount);
	const overflowItems = collapseFrom === 'end' ? allItems.slice(visibleCount) : allItems.slice(0, itemCount - visibleCount);
	const hasOverflow = overflowItems.length > 0;
	const measureIndicator = props.overflowRenderer?.(allItems) ?? null;

	const overflowKey = JSON.stringify(overflowItems.map(({ index }) => index));
	const reportedKeyRef = useRef<string>('[]');
	const overflowItemsRef = useRef(overflowItems);
	overflowItemsRef.current = overflowItems;

	useEffect(() => {
		if (!props.onOverflowChange || reportedKeyRef.current === overflowKey) return;
		reportedKeyRef.current = overflowKey;
		props.onOverflowChange(overflowItemsRef.current);
	});

	const containerHeight = isMultiRow && rowHeight > 0 && props.maxRows != null
		? rowHeight * props.maxRows + gap * (props.maxRows - 1)
		: undefined;

	<>
		{/* Hidden measurement copy — a horizontal ScrollView gives children an
		    unbounded width constraint so each reports its intrinsic width;
		    the host box is height-0 + hidden so it never paints. */}
		<flexboxlayout height={0} visibility="hidden" className="vx-overflowlist-measure">
			<scrollview orientation="horizontal" scrollBarIndicatorVisible={false}>
				<flexboxlayout ref={(v: any) => { measure.current = v; }} flexDirection="row" gap={gap} onLayoutChanged={calculate}>
					{childArray}
					{measureIndicator != null ? <flexboxlayout flexDirection="row">{measureIndicator}</flexboxlayout> : null}
				</flexboxlayout>
			</scrollview>
		</flexboxlayout>
		<flexboxlayout
			ref={(v: any) => { container.current = v; if (v) { applyEscapeProps(v, props); v.on?.('layoutChanged', calculate); } }}
			id={props.id}
			className={cx('vx-overflowlist', isMultiRow && 'vx-overflowlist--multirow', props.className)}
			style={{ ...props.style, height: containerHeight }}
			flexDirection="row"
			flexWrap={isMultiRow ? 'wrap' : 'nowrap'}
			alignItems="flex-start"
			rowGap={isMultiRow ? gap : undefined}
			gap={gap}
			onLayoutChanged={calculate}
		>
			{collapseFrom === 'start' && hasOverflow ? props.overflowRenderer?.(overflowItems) : null}
			{visibleItems.map(({ child }) => child)}
			{collapseFrom === 'end' && hasOverflow ? props.overflowRenderer?.(overflowItems) : null}
		</flexboxlayout>
	</>
}
