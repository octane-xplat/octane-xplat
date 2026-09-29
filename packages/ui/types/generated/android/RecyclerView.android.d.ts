import type { ListProps, PlatformWidgetProps } from "../props.js";
/**  RecyclerView — the platform recycling list (Android RecyclerView via
 *  NativeScript `listview`). `items` is a plain array, ItemsSource, or
 *  ObservableArray — the driver binds `items[index]` into the recycled
 *  cell's root and skips rebinds whose row, item, and renderer are
 *  unchanged. Cell identity = the recycled host view, not the item.
 *  The shared `ui` export has no List — compose ScrollView + mapped
 *  children there.
 *
 *  `refreshing`/`onRefresh`/`refreshThreshold` enable pull-to-refresh:
 *  the indicator is self-drawn (vx-spinner) and the list is translated
 *  inside a clipped wrapper while the drag accumulates — no
 *  SwipeRefreshLayout, so the pixels match the shared ScrollView path. */
export declare function RecyclerView(props: PlatformWidgetProps<ListProps>): unknown;
