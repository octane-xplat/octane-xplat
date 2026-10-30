/**
 * Shared contract for @octane-xplat/sqlite — every platform leaf exports the
 * same names (the identical-exports invariant; the .web/.macos/.windows leaves
 * are implementation swaps, not API changes).
 */

/** One bindable value. `bigint` requires a 64-bit-safe column; ArrayBuffer
 *  and Uint8Array bind as BLOBs. */
export type SqliteParam = null | number | bigint | string | ArrayBuffer | Uint8Array
/** Bind parameters — a lone scalar is wrapped for convenience, an array is
 *  positional `?` binding. Named parameters are not supported. */
export type SqliteParams = SqliteParam | SqliteParam[]

/** One result row keyed by column name; duplicate column names collapse to
 *  the last occurrence — use aliases or selectArray() for positional rows. */
export interface SqliteRow {
	[name: string]: SqliteParam
}

/** Options for openDatabase(). */
export interface OpenDatabaseOptions {
	/**
	 * Native only: route calls through the plugin's worker thread instead of
	 * the JS thread. Defaults to true. Ignored on other platforms (the web
	 * leaf always runs in a Worker).
	 */
	threading?: boolean
}

/** Open database handle. Calls are serialized per handle — see transaction()
 *  for the concurrency rules. */
export interface SqliteDb {
	/** False after close(); further calls reject. */
	readonly isOpen: boolean
	/**
	 * False when the backend opened a transient database — the web leaf only
	 * persists through OPFS, which needs a Worker and, on some browsers,
	 * cross-origin isolation. Always true on native.
	 */
	readonly persistent: boolean
	/** Run a statement that returns no rows (DDL, INSERT/UPDATE/DELETE). */
	execute(sql: string, params?: SqliteParams): Promise<void>
	/** Run a query and return all rows as objects. `T` is an unchecked cast —
	 *  the driver returns column-named SqliteRow values. */
	select<T = SqliteRow>(sql: string, params?: SqliteParams): Promise<T[]>
	/** Run a query and return all rows as positional arrays. */
	selectArray(sql: string, params?: SqliteParams): Promise<SqliteParam[][]>
	/** First row, or null. */
	get<T = SqliteRow>(sql: string, params?: SqliteParams): Promise<T | null>
	/** First row as an array, or null. */
	getArray(sql: string, params?: SqliteParams): Promise<SqliteParam[] | null>
	/**
	 * Runs `action` with a transaction-scoped handle; a throw rolls its writes
	 * back. Use that handle and await its operations inside the callback.
	 * Main-handle calls and other transactions queue until this one ends;
	 * awaiting a main-handle call inside the callback would wait on itself.
	 * The scoped handle expires on callback completion and rejects nesting or
	 * close. Close the main handle after the transaction instead.
	 */
	transaction<T>(action: (db: SqliteDb) => Promise<T>): Promise<T>
	/** Stream a query row-by-row via callbacks (plugin's callback contract);
	 *  resolves the row count when onDone fires. Prefer select()/selectArray()
	 *  for ordinary queries — this exists for very large result sets. */
	each(
		sql: string,
		params: SqliteParams,
		onRow: (error: Error | null, row: SqliteRow) => void,
		onDone: (error: Error | null, count: number) => void,
	): Promise<number>
	/** PRAGMA user_version — shared migration hook across platforms. */
	getUserVersion(): Promise<number>
	/** Write PRAGMA user_version. */
	setUserVersion(version: number): Promise<void>
	/** Close the handle; further calls reject. Web leaves this as the only
	 *  way to release the Worker. */
	close(): Promise<void>
}
