import { unsupportedClient } from './unsupported.ts'
import type { UpdatesClient, UpdatesOptions } from './types'
export type {
	UpdatesClient,
	UpdatesOptions,
	UpdatesStatus,
	UpdateManifest,
	UpdateCheck,
} from './types'

/** Create an updater. macOS has no OTA boot wiring — check supported first. */
export function createUpdates(options: UpdatesOptions): UpdatesClient {
	return unsupportedClient(options)
}
