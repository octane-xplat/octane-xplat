export interface SafeAreaInsets {
    top: number;
    right: number;
    bottom: number;
    left: number;
}
/**  Reads the root view's insets; Android and pre-attachment reads may be zero. */
export declare function useSafeAreaInsets(): SafeAreaInsets;
