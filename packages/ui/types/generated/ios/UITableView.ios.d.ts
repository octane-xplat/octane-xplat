import type { ListProps, PlatformWidgetProps } from "../props.js";
/**  UITableView — the platform recycling list (UIKit UITableView via
 *  NativeScript `listview`). `items` is a plain array, ItemsSource, or
 *  ObservableArray — the driver binds `items[index]` into the recycled
 *  cell's root and skips rebinds whose row, item, and renderer are
 *  unchanged. Cell identity = the recycled host view, not the item.
 *  The shared `ui` export has no List — compose ScrollView + mapped
 *  children there.
 *
 *  `refreshing`/`onRefresh`/`refreshThreshold` enable pull-to-refresh:
 *  the indicator is self-drawn (vx-spinner), the pull rides UITableView's
 *  own bounce, and the docked phase holds via contentInset — the same
 *  mechanics UIRefreshControl uses, without its OS spinner. */
export declare function UITableView(props: PlatformWidgetProps<ListProps>): unknown;
