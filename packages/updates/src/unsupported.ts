import type { UpdatesClient, UpdatesOptions } from './types'

export function unsupportedClient(options: UpdatesOptions): UpdatesClient {
	const unsupported = () => {
		throw new Error('Native OTA updates require an iOS or Android release build')
	}

	return {
		supported: false,
		check: async () => ({ available: false, reason: 'unsupported' }),
		install: async () => unsupported(),
		markHealthy: unsupported,
		rollback: unsupported,
		status: () => ({
			currentVersion: options.embeddedVersion,
			stagedVersion: null,
			needsConfirmation: false,
		}),
	}
}
