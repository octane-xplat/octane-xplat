// Runtime MCP tools (work item D). Thin bindings over the runtime service —
// all session/job/ownership behavior lives in service.mjs and the shared
// contracts.

import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { PLATFORMS } from '../contracts/identity.ts'
import type { Respond, WorkspaceContext } from '../context.ts'
import type { Platform } from '../../types/contracts/identity'

export function registerRuntimeTools(
	server: McpServer,
	context: WorkspaceContext,
	respond: Respond,
) {
	const runtime = context.runtime

	server.registerTool(
		'xplat_targets',
		{
			description:
				'Discover launchable targets for the bound app: simulators, emulators, devices and host targets with availability, missing-toolchain reasons, and session busy/ownership state.',
			inputSchema: {
				platform: z
					.enum(PLATFORMS as Platform[])
					.optional()
					.describe('Limit to one platform'),
			},
		},
		async ({ platform }) => {
			const result = await runtime.listTargets({ platform })
			return result.error
				? respond({ ok: false, error: result.error })
				: respond({ ok: true, data: result })
		},
	)

	server.registerTool(
		'xplat_build',
		{
			description:
				'Build the bound app for one platform as a background job (the same commands `xplat build` runs). Returns a job id — poll xplat_job_status and read output with xplat_logs. Repeating with the same requestKey returns the live job instead of duplicating it.',
			inputSchema: {
				platform: z.enum(PLATFORMS as Platform[]),
				requestKey: z.string().optional().describe('Idempotence key for retries'),
			},
		},
		async ({ platform, requestKey }) => {
			const result = await runtime.build({ platform, requestKey })
			return result.error
				? respond({ ok: false, error: result.error })
				: respond({ ok: true, data: result })
		},
	)

	server.registerTool(
		'xplat_launch',
		{
			description:
				'Start an owned development session: bind one app to one target and run the platform dev command as a job. The job completes when readiness is confirmed — a failed launch after a successful build reports accurately, and the session keeps the app alive until xplat_session_end.',
			inputSchema: {
				platform: z.enum(PLATFORMS as Platform[]),
				targetId: z
					.string()
					.optional()
					.describe('Target from xplat_targets; required when several are available'),
				requestKey: z.string().optional().describe('Idempotence key for retries'),
				browserMode: z
					.enum(['headless', 'headed'])
					.optional()
					.describe(
						'Web only. Headed mode enables scoped OS keyboard input on qualified hosts; reserve desktop input before using it.',
					),
			},
		},
		async ({ platform, targetId, requestKey, browserMode }) => {
			const result = await runtime.launch({ platform, targetId, requestKey, browserMode })
			return result.error
				? respond({ ok: false, error: result.error })
				: respond({ ok: true, data: result })
		},
	)

	server.registerTool(
		'xplat_attach',
		{
			description:
				'Attach to a compatible development session that is already running — never restarts or terminates it. Reports candidates per platform; attach binds a preserved user-owned session.',
			inputSchema: {
				platform: z.enum(PLATFORMS as Platform[]),
				targetId: z
					.string()
					.optional()
					.describe('Candidate target; required when several are attachable'),
			},
		},
		async ({ platform, targetId }) => {
			const result = await runtime.attach({ platform, targetId })
			return result.error
				? respond({ ok: false, error: result.error })
				: respond({ ok: true, data: result })
		},
	)

	server.registerTool(
		'xplat_logs',
		{
			description:
				'Bounded, ordered log read for a session or build job. Cursor-paginated: pass the previous nextCursor to continue; truncated/dropped flags reveal gaps and reset marks a restarted capture. A stopped or disconnected session reports its capture as historical.',
			inputSchema: {
				sessionId: z.string().optional(),
				jobId: z.string().optional(),
				cursor: z.number().optional().describe('Continue after this record seq'),
				limit: z.number().int().positive().max(5000).optional(),
				stream: z.enum(['stdout', 'stderr', 'lifecycle']).optional(),
			},
		},
		async ({ sessionId, jobId, cursor, limit, stream }) => {
			if (!sessionId && !jobId) {
				return respond({
					ok: false,
					error: {
						code: 'invalid_selection',
						message: 'Pass a sessionId or a jobId.',
						recovery: { action: 'Use xplat_sessions or a build/launch job id.' },
					},
				})
			}

			const result = runtime.readLogs({ sessionId, jobId, cursor, limit, stream })
			return result.error
				? respond({ ok: false, error: result.error })
				: respond({ ok: true, data: result })
		},
	)
}
