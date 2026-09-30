/// <reference lib="webworker" />
/**
 * sqlite-wasm host. Runs inside a module Worker spawned by db.web.ts; the
 * client is a thin RPC layer so every API call is async on the JS side.
 *
 * Persistence preference order:
 *   1. installOpfsSAHPoolVfs — OPFS via sync access handles, needs a Worker
 *      but NOT cross-origin isolation (no COOP/COEP deployment constraint).
 *   2. OpfsDb — the older OPFS backend; requires crossOriginIsolated.
 *   3. oo1.DB('ct') — transient in-memory database.
 */
import sqlite3InitModule from '@sqlite.org/sqlite-wasm'
import wasmUrl from '@sqlite.org/sqlite-wasm/sqlite3.wasm?url'

type Sqlite3 = Awaited<ReturnType<typeof sqlite3InitModule>>
const sqlite3Promise = sqlite3InitModule({ locateFile: () => wasmUrl })

let db: any = null
let dbName = ''
let sahPool: any = null
let persistent = false

const normalizeParams = (params: any) =>
	params == null ? undefined : Array.isArray(params) ? params : [params]

const open = async (name: string) => {
	const sqlite3: Sqlite3 = await sqlite3Promise
	const file = name.startsWith('/') ? name : `/${name}`

	if (db) {
		db.close()
	}

	db = null
	sahPool ??=
		typeof (sqlite3 as any).installOpfsSAHPoolVfs === 'function'
			? await (sqlite3 as any).installOpfsSAHPoolVfs().catch(() => null)
			: null

	if (sahPool) {
		db = new sqlite3.oo1.DB(file, 'c', sahPool.vfsName)
		persistent = true
	} else if ('opfs' in sqlite3 && (sqlite3.oo1 as any).OpfsDb) {
		db = new (sqlite3.oo1 as any).OpfsDb(file)
		persistent = true
	} else {
		db = new sqlite3.oo1.DB(file, 'ct')
		persistent = false
	}

	dbName = file
	return { persistent, version: sqlite3.version.libVersion }
}

const deleteDb = async (name: string) => {
	const file = name.startsWith('/') ? name : `/${name}`

	if (db && dbName === file) {
		db.close()
		db = null
	}

	if (sahPool) {
		return Boolean(sahPool.unlink(file))
	}

	// OpfsDb path: best-effort removal of the OPFS entry.
	try {
		const root = await navigator.storage.getDirectory()
		await root.removeEntry(file.slice(1))
		return true
	} catch {
		return false
	}
}

const handlers: Record<string, (...args: any[]) => unknown> = {
	open,
	delete: deleteDb,
	execute: (sql: string, params?: any) => db.exec({ sql, bind: normalizeParams(params) }),
	select: (sql: string, params?: any) => db.selectObjects(sql, normalizeParams(params)),
	selectArray: (sql: string, params?: any) => db.selectArrays(sql, normalizeParams(params)),
	get: (sql: string, params?: any) => db.selectObjects(sql, normalizeParams(params))[0] ?? null,
	getArray: (sql: string, params?: any) => db.selectArrays(sql, normalizeParams(params))[0] ?? null,
	begin: () => db.exec('BEGIN'),
	commit: () => db.exec('COMMIT'),
	rollback: () => db.exec('ROLLBACK'),
	getUserVersion: () => db.selectValue('PRAGMA user_version'),
	setUserVersion: (version: number) => db.exec(`PRAGMA user_version = ${version | 0}`),
	close: () => {
		if (db) {
			db.close()
		}

		db = null
	},
}

self.onmessage = async (event: MessageEvent<{ id: number; op: string; args: any[] }>) => {
	const { id, op, args } = event.data

	try {
		const handler = handlers[op]

		if (!handler) {
			throw new Error(`unknown sqlite op: ${op}`)
		}

		if (!db && op !== 'open' && op !== 'delete') {
			throw new Error('sqlite db is not open')
		}

		const result = await handler(...args)

		;(self as any).postMessage({ id, result })
	} catch (error: any) {
		;(self as any).postMessage({ id, error: error?.message ?? String(error) })
	}
}
