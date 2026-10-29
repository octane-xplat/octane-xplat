/** @internal Native input must enter the owning canonical flow. */
export interface NativeBackGestureOptions {
	canBegin(): boolean
	back(): Promise<unknown>
}
