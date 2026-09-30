import type { OpenDatabaseOptions, SqliteDb, SqliteParams, SqliteRow } from './types'

export const supported = true

type Pending = { resolve: (value: any) => void; reject: (error: Error) => void }
const pending = new Map<number, Pending>()
let nextId = 0
let worker: Worker | null = null

const ensureWorker = (): Worker => {
	if (!worker) {
		// Bundled by the consuming app's vite build (lib-mode workers are not
		// emitted here — the leaf ships source). The wasm asset rides along via
		// the ?url import inside the worker module.
		worker = new Worker(new URL('./worker.web.ts', import.meta.url), { type: 'module' })
		worker.onmessage = (event: MessageEvent<{ id: number; result?: unknown; error?: string }>) => {
			const { id, result, error } = event.data
			const entry = pending.get(id)

			if (!entry) {
				return
			}

			pending.delete(id)
			if (error != null) {
				entry.reject(new Error(error))
			} else {
				entry.resolve(result)
			}
		}
	}

	return worker
}

const call = <T>(op: string, ...args: unknown[]): Promise<T> =>
	new Promise((resolve, reject) => {
		const id = ++nextId
		pending.set(id, { resolve, reject })
		ensureWorker().postMessage({ id, op, args })
	})

class WebSqliteDb implements SqliteDb {
	isOpen = true
	constructor(readonly persistent: boolean) {}
	private ensureOpen() {
		if (!this.isOpen) {
			throw new Error('sqlite db is closed')
		}
	}
	execute = (sql: string, params?: SqliteParams) => {
		this.ensureOpen()
		return call<void>('execute', sql, params ?? null)
	}
	select = <T = SqliteRow>(sql: string, params?: SqliteParams): Promise<T[]> => {
		this.ensureOpen()
		return call<T[]>('select', sql, params ?? null)
	}
	selectArray = (sql: string, params?: SqliteParams) => {
		this.ensureOpen()
		return call<any[]>('selectArray', sql, params ?? null)
	}
	get = <T = SqliteRow>(sql: string, params?: SqliteParams): Promise<T | null> => {
		this.ensureOpen()
		return call<T | null>('get', sql, params ?? null)
	}
	getArray = (sql: string, params?: SqliteParams) => {
		this.ensureOpen()
		return call<any[] | null>('getArray', sql, params ?? null)
	}
	// Messages are serialized on the single worker-side connection, so the
	// BEGIN…COMMIT window can span several RPC calls safely.
	transaction = async <T>(action: (db: SqliteDb) => Promise<T>): Promise<T> => {
		this.ensureOpen()
		await call('begin')
		try {
			const result = await action(this)
			await call('commit')
			return result
		} catch (error) {
			await call('rollback').catch(() => {})
			throw error
		}
	}
	each = async (
		sql: string,
		params: SqliteParams,
		onRow: (error: Error | null, row: SqliteRow) => void,
		onDone: (error: Error | null, count: number) => void,
	) => {
		// Row callbacks can't stream back over postMessage cheaply for v1 —
		// select then iterate. The contract is identical, the memory isn't.
		const rows = await this.select(sql, params)

		for (const row of rows) {
			onRow(null, row)
		}

		onDone(null, rows.length)
		return rows.length
	}
	getUserVersion = () => {
		this.ensureOpen()
		return call<number>('getUserVersion')
	}
	setUserVersion = (version: number) => {
		this.ensureOpen()
		return call<void>('setUserVersion', version | 0)
	}
	close = async () => {
		if (!this.isOpen) {
			return
		}

		this.isOpen = false
		await call('close').catch(() => {})
	}
}

export const openDatabase = async (
	name: string,
	_options?: OpenDatabaseOptions,
): Promise<SqliteDb> => {
	const result = await call<{ persistent: boolean }>('open', name)
	return new WebSqliteDb(result.persistent)
}

export const deleteDatabase = async (name: string) => call<boolean>('delete', name)
