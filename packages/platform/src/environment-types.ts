/** Current host connectivity and activity. Missing values mean unknown. */
export interface RuntimeEnvironmentSnapshot {
	/** Whether the device reports connectivity. */
	readonly online?: boolean
	/** Whether the app is in the foreground/active state. */
	readonly active?: boolean
	/** Which snapshot fields this host can observe — absent fields stay undefined. */
	readonly capabilities?: {
		/** `online` is reported. */
		readonly connectivity: boolean
		/** `active` is reported. */
		readonly activity: boolean
	}
}

/** Imperative host events for services outside component lifetimes. */
export interface RuntimeEnvironment {
	/** Point-in-time snapshot; absent fields mean the host can't observe them. */
	getSnapshot(): RuntimeEnvironmentSnapshot
	/** Emits current state and returns an independent listener teardown. */
	subscribe(listener: (snapshot: RuntimeEnvironmentSnapshot) => void): () => void
}
