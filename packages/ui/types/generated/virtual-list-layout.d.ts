export type VirtualListKey = string | number;
export interface VirtualListRange {
    start: number;
    end: number;
    top: number;
    bottom: number;
}
export interface VirtualListEntry<T> {
    item: T;
    index: number;
    key: VirtualListKey;
    rowKey: string;
    type: VirtualListKey;
    typeKey: string;
}
export interface VirtualListSizeRecord {
    width: number;
    height: number;
}
export declare const VIRTUAL_LIST_ESTIMATED_ROW_SIZE = 48;
export declare const VIRTUAL_LIST_MIN_TYPE_SAMPLES = 4;
export declare function createVirtualListEntries<T>(items: readonly T[], keyExtractor: (item: T, index: number) => VirtualListKey, getItemType?: (item: T, index: number) => VirtualListKey): VirtualListEntry<T>[];
export declare function virtualListMeasurementKey(rowKey: string, hasSeparator: boolean): string;
export declare function estimateVirtualListSizes<T>(entries: readonly VirtualListEntry<T>[], hasSeparator: boolean, width: number, measurements: ReadonlyMap<string, VirtualListSizeRecord>): number[];
/** Prefix-size index for variable-height rows. Updates and offset lookups are
 *  logarithmic, so measuring a row does not scan the whole data set. */
export declare class VirtualListSizeIndex {
    private sizes;
    private tree;
    get length(): number;
    get total(): number;
    reset(sizes: readonly number[]): void;
    get(index: number): number;
    set(index: number, size: number): number;
    /** Sum of the first `count` row heights. */
    prefix(count: number): number;
    /** Index of the row containing `offset`; exact row boundaries select the
     *  row that starts at that boundary. */
    indexAt(offset: number): number;
}
export declare function virtualListRange(sizes: VirtualListSizeIndex, scrollOffset: number, viewportSize: number, overscanSize?: number): VirtualListRange;
/** Renderer keys include the item type so changing a key's type remounts its
 *  row instead of carrying component state into an incompatible template. */
export declare function virtualListRowKey(key: VirtualListKey, type: VirtualListKey): string;
