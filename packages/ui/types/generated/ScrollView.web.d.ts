import type { ScrollViewProps } from "./props.js";
/**  Scroll container — a div with overflow scrolling. Native wraps
 *  children in a column container; web divs already stack vertically.
 *  With `onRefresh`/`refreshing` the leaf wraps in a pull-to-refresh
 *  host (self-drawn indicator). */
export declare function ScrollView(props: ScrollViewProps): import("octane/jsx-runtime").JSX.Element;
