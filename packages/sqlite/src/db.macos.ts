/**
 * macOS (AppKit/JSC host) backend: system libsqlite3 via C-function interop.
 *
 * The host runtime resolves declared C functions from the metadata bundle
 * (metadata.macos.arm64.nsmd) — sqlite3.h and dlfcn.h are swept in during
 * generation, so `dlopen` loads /usr/lib/libsqlite3.dylib and the sqlite3_*
 * entry points are ordinary JS calls. This gives real file-backed sqlite with
 * per-statement durability, identical semantics to the iOS/Android plugin.
 *
 * Depends on host metadata generated with the sqlite3/dlfcn umbrella imports
 * (prebuilt metadata.nsmd >= the build that carries them); without it
 * `supported` reports false and openDatabase rejects.
 */
import type { OpenDatabaseOptions, SqliteDb, SqliteParam, SqliteParams, SqliteRow } from './types'

const host = globalThis as any
const fs = host.require?.('node:fs')

// SQLITE_TRANSIENT (-1): sqlite copies bound text/blob bytes. The marshaller
// hands the C side a temporary buffer, so STATIC (0) reads freed memory.
// Allocate the sentinel once — the runtime's Pointer→fn-pointer marshal is not
// re-entrant; a fresh Pointer per call crashes on the second bind.
let transientPtr: any = null
const SQLITE_TRANSIENT = () => (transientPtr ??= new host.interop.Pointer(-1))
const SQLITE_ROW = 100
const SQLITE_DONE = 101
const SQLITE_INTEGER = 1
const SQLITE_FLOAT = 2
const SQLITE_TEXT = 3
const SQLITE_BLOB = 4

let dlopened = false

const ensureLib = () => {
	if (dlopened) {
		return
	}

	if (typeof host.dlopen !== 'function' || typeof host.sqlite3_open !== 'function') {
		throw new Error('sqlite3 interop unavailable — host metadata predates the sqlite3/dlfcn sweep')
	}

	host.dlopen('/usr/lib/libsqlite3.dylib', 2)
	dlopened = true
}

export const supported =
	typeof host.dlopen === 'function' && typeof host.sqlite3_open === 'function'

// NSApplicationSupportDirectory (14) / NSUserDomainMask (1).
const databaseDir = (): string | null => {
	try {
		const urls = host.NSFileManager.defaultManager.URLsForDirectoryInDomains(14, 1)
		if (!urls?.count) {
			return null
		}

		return `${urls.objectAtIndex(0).path}/octane-sqlite`
	} catch {
		return null
	}
}

const databasePath = (name: string): string | null => {
	if (name === ':memory:') {
		return null
	}

	const dir = databaseDir()
	if (!dir || !fs) {
		return null
	}

	try {
		fs.mkdirSync(dir)
	} catch {}

	return `${dir}/${name.replace(/[^\w.-]/g, '_')}.sqlite3`
}

const toArray = (params?: SqliteParams): SqliteParam[] =>
	params == null ? [] : Array.isArray(params) ? params : [params]

const bind = (stmt: any, params: SqliteParam[]) => {
	for (let i = 0; i < params.length; i++) {
		const p = params[i]
		const index = i + 1

		if (p == null) {
			host.sqlite3_bind_null(stmt, index)
		} else if (typeof p === 'string') {
			host.sqlite3_bind_text(stmt, index, p, -1, SQLITE_TRANSIENT())
		} else if (typeof p === 'bigint') {
			host.sqlite3_bind_int64(stmt, index, p)
		} else if (typeof p === 'number') {
			if (Number.isSafeInteger(p)) {
				host.sqlite3_bind_int64(stmt, index, p)
			} else {
				host.sqlite3_bind_double(stmt, index, p)
			}
		} else {
			const bytes = p instanceof ArrayBuffer ? new Uint8Array(p) : p
			host.sqlite3_bind_blob(stmt, index, bytes, bytes.byteLength, SQLITE_TRANSIENT())
		}
	}
}

const columnValue = (stmt: any, index: number): any => {
	switch (host.sqlite3_column_type(stmt, index)) {
		case SQLITE_INTEGER: {
			const v = host.sqlite3_column_int64(stmt, index)
			return typeof v === 'bigint' && v >= -9007199254740991n && v <= 9007199254740991n ? Number(v) : v
		}
		case SQLITE_FLOAT:
			return host.sqlite3_column_double(stmt, index)
		case SQLITE_TEXT:
			return host.interop.stringFromCString(host.sqlite3_column_text(stmt, index))
		case SQLITE_BLOB: {
			const ptr = host.sqlite3_column_blob(stmt, index)
			const len = host.sqlite3_column_bytes(stmt, index)

			if (!ptr || !len) {
				return new Uint8Array(0)
			}

			const data = host.NSData.alloc().initWithBytesLength(ptr, len)
			return new Uint8Array(host.interop.bufferFromData(data))
		}
		default:
			return null
	}
}

class MacosSqliteDb implements SqliteDb {
	isOpen = true
	constructor(
		private readonly db: any,
		readonly persistent: boolean,
	) {}

	private ensureOpen() {
		if (!this.isOpen) {
			throw new Error('sqlite db is closed')
		}
	}

	private err(): Error {
		return new Error(host.interop.stringFromCString(host.sqlite3_errmsg(this.db)) || 'sqlite error')
	}

	// prepare → bind → step to completion → finalize. Rows are yielded through
	// `onRow` (object or array shape chosen by the caller).
	private run(sql: string, params: SqliteParam[], onRow?: (stmt: any, cols: number) => void): number {
		const ref = new host.interop.Reference()
		const rc = host.sqlite3_prepare_v2(this.db, sql, -1, ref, null)

		if (rc !== 0) {
			throw this.err()
		}

		const stmt = ref.value
		try {
			bind(stmt, params)
			const cols = host.sqlite3_column_count(stmt)
			let rows = 0

			while (true) {
				const step = host.sqlite3_step(stmt)

				if (step === SQLITE_ROW) {
					rows++
					onRow?.(stmt, cols)
				} else if (step === SQLITE_DONE) {
					return rows
				} else {
					throw this.err()
				}
			}
		} finally {
			host.sqlite3_finalize(stmt)
		}
	}

	execute = async (sql: string, params?: SqliteParams): Promise<void> => {
		this.ensureOpen()
		this.run(sql, toArray(params))
	}
	select = async <T = SqliteRow>(sql: string, params?: SqliteParams): Promise<T[]> => {
		this.ensureOpen()
		const rows: T[] = []

		this.run(sql, toArray(params), (stmt, cols) => {
			const row: Record<string, unknown> = {}
			for (let i = 0; i < cols; i++) {
				row[host.interop.stringFromCString(host.sqlite3_column_name(stmt, i))] = columnValue(stmt, i)
			}

			rows.push(row as T)
		})

		return rows
	}
	selectArray = async (sql: string, params?: SqliteParams) => {
		this.ensureOpen()
		const rows: any[][] = []

		this.run(sql, toArray(params), (stmt, cols) => {
			const row: any[] = []
			for (let i = 0; i < cols; i++) {
				row.push(columnValue(stmt, i))
			}

			rows.push(row)
		})

		return rows
	}
	get = async <T = SqliteRow>(sql: string, params?: SqliteParams): Promise<T | null> => {
		const rows = await this.select<T>(sql, params)
		return rows[0] ?? null
	}
	getArray = async (sql: string, params?: SqliteParams) => {
		const rows = await this.selectArray(sql, params)
		return rows[0] ?? null
	}
	transaction = async <T>(action: (db: SqliteDb) => Promise<T>): Promise<T> => {
		this.ensureOpen()
		this.run('BEGIN', [])
		try {
			const result = await action(this)
			this.run('COMMIT', [])
			return result
		} catch (error) {
			try {
				this.run('ROLLBACK', [])
			} catch {}

			throw error
		}
	}
	each = async (
		sql: string,
		params: SqliteParams,
		onRow: (error: Error | null, row: SqliteRow) => void,
		onDone: (error: Error | null, count: number) => void,
	) => {
		this.ensureOpen()
		let count = 0

		try {
			this.run(sql, toArray(params), (stmt, cols) => {
				const row: SqliteRow = {}
				for (let i = 0; i < cols; i++) {
					row[host.interop.stringFromCString(host.sqlite3_column_name(stmt, i))] = columnValue(stmt, i)
				}

				onRow(null, row)
				count++
			})
		} catch (error) {
			onDone(error as Error, count)
			throw error
		}

		onDone(null, count)
		return count
	}
	getUserVersion = async (): Promise<number> => {
		this.ensureOpen()
		return Number((await this.getArray('PRAGMA user_version'))?.[0] ?? 0)
	}
	setUserVersion = async (version: number): Promise<void> => {
		this.ensureOpen()
		this.run(`PRAGMA user_version = ${version | 0}`, [])
	}
	close = async () => {
		if (!this.isOpen) {
			return
		}

		this.isOpen = false
		host.sqlite3_close_v2(this.db)
	}
}

export const openDatabase = async (
	name: string,
	_options?: OpenDatabaseOptions,
): Promise<SqliteDb> => {
	ensureLib()

	const path = name === ':memory:' ? ':memory:' : databasePath(name)
	const ref = new host.interop.Reference()
	const rc = host.sqlite3_open(path ?? ':memory:', ref)

	if (rc !== 0) {
		const db = ref.value
		const message = db ? host.interop.stringFromCString(host.sqlite3_errmsg(db)) : `open failed (rc=${rc})`

		if (db) {
			host.sqlite3_close_v2(db)
		}

		throw new Error(`sqlite open failed: ${message}`)
	}

	const db = ref.value
	host.sqlite3_busy_timeout(db, 5000)
	return new MacosSqliteDb(db, path != null)
}

export const deleteDatabase = async (name: string): Promise<boolean> => {
	const path = databasePath(name)
	if (!path) {
		return false
	}

	let removed = false
	const fm = host.NSFileManager.defaultManager

	for (const suffix of ['', '-wal', '-shm', '-journal']) {
		const target = `${path}${suffix}`
		if (fs?.existsSync(target)) {
			removed = !!fm.removeItemAtPathError(target, null) || removed
		}
	}

	return removed
}
