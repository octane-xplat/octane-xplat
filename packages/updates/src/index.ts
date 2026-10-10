import type { UpdatesClient, UpdatesOptions } from './types'
import { createClient } from './client'
import { nativeEnvironment } from './native.mobile'
import { unsupportedClient } from './unsupported'
export type {
	UpdatesClient,
	UpdatesOptions,
	UpdatesStatus,
	UpdateManifest,
	UpdateCheck,
} from './types'

let instance: UpdatesClient | undefined
/** Create the process's native updater. Call markHealthy after successful app startup. */
export function createUpdates(options: UpdatesOptions): UpdatesClient {
	if (instance) {
		throw new Error('Create only one updates client per app process')
	}

	const environment = nativeEnvironment()
	instance =
		environment.releaseBuild === false
			? unsupportedClient(options)
			: createClient(options, environment)

	return instance
}
