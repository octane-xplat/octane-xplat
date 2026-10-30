import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { OpenDatabaseOptions, SqliteDb } from './types'

/** False on this platform — openDatabase rejects with UnavailabilityError. */
export const supported = false

const unsupported = (): never => {
	throw new UnavailabilityError('sqlite')
}

/** Open (or create) a database by name — a bare name resolves to the
 *  app's documents directory on native. */
export const openDatabase = (_name: string, _options?: OpenDatabaseOptions): Promise<SqliteDb> =>
	unsupported()

/** Delete a database file by name; resolves false when nothing matched. */
export const deleteDatabase = async (_name: string): Promise<boolean> => false
