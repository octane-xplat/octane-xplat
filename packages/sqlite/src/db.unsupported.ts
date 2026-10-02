import type { OpenDatabaseOptions, SqliteDb } from './types'

export const supported = false

const unsupported = (name: string): never => {
	throw new Error(
		`@octane-xplat/sqlite is not supported on this platform yet (${name} not opened).`,
	)
}

export const openDatabase = (_name: string, _options?: OpenDatabaseOptions): Promise<SqliteDb> =>
	unsupported(_name)

export const deleteDatabase = async (_name: string) => false
