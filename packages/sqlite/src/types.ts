/**
 * Shared contract for @octane-xplat/sqlite — every platform leaf exports the
 * same names (the identical-exports invariant; the .web/.macos/.windows leaves
 * are implementation swaps, not API changes).
 */

export type SqliteParam = null | number | bigint | string | ArrayBuffer | Uint8Array
export type SqliteParams = SqliteParam | SqliteParam[]

export interface SqliteRow {
	[name: string]: SqliteParam
}

export interface OpenDatabaseOptions {
	/**
	 * Native only: route calls through the plugin's worker thread instead of
	 * the JS thread. Defaults to true. Ignored on other platforms (the web
	 * leaf always runs in a Worker).
	 */
	threading?: boolean
}

export interface SqliteDb {
	readonly isOpen: boolean
	/**
	 * False when the backend opened a transient database — the web leaf only
	 * persists through OPFS, which needs a Worker and, on some browsers,
	 * cross-origin isolation. Always true on native.
	 */
	readonly persistent: boolean
	execute(sql: string, params?: SqliteParams): Promise<void>
	select<T = SqliteRow>(sql: string, params?: SqliteParams): Promise<T[]>
	selectArray(sql: string, params?: SqliteParams): Promise<SqliteParam[][]>
	/** First row, or null. */
	get<T = SqliteRow>(sql: string, params?: SqliteParams): Promise<T | null>
	/** First row as an array, or null. */
	getArray(sql: string, params?: SqliteParams): Promise<SqliteParam[] | null>
	/** Runs `action` inside a transaction; a throw rolls everything back. */
	transaction<T>(action: (db: SqliteDb) => Promise<T>): Promise<T>
	each(
		sql: string,
		params: SqliteParams,
		onRow: (error: Error | null, row: SqliteRow) => void,
		onDone: (error: Error | null, count: number) => void,
	): Promise<number>
	/** PRAGMA user_version — shared migration hook across platforms. */
	getUserVersion(): Promise<number>
	setUserVersion(version: number): Promise<void>
	close(): Promise<void>
}
