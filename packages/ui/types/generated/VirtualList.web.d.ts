import type { VirtualListProps } from './props.js';
/**  Shared vertical virtualization over a DOM scroll container. Rows outside
 *  the viewport plus one viewport of overscan are unmounted. */
export declare function VirtualList<T = any>(props: VirtualListProps<T>): import("octane/jsx-runtime").JSX.Element;
