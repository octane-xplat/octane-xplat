// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
// Capability matrix contract — see capabilities.d.ts.

export const CAPABILITY_IDS = [
	'project_status',
	'guidance',
	'docs',
	'code_search',
	'target_discovery',
	'build',
	'launch',
	'attach',
	'logs',
	'job_control',
	'ui_inspection',
	'screenshot',
	'interaction',
	'dev_actions',
	'session_end',
	'evidence',
]

// Server-side capabilities this package implements itself — supported on every
// platform because they need no runtime adapter.
const SERVER_SIDE = new Set(['project_status', 'job_control', 'session_end', 'evidence'])

const RUNTIME_ALTERNATIVES = {
	web: {
		description: 'Run the app and check it yourself with the Xplat CLI.',
		command: 'xplat dev --target web',
	},
	ios: {
		description: 'Run the app and check it yourself with the Xplat CLI.',
		command: 'xplat dev --target ios',
	},
	android: {
		description: 'Run the app and check it yourself with the Xplat CLI.',
		command: 'xplat dev --target android',
	},
	macos: {
		description: 'Run the app and check it yourself with the Xplat CLI.',
		command: 'xplat dev --target macos',
	},
	linux: {
		description: 'Run the app and check it yourself with the Xplat CLI.',
		command: 'xplat dev --target linux',
	},
	windows: {
		description: 'Run the app and check it yourself with the Xplat CLI.',
		command: 'xplat dev --target windows',
	},
}

/**
 * The honest default for every capability on a platform: server-side tools are
 * supported; everything needing a runtime/retrieval adapter is `unavailable`
 * with an actionable alternative until a provider registers.
 */
export function defaultCapabilityEntry(capability, platform) {
	if (SERVER_SIDE.has(capability)) {
		return { capability, status: 'supported' }
	}

	if (capability === 'guidance') {
		return {
			capability,
			status: 'partial',
			detail:
				'Project guidance sources are reported by project status; tailored guidance retrieval arrives with the documentation provider.',
		}
	}

	const entry = {
		capability,
		status: 'unavailable',
		detail: `No ${capability.replace(/_/g, ' ')} provider is registered for this platform yet.`,
		alternative: RUNTIME_ALTERNATIVES[platform],
	}

	if (capability === 'screenshot') {
		// Even once a provider exists, capture stays gated on an explicit
		// per-task visual approval — the capability exists but is never implied.
		entry.requiresPermission = 'visual-capture'
		entry.detail += ' Capture requires explicit per-task developer approval when supported.'
	}

	if (capability === 'docs' || capability === 'code_search') {
		delete entry.alternative
	}

	return entry
}

export function createCapabilityRegistry() {
	const providers = new Map()

	return {
		register(provider) {
			providers.set(provider.platform, [...(providers.get(provider.platform) ?? []), provider])
		},

		async matrixFor(app, platforms) {
			const matrices = []
			for (const platform of platforms) {
				const declared = app ? app.platforms.includes(platform) : false
				const merged = new Map(
					CAPABILITY_IDS.map((id) => [id, defaultCapabilityEntry(id, platform)]),
				)

				if (app) {
					for (const provider of providers.get(platform) ?? []) {
						for (const entry of await provider.describe(app)) {
							merged.set(entry.capability, entry)
						}
					}
				}

				matrices.push({
					platform,
					declared,
					capabilities: [...merged.values()],
				})
			}

			return matrices
		},
	}
}
