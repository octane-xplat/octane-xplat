/** @jsxImportSource @nativescript-community/octane */
// Universal hooks import from 'octane' — the compiler retargets them to the
// nativescript runtime, and the dev server serves them via HTTP-ESM.
import { memo, useCallback, useEffect, useImperativeHandle, useRef } from 'octane';
import { ScrollView } from '@nativescript/core';
import type { PlatformListProps, PlatformWidgetProps } from "../props";
import type { RefreshConfig, RefreshController } from '../refresh';
import { cx } from "../cx";
import { ActivityIndicator } from '../ActivityIndicator.tsrx';
import { applyEscapeProps } from '../escape-props';
import { REFRESH_HEADER_HEIGHT } from '../refresh-metrics';
import { createPullToRefresh } from '../refresh';
import { createListViewabilityTracker } from '../list-viewability-core';
import { observeListViewability } from '../list-viewability-observer.android';
import type { ListVisibilityObserver } from '../list-viewability-runtime';
import { scrollListToIndex, type PlatformListRuntime } from '../list-viewability-runtime';

function rejectNestedScrollView(event: any) {
	let parent = event.object?.parent;
	while (parent) {
		if (parent instanceof ScrollView) {
			throw new Error('[RecyclerView] cannot be nested inside native ScrollView. Use ScrollableArea axis="both" so the list owns scrolling.');
		}

		parent = parent.parent;
	}
}

/** Stable ref bag across the memo boundary — refresh callbacks are fresh
 *  closures each parent render, so the props live behind refs and the
 *  memo compare just sees the same bag. */
interface RefreshBag {
	cfg: { current: RefreshConfig };
	indicator: { current: any };
	ctl: { current: RefreshController | null };
}

// Cell machinery is driver-owned since @nativescript-community/octane 0.2.1
// (upstream #7, closes our issue #1): `renderItem` on <listview> makes
// itemTemplate vend a ContentView per recycled cell, each with its own
// universal root; itemLoading binds items[index] and skips unchanged rows;
// a changed renderItem re-binds live cells; discard unmounts the roots.
// The cell ContentView is single-child — a renderItem returning multiple
// roots would silently drop siblings — so output wraps in a gridlayout.
function RecyclerViewInner(props: {
	className?: any;
	style?: any;
	id?: string;
	items: any[];
	initialScrollIndex?: number;
	viewabilityConfig?: PlatformListProps['viewabilityConfig'];
	renderItem: (item: any, index: number) => any;
	onEndReached?: () => void;
	android?: Record<string, any>;
	modifiers?: PlatformWidgetProps<PlatformListProps>['modifiers'];
	refresh?: RefreshBag;
	runtime: PlatformListRuntime;
}) @{
	const lv = useRef<any>(null);
	const renderCell = useCallback(
		(item: any, index: number) => <gridlayout>{props.renderItem(item, index)}</gridlayout>,
		[props.renderItem],
	);

	const visibility = useRef<ListVisibilityObserver | null>(null);
	const tracker = useRef(createListViewabilityTracker());
	useEffect(() => {
		const list = props.runtime.list.current;
		if (!list) return;
		visibility.current = observeListViewability(list, () => ({
			items: props.runtime.items.current,
			config: props.runtime.config.current,
			update: (rows, items, config) => tracker.current.update(rows, items, config, props.runtime.onChange.current),
		}));

		return () => {
			visibility.current?.dispose();
			visibility.current = null;
			tracker.current.dispose();
		};
	}, []);

	useEffect(() => {
		visibility.current?.refresh();
	}, [props.items, props.viewabilityConfig]);

	useEffect(() => {
		scrollListToIndex(props.runtime.list.current, props.initialScrollIndex, props.items.length);
	}, [props.initialScrollIndex, props.items.length]);

	useEffect(() => {
		const bag = props.refresh;
		if (!bag || !lv.current) return;
		bag.ctl.current = createPullToRefresh({
			scroller: lv.current,
			indicator: bag.indicator.current,
			isAtTop: () => (lv.current?.android?.computeVerticalScrollOffset?.() ?? 0) <= 0,
			cfg: bag.cfg,
		});

		return () => {
			bag.ctl.current?.detach();
			bag.ctl.current = null;
		};
	}, []);

	<listview
		ref={(v: any) => {
			lv.current = v;
			props.runtime.list.current = v;
			applyEscapeProps(v, props);
		}}
		id={props.id}
		className={cx(props.className)}
		style={props.style}
		items={props.items}
		onLoadMoreItems={props.onEndReached}
		onLoaded={rejectNestedScrollView}
		renderItem={renderCell}
		{...props.android}
	/>
}

// The listview subtree is memoized on `items` and list configuration: the
// universal driver re-applies props on every render (no value diffing), and
// each write can trigger view-level side effects — measured: every unrelated
// parent re-render refired itemLoading for all visible cells. Memoized on the
// items reference and list configuration, unrelated parent re-renders skip
// this subtree. Constraint: `renderItem` should be identity-stable (a
// useCallback-style ref) — a fresh closure each render is deliberately
// not part of the compare. (`RecyclerViewInner` must precede this —
// compiled components are consts, not hoisted functions.)
const MemoListView = memo(RecyclerViewInner, (a, b) =>
	a.items === b.items &&
	a.initialScrollIndex === b.initialScrollIndex &&
	a.viewabilityConfig?.itemVisiblePercentThreshold === b.viewabilityConfig?.itemVisiblePercentThreshold &&
	a.viewabilityConfig?.minimumViewTime === b.viewabilityConfig?.minimumViewTime &&
	a.runtime === b.runtime &&
	a.className === b.className &&
	a.style === b.style &&
	a.id === b.id &&
	a.onEndReached === b.onEndReached &&
	a.android === b.android &&
	a.modifiers === b.modifiers &&
	a.refresh === b.refresh
);

/** RecyclerView — the Android public compatibility name for NativeScript
 *  `listview`, backed by `android.widget.ListView`/`AbsListView` in core
 *  9.1.x. `items` is a plain array, ItemsSource, or
 *  ObservableArray — the driver binds `items[index]` into the recycled
 *  cell's root and skips rebinds whose row, item, and renderer are
 *  unchanged. Cell identity = the recycled host view, not the item.
 *  The shared `List` is a fully rendered content list, not an OS-backed
 *  recycled collection. Use `VirtualList` for portable windowing.
 *
 *  `refreshing`/`onRefresh`/`refreshThreshold` enable pull-to-refresh:
 *  the indicator is self-drawn (vx-spinner) and the list is translated
 *  inside a clipped wrapper while the drag accumulates — no
 *  SwipeRefreshLayout, so the pixels match the shared ScrollableArea path. */
export function RecyclerView(props: PlatformWidgetProps<PlatformListProps>) @{
	const runtime = useRef<PlatformListRuntime>({
		list: { current: null },
		items: { current: props.items },
		config: { current: props.viewabilityConfig },
		onChange: { current: props.onViewableItemsChanged },
	});

	runtime.current.items.current = props.items;
	runtime.current.config.current = props.viewabilityConfig;
	runtime.current.onChange.current = props.onViewableItemsChanged;
	useImperativeHandle(props.ref, () => ({
		scrollToIndex: (index, options) => scrollListToIndex(
			runtime.current.list.current,
			index,
			runtime.current.items.current.length,
			options?.animated,
		),
	}), [props.ref]);

	const refreshCapable = props.onRefresh != null || props.refreshing != null;
	const cfg = useRef<RefreshConfig>({});
	cfg.current = {
		onRefresh: props.onRefresh,
		refreshing: props.refreshing,
		threshold: props.refreshThreshold,
	};

	const indicator = useRef<any>(null);
	const ctl = useRef<RefreshController | null>(null);
	const refresh = useRef<RefreshBag>({ cfg, indicator, ctl });

	useEffect(() => {
		ctl.current?.sync();
	}, [props.refreshing]);

	@if (props.items.length > 0) {
		@if (refreshCapable) {
			<gridlayout className={cx('vx-refresh-wrap', props.className)} style={props.style}>
				<MemoListView
					id={props.id}
					items={props.items}
					renderItem={props.renderItem}
					onEndReached={props.onEndReached}
					android={props.android}
					modifiers={props.modifiers}
					refresh={refresh.current}
					initialScrollIndex={props.initialScrollIndex}
					viewabilityConfig={props.viewabilityConfig}
					runtime={runtime.current}
				/>
				<flexboxlayout
					ref={(v: any) => {
						indicator.current = v;
					}}
					className="vx-refresh"
					verticalAlignment="top"
					height={REFRESH_HEADER_HEIGHT}
					translateY={-REFRESH_HEADER_HEIGHT}
				>
					<ActivityIndicator />
				</flexboxlayout>
			</gridlayout>
		} @else {
			<MemoListView
				id={props.id}
				items={props.items}
				className={props.className}
				style={props.style}
				renderItem={props.renderItem}
				onEndReached={props.onEndReached}
				android={props.android}
				modifiers={props.modifiers}
				initialScrollIndex={props.initialScrollIndex}
				viewabilityConfig={props.viewabilityConfig}
				runtime={runtime.current}
			/>
		}
	} @else {
		<>{props.renderEmpty?.()}</>
	}
}
