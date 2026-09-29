export interface SafeAreaInsets {
    top: number;
    right: number;
    bottom: number;
    left: number;
}
/**  Approximate CSS safe-area values, measured on mount and viewport resize. */
export declare function useSafeAreaInsets(): SafeAreaInsets;
