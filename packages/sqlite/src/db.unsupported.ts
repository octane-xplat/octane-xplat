import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { OpenDatabaseOptions, SqliteDb } from './types'

export const supported = false

const unsupported = (): never => {
	throw new UnavailabilityError('sqlite')
}

export const openDatabase = (_name: string, _options?: OpenDatabaseOptions): Promise<SqliteDb> =>
	unsupported()

export const deleteDatabase = async (_name: string) => false
