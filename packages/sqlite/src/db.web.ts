import type { OpenDatabaseOptions, SqliteDb, SqliteParams, SqliteRow } from './types'

export const supported = true

type Pending = { resolve: (value: any) => void; reject: (error: Error) => void }
const pending = new Map<number, Pending>()
const openDatabases = new Map<number, WebSqliteDb>()
let nextId = 0
let worker: Worker | null = null
let workerGeneration = 0

const toError = (reason: unknown) =>
	reason instanceof Error ? reason : new Error(String(reason))

const failWorker = (instance: Worker, error: Error) => {
	if (worker !== instance) {
		return
	}

	worker = null
	workerGeneration++
	instance.terminate()
	openDatabases.clear()
	for (const [id, entry] of pending) {
		pending.delete(id)
		entry.reject(error)
	}
}

const ensureWorker = (): Worker => {
	if (!worker) {
		// Bundled by the consuming app's vite build (lib-mode workers are not
		// emitted here — the leaf ships source). The wasm asset rides along via
		// the ?url import inside the worker module.
		const instance = new Worker(new URL('./worker.web.ts', import.meta.url), { type: 'module' })
		worker = instance
		instance.onmessage = (event: MessageEvent<{ id: number; result?: unknown; error?: string }>) => {
			if (worker !== instance) {
				return
			}

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

		instance.onerror = (event) => {
			event.preventDefault()
			failWorker(
				instance,
				new Error(`sqlite Web worker failed: ${event.message || 'startup or runtime error'}`),
			)
		}

		instance.onmessageerror = () => {
			failWorker(instance, new Error('sqlite Web worker sent an unreadable response'))
		}

		return instance
	}

	return worker
}

const call = <T>(op: string, ...args: unknown[]): Promise<T> =>
	new Promise((resolve, reject) => {
		const id = ++nextId
		pending.set(id, { resolve, reject })
		try {
			ensureWorker().postMessage({ id, op, args })
		} catch (error) {
			pending.delete(id)
			reject(toError(error))
		}
	})

class WebSqliteDb implements SqliteDb {
	private closed = false
	constructor(
		private readonly databaseId: number,
		readonly persistent: boolean,
		private readonly generation: number,
	) {}
	get isOpen() {
		return !this.closed && this.generation === workerGeneration
	}
	private ensureOpen() {
		if (!this.isOpen) {
			throw new Error('sqlite db is closed')
		}
	}
	invalidate() {
		this.closed = true
	}
	execute = (sql: string, params?: SqliteParams) => {
		this.ensureOpen()
		return call<void>('execute', this.databaseId, sql, params ?? null)
	}
	select = <T = SqliteRow>(sql: string, params?: SqliteParams): Promise<T[]> => {
		this.ensureOpen()
		return call<T[]>('select', this.databaseId, sql, params ?? null)
	}
	selectArray = (sql: string, params?: SqliteParams) => {
		this.ensureOpen()
		return call<any[]>('selectArray', this.databaseId, sql, params ?? null)
	}
	get = <T = SqliteRow>(sql: string, params?: SqliteParams): Promise<T | null> => {
		this.ensureOpen()
		return call<T | null>('get', this.databaseId, sql, params ?? null)
	}
	getArray = (sql: string, params?: SqliteParams) => {
		this.ensureOpen()
		return call<any[] | null>('getArray', this.databaseId, sql, params ?? null)
	}
	// Messages are serialized on the single worker-side connection, so the
	// BEGIN…COMMIT window can span several RPC calls safely.
	transaction = async <T>(action: (db: SqliteDb) => Promise<T>): Promise<T> => {
		this.ensureOpen()
		await call('begin', this.databaseId)
		try {
			const result = await action(this)
			await call('commit', this.databaseId)
			return result
		} catch (error) {
			await call('rollback', this.databaseId).catch(() => {})
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
		return call<number>('getUserVersion', this.databaseId)
	}
	setUserVersion = (version: number) => {
		this.ensureOpen()
		return call<void>('setUserVersion', this.databaseId, version | 0)
	}
	close = async () => {
		if (!this.isOpen) {
			return
		}

		this.closed = true
		openDatabases.delete(this.databaseId)
		await call('close', this.databaseId).catch(() => {})
	}
}

export const openDatabase = async (
	name: string,
	_options?: OpenDatabaseOptions,
): Promise<SqliteDb> => {
	const generation = workerGeneration
	const result = await call<{ databaseId: number; persistent: boolean }>('open', name)
	if (generation !== workerGeneration) {
		throw new Error('sqlite Web worker failed while opening the database')
	}

	const db = new WebSqliteDb(result.databaseId, result.persistent, generation)
	openDatabases.set(result.databaseId, db)
	return db
}

export const deleteDatabase = async (name: string) => {
	const result = await call<{ deleted: boolean; databaseIds: number[] }>('delete', name)
	for (const databaseId of result.databaseIds) {
		openDatabases.get(databaseId)?.invalidate()
		openDatabases.delete(databaseId)
	}

	return result.deleted
}
