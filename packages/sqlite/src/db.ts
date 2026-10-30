import { isolateDatabase } from './operation-queue'
import { knownFolders } from '@nativescript/core'
import {
	deleteDatabase as deleteNativeDatabase,
	openOrCreate,
	type SQLiteDatabase,
} from '@nativescript-community/sqlite'

import type { OpenDatabaseOptions, SqliteDb, SqliteParams, SqliteRow } from './types'

export const supported = true

const resolvePath = (name: string) =>
	name.includes('/') ? name : knownFolders.documents().getFile(name).path

class NativeSqliteDb implements SqliteDb {
	readonly persistent = true
	constructor(private readonly db: SQLiteDatabase) {}
	get isOpen() {
		return this.db.isOpen
	}
	execute = async (sql: string, params?: SqliteParams): Promise<void> => {
		await this.db.execute(sql, params)
	}
	select = <T = SqliteRow>(sql: string, params?: SqliteParams): Promise<T[]> =>
		this.db.select(sql, params) as Promise<T[]>
	selectArray = (sql: string, params?: SqliteParams) => this.db.selectArray(sql, params)
	// The plugin's getRaw reads resultDictionary before s.next() — get/getArray
	// crash on iOS. select(selectN)[0] is the same contract, working code.
	get = async <T = SqliteRow>(sql: string, params?: SqliteParams): Promise<T | null> =>
		((await this.db.select(sql, params)) as T[])[0] ?? null
	getArray = async (sql: string, params?: SqliteParams) =>
		(await this.db.selectArray(sql, params))[0] ?? null
	transaction = <T>(action: (db: SqliteDb) => Promise<T>): Promise<T> =>
		this.db.transaction(() => action(this))
	each = (
		sql: string,
		params: SqliteParams,
		onRow: (error: Error | null, row: SqliteRow) => void,
		onDone: (error: Error | null, count: number) => void,
	): Promise<number> => this.db.each(sql, params, onRow, onDone)
	getUserVersion = () => this.db.getVersion()
	setUserVersion = async (version: number) => {
		await this.db.setVersion(version)
	}
	close = async () => {
		await this.db.close()
	}
}

export const openDatabase = async (
	name: string,
	options?: OpenDatabaseOptions,
): Promise<SqliteDb> =>
	isolateDatabase(
		new NativeSqliteDb(openOrCreate(resolvePath(name), { threading: options?.threading ?? true })),
	)

export const deleteDatabase = async (name: string): Promise<boolean> =>
	deleteNativeDatabase(resolvePath(name))
