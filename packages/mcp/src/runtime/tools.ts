// Runtime MCP tools. Thin bindings over the runtime service — the Go
// `xplat ... --json` agent commands own session/target behavior; tools the
// contract no longer covers report `unavailable`/`unsupported_capability`.

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

      return respond(result)
    },
  )

  server.registerTool(
    'xplat_build',
    {
      description:
        'Build the bound app for one platform. Agent-owned build jobs were removed from the contract — this tool reports the boundary and points at the `xplat build` foreground command.',
      inputSchema: {
        platform: z.enum(PLATFORMS as Platform[]),
        requestKey: z.string().optional().describe('Idempotence key for retries'),
      },
    },
    async ({ platform, requestKey }) => {
      const result = await runtime.build({ platform, requestKey })

      return respond(result)
    },
  )

  server.registerTool(
    'xplat_launch',
    {
      description:
        'Start an owned development session. Agent-owned launch was removed from the contract — this tool reports the boundary: run `xplat dev`, connect the app, then bind it with xplat_attach.',
      inputSchema: {
        target: z
          .string()
          .optional()
          .describe(
            'Exact discovered target id or platform name; omit only when one eligible target exists',
          ),
        requestKey: z.string().optional().describe('Idempotence key for retries'),
        browserMode: z
          .enum(['headless', 'headed'])
          .optional()
          .describe(
            'Web only. Headed mode enables scoped OS keyboard input on qualified hosts; reserve desktop input before using it.',
          ),
      },
    },
    async ({ target, requestKey, browserMode }) => {
      const result = await runtime.launch({ target, requestKey, browserMode })

      return respond(result)
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

      return respond(result)
    },
  )

  server.registerTool(
    'xplat_diagnostics',
    {
      description:
        'List retained sessions or read logs and existing native report summaries. Log cursors do not page reports; reportId with sessionId reads a retained original. Session selectors include retained logs and native reports; standalone build jobs have log captures only.',
      inputSchema: {
        reportId: z.string().optional(),
        platform: z.enum(PLATFORMS as Platform[]).optional(),
        sessionId: z.string().optional(),
        jobId: z.string().optional(),
        cursor: z.number().int().nonnegative().optional(),
        limit: z.number().int().positive().max(5000).optional(),
        stream: z.enum(['stdout', 'stderr', 'lifecycle']).optional(),
      },
    },
    async (args) => {
      const result = await runtime.readDiagnostics(args)

      return respond(result)
    },
  )
}
