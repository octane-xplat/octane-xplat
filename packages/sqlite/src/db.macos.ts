/**
 * macOS (AppKit/JSC host) backend: sqlite-wasm running in-process.
 *
 * The host's ObjC interop cannot reach libsqlite3 — its C-function metadata
 * covers AppKit/Foundation/CommonCrypto only and there is no dlopen/dlsym
 * seam — so the leaf compiles the bundled sqlite3.wasm directly instead.
 * Async WebAssembly.instantiate never resolves in this host, so the module is
 * built synchronously via the Emscripten instantiateWasm hook.
 *
 * Persistence is a whole-db snapshot: the file is deserialized into an
 * in-memory db at open and serialized back out at durability boundaries
 * (transaction commit, setUserVersion, close). Crash between boundaries loses
 * unflushed writes — documented in known-limits.
 */
import './env.macos'
import sqlite3InitModule from '@sqlite.org/sqlite-wasm'
// Inlined as a data: URI by the macOS app build (assetsInlineLimit in
// apps/macos/vite.shared.mjs) — ?inline is not honored for wasm by
// rolldown-vite, and the host has no URL/asset fetching anyway.
import wasmDataUri from '@sqlite.org/sqlite-wasm/sqlite3.wasm?url'

import type { OpenDatabaseOptions, SqliteDb, SqliteParams, SqliteRow } from './types'

export const supported = true

type Sqlite3 = Awaited<ReturnType<typeof sqlite3InitModule>>

const host = globalThis as any
const fs = host.require?.('node:fs')

const normalizeParams = (params?: SqliteParams) =>
	params == null ? undefined : Array.isArray(params) ? params : [params]

const decodeWasm = (): ArrayBuffer => {
	const base64 = String(wasmDataUri)
	const data = host.NSData.alloc().initWithBase64EncodedStringOptions(
		base64.slice(base64.indexOf(',') + 1),
		0,
	)

	if (!data) {
		throw new Error('sqlite3.wasm failed to decode')
	}

	return host.interop.bufferFromData(data)
}

let sqliteReady: Promise<Sqlite3> | null = null

const init = (): Promise<Sqlite3> => {
	if (!sqliteReady) {
		const wasmBinary = decodeWasm()
		const wasmModule = new WebAssembly.Module(wasmBinary)

		sqliteReady = sqlite3InitModule({
			wasmBinary,
			locateFile: (name: string) => name,
			// Async WebAssembly.instantiate is never drained by the host run
			// loop — compile and instantiate synchronously instead.
			instantiateWasm(imports: WebAssembly.Imports, done: (instance: WebAssembly.Instance, module: WebAssembly.Module) => void) {
				const instance = new WebAssembly.Instance(wasmModule, imports)
				done(instance, wasmModule)
				return instance.exports
			},
			print() {},
			printErr: (message: string) => console.error(message),
		} as any)
	}

	return sqliteReady
}

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
	const dir = databaseDir()
	if (!dir || !fs) {
		return null
	}

	try {
		fs.mkdirSync(dir)
	} catch {}

	return `${dir}/${name.replace(/[^\w.-]/g, '_')}.sqlite3`
}

const loadSnapshot = (sqlite3: Sqlite3, db: any, path: string) => {
	if (!fs.existsSync(path)) {
		return
	}

	const bytes = new Uint8Array(host.interop.bufferFromData(fs.readFileSync(path)))
	if (!bytes.length) {
		return
	}

	const pointer = sqlite3.wasm.alloc(bytes.length)
	sqlite3.wasm.heap8u().set(bytes, pointer)
	const rc = sqlite3.capi.sqlite3_deserialize(
		db.pointer,
		'main',
		pointer,
		bytes.length,
		bytes.length,
		sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE | sqlite3.capi.SQLITE_DESERIALIZE_RESIZEABLE,
	)

	if (rc) {
		throw new Error(`sqlite3_deserialize failed (rc=${rc}) for ${path}`)
	}
}

class MacosSqliteDb implements SqliteDb {
	isOpen = true
	constructor(
		private readonly sqlite3: Sqlite3,
		private readonly db: any,
		private readonly path: string | null,
	) {}

	get persistent() {
		return this.path != null
	}

	private ensureOpen() {
		if (!this.isOpen) {
			throw new Error('sqlite db is closed')
		}
	}

	// Snapshot durability boundary — copies out of the wasm heap before the
	// ObjC marshal (bridge wedges on heap-backed views, same as env.macos).
	private flush() {
		if (!this.path) {
			return
		}

		const bytes = this.sqlite3.capi.sqlite3_js_db_export(this.db.pointer).slice()
		const data = host.NSData.alloc().initWithBytesLength(bytes, bytes.length)
		fs.writeFileSync(this.path, data)
	}

	execute = async (sql: string, params?: SqliteParams): Promise<void> => {
		this.ensureOpen()
		this.db.exec({ sql, bind: normalizeParams(params) })
	}
	select = async <T = SqliteRow>(sql: string, params?: SqliteParams): Promise<T[]> => {
		this.ensureOpen()
		return this.db.selectObjects(sql, normalizeParams(params)) as T[]
	}
	selectArray = async (sql: string, params?: SqliteParams) => {
		this.ensureOpen()
		return this.db.selectArrays(sql, normalizeParams(params))
	}
	get = async <T = SqliteRow>(sql: string, params?: SqliteParams): Promise<T | null> => {
		this.ensureOpen()
		return (this.db.selectObject(sql, normalizeParams(params)) ?? null) as T | null
	}
	getArray = async (sql: string, params?: SqliteParams) => {
		this.ensureOpen()
		return this.db.selectArray(sql, normalizeParams(params)) ?? null
	}
	transaction = async <T>(action: (db: SqliteDb) => Promise<T>): Promise<T> => {
		this.ensureOpen()
		this.db.exec('BEGIN')
		try {
			const result = await action(this)
			this.db.exec('COMMIT')
			this.flush()
			return result
		} catch (error) {
			try {
				this.db.exec('ROLLBACK')
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
		const rows = await this.select(sql, params)

		for (const row of rows) {
			onRow(null, row)
		}

		onDone(null, rows.length)
		return rows.length
	}
	getUserVersion = async (): Promise<number> => {
		this.ensureOpen()
		return this.db.selectValue('PRAGMA user_version') as number
	}
	setUserVersion = async (version: number): Promise<void> => {
		this.ensureOpen()
		this.db.exec(`PRAGMA user_version = ${version | 0}`)
		this.flush()
	}
	close = async () => {
		if (!this.isOpen) {
			return
		}

		this.isOpen = false
		try {
			this.flush()
		} finally {
			this.db.close()
		}
	}
}

export const openDatabase = async (
	name: string,
	_options?: OpenDatabaseOptions,
): Promise<SqliteDb> => {
	const sqlite3 = await init()
	const path = databasePath(name)
	const db = new sqlite3.oo1.DB(':memory:')

	if (path) {
		try {
			loadSnapshot(sqlite3, db, path)
		} catch (error) {
			db.close()
			throw error
		}
	}

	return new MacosSqliteDb(sqlite3, db, path)
}

export const deleteDatabase = async (name: string): Promise<boolean> => {
	const path = databasePath(name)
	if (!path || !fs?.existsSync(path)) {
		return false
	}

	return !!host.NSFileManager.defaultManager.removeItemAtPathError(path, null)
}
