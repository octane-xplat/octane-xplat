// Workspace context + project-status report builder. Selection and permission
// state stay local to this server; the status report itself comes from the Go
// `xplat status --json` contract so both transports read one implementation.

import { createPolicyStore, PRODUCT_BOUNDARIES } from './contracts/index.ts'

import { discoverWorkspace, selectApp } from './discovery.ts'

import { createDevActionsService } from './actions/service.ts'
import { createDocsProvider } from './docs-provider.ts'
import { createInspectionService } from './inspection/service.ts'
import { createRuntimeService } from './runtime/service.ts'
import { createXplatTransport } from './xplat.ts'
import type { Selection, WorkspaceContext } from './context.ts'
import type { AppRef } from '../types/contracts/identity'

export const SERVER_NAME = '@octane-xplat/mcp'
export const SERVER_VERSION = '0.0.0'

const NOT_PROVIDED = { state: 'not_provided' }

/**
 * options:
 *  - workspaceRoot (required)
 *  - appSelector: pre-configured app id/path/name
 *  - taskAuthorization: grant workspace + runtime-actions baseline
 *  - permissionScopes: extra bootstrap scopes (e.g. from XPLAT_MCP_PERMISSIONS)
 *  - elicit: GrantElicitor wired to client elicitation
 *  - code: code provider { status(app), search(args), read(args) }
 *  - transport/executable: XplatTransport or argv-prefix override (tests)
 */
export function createWorkspaceContext(options: any): WorkspaceContext {
  const context: WorkspaceContext = {
    workspaceRoot: options.workspaceRoot,
    configuredAppSelector: options.appSelector ?? null,
    // Which transport hosts this context (MCP server, xplat CLI). Status
    // reports it as `server` — each entry point supplies its own identity.
    serverIdentity: options.serverIdentity ?? {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
    discovery: discoverWorkspace(options.workspaceRoot),
    boundApp: null,
    selectionReason: null,
    policy: createPolicyStore({
      taskAuthorization: options.taskAuthorization ?? true,
      grants: (options.permissionScopes ?? []).map((scope: string) => ({
        scope,
        state: 'granted',
        source: 'server-config',
      })),
      elicit: options.elicit,
    }),
  } as WorkspaceContext

  context.transport =
    options.transport ??
    createXplatTransport({
      workspaceRoot: options.workspaceRoot,
      appId: () => {
        const selection = resolveSelection(context)

        return selection.state === 'bound' ? selection.app.id : null
      },
      grants: () =>
        context.policy
          .list()
          .filter((grant: any) => grant.state === 'granted' && grant.revocable)
          .map((grant: any) => grant.scope),
      executable: options.executable,
      timeoutMs: options.transportTimeoutMs,
    })

  context.code = options.code ?? null
  context.codeIndexStatus = context.code ? (app) => context.code!.status(app) : () => NOT_PROVIDED

  context.docs = createDocsProvider(context, options.docs)
  context.docsStatus = (app) => context.docs.status(app)

  // Runtime, inspection and dev-action surfaces all delegate to the Go
  // agent commands — the single service implementation.
  context.devActions = createDevActionsService(context)
  context.runtime = createRuntimeService(context)
  context.inspection = createInspectionService(context)

  if (context.configuredAppSelector) {
    const matches = selectApp(context.discovery, context.configuredAppSelector)

    if (matches.length === 1) {
      context.boundApp = matches[0]
      context.selectionReason = 'configured'
    }
  }

  return context
}

/**
 * Resolve the current selection: explicit/configured binding wins; a single
 * detected app binds as 'sole-app'; multiple apps stay ambiguous — the server
 * never silently picks.
 */
export function resolveSelection(context: WorkspaceContext): Selection {
  if (context.boundApp) {
    return { state: 'bound', app: context.boundApp, reason: context.selectionReason }
  }

  // The discovery library is untyped JavaScript; its app records follow the
  // AppRef contract shape — this is the one place the boundary is asserted.
  const apps = context.discovery.apps as AppRef[]

  if (context.configuredAppSelector) {
    return { state: 'ambiguous', candidates: apps }
  }

  if (apps.length === 0) {
    return { state: 'none', reason: 'no-apps' }
  }

  if (apps.length === 1) {
    return { state: 'bound', app: apps[0], reason: 'sole-app' }
  }

  return { state: 'ambiguous', candidates: apps }
}

export function bindApp(context: WorkspaceContext, selector: string) {
  const matches = selectApp(context.discovery, selector)

  if (matches.length === 0) {
    return { error: 'not_found', candidates: context.discovery.apps }
  }

  if (matches.length > 1) {
    return { error: 'ambiguous_selection', candidates: matches }
  }

  context.boundApp = matches[0]
  context.selectionReason = 'explicit'
  return { app: matches[0] }
}

const appSummary = (app: any) => `${app.id} (${app.name})`

function nextSteps(report: any): string[] {
  const steps = []
  const selection = report.identity.selection

  if (selection.state === 'none') {
    steps.push(
      'No Octane Xplat app was detected in this workspace. Restart the server with --workspace pointing at a directory containing an Octane Xplat app.',
    )

    return steps
  }

  if (selection.state === 'ambiguous') {
    steps.push(
      `Multiple apps detected: ${selection.candidates.map(appSummary).join(', ')}. ` +
        'Ask the developer which one to use, then select it — xplat_select_app (MCP) or `xplat app select` (CLI). The server never picks silently.',
    )

    return steps
  }

  const missing = report.prerequisites.filter((p: any) => p.status === 'missing')

  if (missing.length) {
    steps.push(
      `Missing prerequisites: ${missing.map((p: any) => `${p.name} — ${p.remedy}`).join('; ')}.`,
    )
  }

  steps.push(
    'Call xplat_capability_matrix for per-platform support before promising a runtime check.',
    'Bind or attach a session (xplat_sessions) before runtime work; an explicit app+target binding is required.',
  )

  return steps
}

/**
 * The project-status report is the Go `xplat status --json` contract with
 * the MCP-specific fields patched in: this server's identity, its permission
 * grants (including elicited scopes), and the providers its tools actually
 * use for docs/code.
 */
export async function buildProjectStatus(context: WorkspaceContext) {
  const outcome = await context.transport.call({ command: ['status'] })

  if (!outcome.ok) {
    return { error: outcome.error }
  }

  const report = outcome.data as any
  const selection = resolveSelection(context)
  const boundApp = selection.state === 'bound' ? selection.app : null

  // The transport's own selection must mirror this server's binding state —
  // reconcile explicitly rather than trusting a per-invocation --app.
  if (report.identity?.selection?.state === 'bound' && selection.state !== 'bound') {
    report.identity.selection = { state: 'ambiguous', candidates: context.discovery.apps }
  }

  report.server = context.serverIdentity
  report.permissions = context.policy.list()
  report.docs = await context.docsStatus(boundApp)
  report.codeIndex = context.codeIndexStatus(boundApp)
  report.boundaries = report.boundaries ?? PRODUCT_BOUNDARIES
  report.nextSteps = nextSteps(report)
  return report
}
