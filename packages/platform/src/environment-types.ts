/** Current host connectivity and activity. Missing values mean unknown. */
export interface RuntimeEnvironmentSnapshot {
	readonly online?: boolean
	readonly active?: boolean
	readonly capabilities?: { readonly connectivity: boolean; readonly activity: boolean }
}

/** Imperative host events for services outside component lifetimes. */
export interface RuntimeEnvironment {
	getSnapshot(): RuntimeEnvironmentSnapshot
	/** Emits current state and returns an independent listener teardown. */
	subscribe(listener: (snapshot: RuntimeEnvironmentSnapshot) => void): () => void
}
