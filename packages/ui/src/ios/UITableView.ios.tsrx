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
import { observeListViewability } from '../list-viewability-observer.ios';
import type { ListVisibilityObserver } from '../list-viewability-runtime';
import { createInitialListScrollRestorer, scrollListToIndex, type PlatformListRuntime } from '../list-viewability-runtime';

function rejectNestedScrollView(event: any) {
	let parent = event.object?.parent;
	while (parent) {
		if (parent instanceof ScrollView) {
			throw new Error('[UITableView] cannot be nested inside native ScrollView. Use ScrollableArea axis="both" so the list owns scrolling.');
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
function UITableViewInner(props: {
	className?: any;
	style?: any;
	id?: string;
	items: any[];
	initialScrollIndex?: number;
	viewabilityConfig?: PlatformListProps['viewabilityConfig'];
	renderItem: (item: any, index: number) => any;
	estimatedItemHeight?: number;
	onEndReached?: () => void;
	ios?: Record<string, any>;
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
	const initialScroll = useRef(createInitialListScrollRestorer());
	const tryInitialScroll = () => initialScroll.current.tryScroll(
		props.runtime.list.current,
		props.initialScrollIndex,
		props.items.length,
	);
	useEffect(() => {
		const list = props.runtime.list.current;
		if (!list) return;
		visibility.current = observeListViewability(list, () => ({
			items: props.runtime.items.current,
			config: props.runtime.config.current,
			update: (rows, items, config) => tracker.current.update(rows, items, config, props.runtime.onChange.current),
		}), () => tracker.current.reset());

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
		tryInitialScroll();
	}, [props.initialScrollIndex, props.items.length]);

	useEffect(() => {
		const bag = props.refresh;
		if (!bag || !lv.current) return;
		bag.ctl.current = createPullToRefresh({
			scroller: lv.current,
			indicator: bag.indicator.current,
			isAtTop: () => true, // iOS reads contentOffset directly — unused
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
			if (v) tryInitialScroll();
		}}
		id={props.id}
		className={cx(props.className)}
		style={props.style}
		items={props.items}
		iosEstimatedRowHeight={props.estimatedItemHeight}
		onLoadMoreItems={props.onEndReached}
		onLoaded={(event: any) => {
			rejectNestedScrollView(event);
			tryInitialScroll();
		}}
		renderItem={renderCell}
		{...props.ios}
	/>
}

// The listview subtree is memoized on `items` and list configuration: the
// universal driver re-applies props on every render (no value diffing), and
// each write can trigger view-level side effects — measured: every unrelated
// parent re-render refired itemLoading for all visible cells. Memoized on the
// items reference and list configuration, unrelated parent re-renders skip
// this subtree. Constraint: `renderItem` should be identity-stable (a
// useCallback-style ref) — a fresh closure each render is deliberately
// not part of the compare. (`UITableViewInner` must precede this — compiled
// components are consts, not hoisted functions.)
const MemoListView = memo(UITableViewInner, (a, b) =>
	a.items === b.items &&
	a.initialScrollIndex === b.initialScrollIndex &&
	a.viewabilityConfig?.itemVisiblePercentThreshold === b.viewabilityConfig?.itemVisiblePercentThreshold &&
	a.viewabilityConfig?.minimumViewTime === b.viewabilityConfig?.minimumViewTime &&
	a.runtime === b.runtime &&
	a.className === b.className &&
	a.style === b.style &&
	a.id === b.id &&
	a.estimatedItemHeight === b.estimatedItemHeight &&
	a.onEndReached === b.onEndReached &&
	a.ios === b.ios &&
	a.modifiers === b.modifiers &&
	a.refresh === b.refresh
);

/** UITableView — the platform recycling list (UIKit UITableView via
 *  NativeScript `listview`). `items` is a plain array, ItemsSource, or
 *  ObservableArray — the driver binds `items[index]` into the recycled
 *  cell's root and skips rebinds whose row, item, and renderer are
 *  unchanged. Cell identity = the recycled host view, not the item.
 *  The shared `List` is a fully rendered content list, not an OS-backed
 *  recycled collection. Use `VirtualList` for portable windowing.
 *
 *  `refreshing`/`onRefresh`/`refreshThreshold` enable pull-to-refresh:
 *  the indicator is self-drawn (vx-spinner), the pull rides UITableView's
 *  own bounce, and the docked phase holds via contentInset — the same
 *  mechanics UIRefreshControl uses, without its OS spinner. */
export function UITableView(props: PlatformWidgetProps<PlatformListProps>) @{
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
			<gridlayout
				ref={(v: any) => {
					// iOS doesn't clip children — the resting indicator sits
					// translated above the wrapper's top edge without it.
					if (v?.ios) v.ios.clipsToBounds = true;
				}}
				className={cx('vx-refresh-wrap', props.className)}
				style={props.style}
			>
				<MemoListView
					id={props.id}
					items={props.items}
					renderItem={props.renderItem}
					estimatedItemHeight={props.estimatedItemHeight}
					onEndReached={props.onEndReached}
					ios={props.ios}
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
				estimatedItemHeight={props.estimatedItemHeight}
				onEndReached={props.onEndReached}
				ios={props.ios}
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
