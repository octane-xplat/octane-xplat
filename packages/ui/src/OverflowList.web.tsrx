import { useCallback, useEffect, useRef, useState } from 'octane';
import type { OverflowItem, OverflowListProps } from './props';
import { applyEscapeProps } from './escape-props';
import { computeOverflow } from './overflow-math';

/** Flatten `children` into an array — TSRX children arrive as arrays or
 *  single nodes; keyed lists keep their `key` for identity reporting. */
function toChildArray(children: any): any[] {
	const out: any[] = [];
	const walk = (c: any) => {
		if (c == null || c === false || c === true) return;
		if (Array.isArray(c)) {
			for (const n of c) walk(n);
		} else {
			out.push(c);
		}
	};

	walk(children);
	return out;
}

/** OverflowList — renders the subset of children that fits the row (or a
 *  configured count/row cap) and hands the remainder to
 *  `overflowRenderer`. Measures a hidden inert copy + the indicator
 *  rendered at maximum width. */
export function OverflowList(props: OverflowListProps) @{
	const gap = (props.gap ?? 2) * 4;
	const minVisibleItems = props.minVisibleItems ?? 0;
	const collapseFrom = props.collapseFrom ?? 'end';
	const observeParent = props.behavior === 'observeParent';
	const isMultiRow = props.maxRows != null && props.maxRows > 1;

	const childArray = toChildArray(props.children);
	const itemCount = childArray.length;

	const containerEl = useRef<HTMLElement | null>(null);
	const measureEl = useRef<HTMLElement | null>(null);
	const [visibleCount, setVisibleCount] = useState(itemCount);
	const [rows, setRows] = useState(1);
	const [rowHeight, setRowHeight] = useState(0);

	const calculate = useCallback(() => {
		const container = containerEl.current;
		const measure = measureEl.current;
		if (!container || !measure) return;

		let availableWidth: number;
		const parent = container.parentElement;
		if (observeParent && parent) {
			const parentStyle = getComputedStyle(parent);
			availableWidth =
				parent.clientWidth -
				parseFloat(parentStyle.paddingLeft || '0') -
				parseFloat(parentStyle.paddingRight || '0');
		} else {
			availableWidth = container.offsetWidth;
		}

		const allChildren = Array.from(measure.children) as HTMLElement[];
		const hasIndicator = allChildren.length > itemCount;
		const children = hasIndicator ? allChildren.slice(0, itemCount) : allChildren;
		const indicatorWidth = hasIndicator ? allChildren[allChildren.length - 1].offsetWidth : 0;

		if (!children.length) {
			setVisibleCount(0);
			setRows(0);
			return;
		}

		const widths = children.map((child) => child.offsetWidth);
		const measuredRowHeight = children.reduce((max, child) => Math.max(max, child.offsetHeight || 0), 0);

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
		setRows((prev) => (prev === result.rows ? prev : result.rows));
		setRowHeight((prev) => (prev === measuredRowHeight ? prev : measuredRowHeight));
	}, [itemCount, gap, minVisibleItems, props.maxVisibleItems, props.maxRows, collapseFrom, observeParent]);

	// Re-measure on resize of the observed element (self or parent) and on
	// child/indicator content changes inside the hidden copy.
	useEffect(() => {
		const container = containerEl.current;
		const measure = measureEl.current;
		if (!container || !measure) return;
		const target = observeParent && container.parentElement ? container.parentElement : container;
		const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(calculate) : null;
		ro?.observe(target);
		const mo = new MutationObserver(calculate);
		mo.observe(measure, { childList: true, subtree: true, characterData: true });
		calculate();
		return () => {
			ro?.disconnect();
			mo.disconnect();
		};
	}, [calculate, observeParent]);

	const allItems: OverflowItem[] = childArray.map((child, index) => ({ child, index }));
	const visibleItems = collapseFrom === 'end' ? allItems.slice(0, visibleCount) : allItems.slice(itemCount - visibleCount);
	const overflowItems = collapseFrom === 'end' ? allItems.slice(visibleCount) : allItems.slice(0, itemCount - visibleCount);
	const hasOverflow = overflowItems.length > 0;
	const measureIndicator = props.overflowRenderer?.(allItems) ?? null;

	// onOverflowChange fires on membership/order changes only; silent while
	// nothing overflows initially, reports `[]` after having overflowed.
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
		<div ref={(el: HTMLElement | null) => { measureEl.current = el; }} className="vx-overflowlist-measure" aria-hidden="true" style={{ gap }}>
			{childArray}
			{measureIndicator != null ? <div className="vx-overflowlist-measure-indicator">{measureIndicator}</div> : null}
		</div>
		<div
			ref={(el: HTMLElement | null) => { containerEl.current = el; if (el) applyEscapeProps(el, props); }}
			id={props.id}
			className={['vx-overflowlist', isMultiRow && 'vx-overflowlist--multirow', observeParent && hasOverflow && 'vx-overflowlist--fill-parent', props.className]}
			style={{ gap, maxHeight: containerHeight, ...props.style }}
			data-rows={isMultiRow ? rows : undefined}
		>
			{collapseFrom === 'start' && hasOverflow ? props.overflowRenderer?.(overflowItems) : null}
			{visibleItems.map(({ child }) => child)}
			{collapseFrom === 'end' && hasOverflow ? props.overflowRenderer?.(overflowItems) : null}
		</div>
	</>
}
