import type { ScrollViewProps } from "./props.js";
/**  Scroll container — NS <scrollview>. NS ScrollView hosts exactly one
 *  child view, so children are wrapped in a column flexboxlayout — the
 *  same content-container indirection RN's ScrollView does internally.
 *  `horizontal` maps to NS's orientation prop. With `onRefresh`/`refreshing`
 *  the leaf wraps in a pull-to-refresh host (self-drawn indicator). */
export declare function ScrollView(props: ScrollViewProps): unknown;
