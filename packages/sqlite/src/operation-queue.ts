import type { SqliteDb, SqliteParams, SqliteRow } from './types'

function operationQueue() {
	let tail: Promise<void> = Promise.resolve()
	return {
		run<T>(operation: () => Promise<T>): Promise<T> {
			const result = tail.then(operation)
			tail = result.then(() => {}, () => {})
			return result
		},
		drain: () => tail,
	}
}

type Schedule = <T>(operation: () => Promise<T>) => Promise<T>

function handle(
	db: SqliteDb,
	schedule: Schedule,
	active: () => boolean,
	transaction: SqliteDb['transaction'],
	allowClose: boolean,
): SqliteDb {
	const run: Schedule = (operation) => active()
		? schedule(operation)
		: Promise.reject(new Error('sqlite transaction handle has expired'))
	return {
		get isOpen() { return active() && db.isOpen },
		get persistent() { return db.persistent },
		execute: (sql, params) => run(() => db.execute(sql, params)),
		select: <T = SqliteRow>(sql: string, params?: SqliteParams) => run(() => db.select<T>(sql, params)),
		selectArray: (sql, params) => run(() => db.selectArray(sql, params)),
		get: <T = SqliteRow>(sql: string, params?: SqliteParams) => run(() => db.get<T>(sql, params)),
		getArray: (sql, params) => run(() => db.getArray(sql, params)),
		each: (sql, params, onRow, onDone) => run(() => db.each(sql, params, onRow, onDone)),
		getUserVersion: () => run(() => db.getUserVersion()),
		setUserVersion: (version) => run(() => db.setUserVersion(version)),
		transaction,
		close: () => allowClose ? run(() => db.close()) : Promise.reject(new Error('sqlite cannot close a transaction handle')),
	}
}

/** Internal connection boundary shared by every supported backend. */
export function isolateDatabase(db: SqliteDb): SqliteDb {
	const queue = operationQueue()
	return handle(db, queue.run, () => true, (action) => queue.run(() => db.transaction(async (backend) => {
		let active = true
		const owned = operationQueue()
		const scoped = handle(backend, owned.run, () => active,
			() => Promise.reject(new Error('sqlite nested transactions are not supported')), false)
		try {
			return await action(scoped)
		} finally {
			active = false
			// Already-issued operations must finish before commit or rollback,
			// even if the callback exits before awaiting all of its work.
			await owned.drain()
		}
	})), true)
}
