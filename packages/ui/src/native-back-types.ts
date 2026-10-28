/** @internal A synchronous claim prevents the SDK's default Back action while
 * the owning router completes its asynchronous transition. */
export interface NativeRouterBackEvent {
	cancel: boolean
	activity?: unknown
	object?: unknown
}

export interface NativeRouterBackHandler {
	priority: number
	handle(event: NativeRouterBackEvent): boolean
}
