// Runtime service over the Go `xplat ... --json` agent commands. The Go dev
// server owns targets, observed sessions and diagnostics; this adapter only
// translates MCP tool arguments into contract envelopes. Agent-owned launch,
// build jobs and session end were removed from the agent command contract —
// the matching tools report `unavailable` with the supported path.

import { contractError } from '../contracts/errors.ts'
import type { RuntimeService, WorkspaceContext } from '../context.ts'
import type { ToolOutcome } from '../../types/contracts/errors'

const unsupported = (capability: string, action: string): ToolOutcome<never> => ({
	ok: false,
	error: contractError('unsupported_capability', `Agent-owned ${capability} is not part of the current agent contract.`, {
		recovery: { action },
	}),
})

export function createRuntimeService(context: WorkspaceContext): RuntimeService {
	const call = context.transport.call

	return {
		listTargets: ({ platform }) =>
			call({ command: ['targets'], flags: { platform } }),

		build: async () =>
			unsupported(
				'build jobs',
				'Run `xplat build` — builds remain explicit foreground commands, not agent-owned jobs.',
			),

		launch: async () =>
			unsupported(
				'launch',
				'Start the app\'s dev server with `xplat dev`, connect the app, then bind it with xplat_attach.',
			),

		listSessions: () => call({ command: ['session', 'list'] }),

		sessionStatus: (sessionId) =>
			call({ command: ['session', 'status'], positionals: [sessionId] }),

		attach: async ({ platform, targetId }) => {
			const permission = await context.policy.require('runtime-actions')
			if (!permission.granted) {
				return { ok: false, error: permission.error }
			}
			return call({
				command: ['session', 'attach'],
				flags: { platform, target: targetId },
			})
		},

		readDiagnostics: (args) =>
			call({
				command: ['diagnostics'],
				flags: {
					report: args.reportId,
					platform: args.platform,
					session: args.sessionId,
					job: args.jobId,
					cursor: args.cursor,
					limit: args.limit,
					stream: args.stream,
				},
			}),

		endSession: async () =>
			unsupported(
				'session end',
				'Sessions observe apps connected to `xplat dev`; observers detach by disconnecting — the app keeps running.',
			),

		endAll: async () => ({ ok: true, data: { ended: [] } }),
	}
}
