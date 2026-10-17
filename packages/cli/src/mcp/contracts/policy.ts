// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
// Permission/policy contract — see policy.d.ts.

import { contractError } from './errors.ts'

export const PERMISSION_SCOPES = [
	'workspace',
	'runtime-actions',
	'visual-capture',
	'evidence-retain',
	'external-effects',
]

// Task authorization covers reading the workspace and ordinary development
// runtime actions only — never screenshots, retention, or external effects.
const TASK_AUTHORIZED_SCOPES = ['workspace', 'runtime-actions']

const GRANT_RECOVERY = {
	'visual-capture': {
		action: 'Ask the developer to approve visual capture for this task',
		detail:
			'The developer can grant it through the agent client approval prompt, or by starting the server with the visual-capture scope (e.g. XPLAT_MCP_PERMISSIONS=visual-capture).',
	},
	default: {
		action: 'Ask the developer to grant this permission for the current task',
	},
}

const expired = (grant) =>
	grant.expiresAt !== undefined && Date.parse(grant.expiresAt) <= Date.now()

export function createPolicyStore(options = {}) {
	const grants = new Map()
	let elicit = options.elicit

	if (options.taskAuthorization) {
		for (const scope of TASK_AUTHORIZED_SCOPES) {
			grants.set(scope, {
				scope,
				state: 'granted',
				source: 'task-authorization',
				grantedAt: new Date().toISOString(),
				revocable: false,
				note: 'Covered by the task authorization the developer already gave; not re-requested per tool call.',
			})
		}
	}

	for (const grant of options.grants ?? []) {
		grants.set(grant.scope, { revocable: true, ...grant })
	}

	const lookup = (scope) => {
		const grant = grants.get(scope)
		if (!grant || grant.state !== 'granted' || expired(grant)) {
			return null
		}

		return grant
	}

	const denied = (scope) => ({
		granted: false,
		error: contractError('permission_denied', `Permission "${scope}" has not been granted.`, {
			recovery: GRANT_RECOVERY[scope] ?? GRANT_RECOVERY.default,
			context: { scope, state: grants.get(scope)?.state ?? 'required' },
		}),
	})

	return {
		require(scope) {
			const grant = lookup(scope)
			return grant ? { granted: true, grant } : denied(scope)
		},

		async requestGrant(scope, reason) {
			const existing = lookup(scope)
			if (existing) {
				return { granted: true, grant: existing }
			}

			if (grants.get(scope)?.state === 'denied') {
				return denied(scope)
			}

			if (elicit) {
				const answer = await elicit(scope, reason)
				if (answer === 'granted') {
					const grant = this.grant(scope, {
						source: 'developer',
						note: reason,
					})

					return { granted: true, grant }
				}

				grants.set(scope, { scope, state: 'denied', revocable: true })
				return denied(scope)
			}

			// No channel to ask through: surface the requirement without pretending.
			if (!grants.has(scope)) {
				grants.set(scope, { scope, state: 'required', revocable: true })
			}

			return denied(scope)
		},

		grant(scope, extra = {}) {
			const grant = {
				scope,
				state: 'granted',
				source: 'developer',
				grantedAt: new Date().toISOString(),
				revocable: true,
				...extra,
			}

			grants.set(scope, grant)
			return grant
		},

		setElicitor(fn) {
			elicit = fn
		},

		revoke(scope) {
			const grant = grants.get(scope)
			if (!grant || grant.state !== 'granted' || !grant.revocable) {
				return false
			}

			grants.set(scope, { scope, state: 'denied', revocable: true })
			return true
		},

		list() {
			return PERMISSION_SCOPES.map(
				(scope) =>
					grants.get(scope) ?? {
						scope,
						state: 'required',
						revocable: true,
					},
			)
		},
	}
}
