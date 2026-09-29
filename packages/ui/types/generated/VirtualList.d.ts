import type { VirtualListProps } from './props.js';
/**  Shared vertical virtualization over NativeScript ScrollView. Off-window
 *  rows unmount; measured row-height changes above the visible anchor adjust
 *  the native scroll offset after layout. */
export declare function VirtualList<T = any>(props: VirtualListProps<T>): unknown;
