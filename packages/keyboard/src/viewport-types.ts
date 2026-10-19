/** @internal A consumer-owned native viewport policy, separate from observation. */
export interface KeyboardViewportLease {
	readonly supported: boolean
	/** Follow replacement native views belonging to the same framework host. */
	update(): void
	release(): void
}
