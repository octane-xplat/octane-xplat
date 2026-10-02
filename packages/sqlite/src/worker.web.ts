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

type DatabaseHandle = { db: any; name: string; persistent: boolean }
const databases = new Map<number, DatabaseHandle>()
let nextDatabaseId = 0
let sahPoolPromise: Promise<any> | null = null

const getSahPool = (sqlite3: Sqlite3) => {
	sahPoolPromise ??= Promise.resolve()
		.then(() =>
			typeof (sqlite3 as any).installOpfsSAHPoolVfs === 'function'
				? (sqlite3 as any).installOpfsSAHPoolVfs()
				: null,
		)
		.catch(() => null)

	return sahPoolPromise
}

const database = (id: number) => {
	const entry = databases.get(id)
	if (!entry) {
		throw new Error(`sqlite db handle ${id} is not open`)
	}

	return entry
}

const normalizeParams = (params: any) =>
	params == null ? undefined : Array.isArray(params) ? params : [params]

const open = async (name: string) => {
	const sqlite3: Sqlite3 = await sqlite3Promise
	const file = name.startsWith('/') ? name : `/${name}`
	const sahPool = await getSahPool(sqlite3)

	let db: any
	let persistent = false
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

	const databaseId = ++nextDatabaseId
	databases.set(databaseId, { db, name: file, persistent })
	return { databaseId, persistent, version: sqlite3.version.libVersion }
}

const deleteDb = async (name: string) => {
	const file = name.startsWith('/') ? name : `/${name}`
	const databaseIds: number[] = []

	for (const [id, entry] of databases) {
		if (entry.name === file) {
			entry.db.close()
			databases.delete(id)
			databaseIds.push(id)
		}
	}

	const sahPool = sahPoolPromise ? await sahPoolPromise : null
	if (sahPool) {
		return { deleted: Boolean(sahPool.unlink(file)), databaseIds }
	}

	// OpfsDb path: best-effort removal of the OPFS entry.
	try {
		const root = await navigator.storage.getDirectory()
		await root.removeEntry(file.slice(1))
		return { deleted: true, databaseIds }
	} catch {
		return { deleted: false, databaseIds }
	}
}

const handlers: Record<string, (...args: any[]) => unknown> = {
	open,
	delete: deleteDb,
	execute: (id: number, sql: string, params?: any) =>
		database(id).db.exec({ sql, bind: normalizeParams(params) }),
	select: (id: number, sql: string, params?: any) =>
		database(id).db.selectObjects(sql, normalizeParams(params)),
	selectArray: (id: number, sql: string, params?: any) =>
		database(id).db.selectArrays(sql, normalizeParams(params)),
	get: (id: number, sql: string, params?: any) =>
		database(id).db.selectObjects(sql, normalizeParams(params))[0] ?? null,
	getArray: (id: number, sql: string, params?: any) =>
		database(id).db.selectArrays(sql, normalizeParams(params))[0] ?? null,
	begin: (id: number) => database(id).db.exec('BEGIN'),
	commit: (id: number) => database(id).db.exec('COMMIT'),
	rollback: (id: number) => database(id).db.exec('ROLLBACK'),
	getUserVersion: (id: number) => database(id).db.selectValue('PRAGMA user_version'),
	setUserVersion: (id: number, version: number) =>
		database(id).db.exec(`PRAGMA user_version = ${version | 0}`),
	close: (id: number) => {
		const entry = databases.get(id)
		if (!entry) {
			return
		}

		entry.db.close()
		databases.delete(id)
	},
}

self.onmessage = async (event: MessageEvent<{ id: number; op: string; args: any[] }>) => {
	const { id, op, args } = event.data

	try {
		const handler = handlers[op]

		if (!handler) {
			throw new Error(`unknown sqlite op: ${op}`)
		}

		const result = await handler(...args)

		;(self as any).postMessage({ id, result })
	} catch (error: any) {
		;(self as any).postMessage({ id, error: error?.message ?? String(error) })
	}
}
