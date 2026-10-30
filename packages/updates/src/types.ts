/** Settings for an optional native bundle updater. */
export interface UpdatesOptions {
	/** HTTPS Worker origin, without a path. No network calls happen during creation. */
	endpoint: string
	/** Payload version embedded in this binary; numeric x.y.z. */
	embeddedVersion: string
	/** Release channel; defaults to stable. */
	channel?: string
	/** Download limit in bytes; defaults to 32 MiB. */
	maxDownloadBytes?: number
	/** Expanded archive limit in bytes; defaults to 128 MiB. */
	maxExpandedBytes?: number
	/** HTTP timeout in milliseconds; defaults to 30 seconds. */
	timeout?: number
}

/** A verified server descriptor. install() revalidates every field. */
export interface UpdateManifest {
	/** Payload version, numeric x.y.z — compared against embeddedVersion. */
	version: string
	/** SHA-256 of the archive bytes; verified again at install() time. */
	sha256: string
	/** Archive size in bytes; checked against maxDownloadBytes. */
	size: number
	/** Fingerprint of the native runtime the payload was built against;
	 *  a mismatch yields 'native-incompatible' — the payload is never staged. */
	nativeFingerprint: string
	/** HTTPS URL the archive is fetched from. */
	url: string
}

/** Result of checking a channel, including an update previously rejected at boot. */
export type UpdateCheck =
	| {
			/** True when `manifest` describes a stageable update. */
			available: true
			manifest: UpdateManifest
	  }
	| {
			/** False — `reason` explains why no update can be staged. */
			available: false
			reason: 'unsupported' | 'no-release' | 'up-to-date' | 'native-incompatible' | 'rejected'
	  }

/** Local state; downloading or staging never changes the current session's version. */
export interface UpdatesStatus {
	/** Version this process is running — never changes mid-session. */
	currentVersion: string
	/** Version staged for the next cold launch, or null. */
	stagedVersion: string | null
	/** True while a booted update still awaits markHealthy(); an unconfirmed
	 *  update is rolled back by the OS guard before it can entrench. */
	needsConfirmation: boolean
}

/** Next-launch updater. Each app process may create only one native client. */
export interface UpdatesClient {
	/** True on iOS/Android release builds; false in LiveSync/debug builds and on web, macOS, Linux and Windows. */
	readonly supported: boolean
	/** Resolve the configured channel. Network and malformed-manifest failures reject. */
	check(): Promise<UpdateCheck>
	/** Verify and stage an archive. Returns after installation is ready for the next cold launch. */
	install(manifest: UpdateManifest): Promise<void>
	/** Confirm the running update only after essential UI/data startup succeeds. Does not confirm a staged update. */
	markHealthy(): void
	/** Request backup restoration on the next cold launch. Does not restart the process or clear app data. */
	rollback(): void
	/** Inspect current, staged and unconfirmed versions without a network request. */
	status(): UpdatesStatus
}
