// Shared internal types for the MCP transport adapter. The context is
// assembled by createWorkspaceContext (./status): discovery and selection stay
// local; everything that owns sessions, jobs, diagnostics, inspection,
// dev-actions or evidence goes through the Go `xplat ... --json` transport —
// one implementation, two transports.

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import type { discoverWorkspace } from '@octane-xplat/cli/mcp/discovery'
import type { XplatTransport } from './xplat.ts'
import type { CodeProvider } from '../types/contracts/code'
import type { ContractError, ToolOutcome } from '../types/contracts/errors'
import type { AppRef, Platform } from '../types/contracts/identity'
import type { PolicyStore } from '../types/contracts/policy'
import type { Job } from '../types/contracts/sessions'
import type { ServerInfo } from '../types/contracts/status'

export type Discovery = ReturnType<typeof discoverWorkspace>

/** The app-binding result: explicit/configured binding, sole app, or a list the developer must choose from. */
export type Selection =
	| { state: 'bound'; app: AppRef; reason: string | null }
	| { state: 'ambiguous'; candidates: AppRef[] }
	| { state: 'none'; reason: string }

export type SelectionReason = 'explicit' | 'configured' | 'sole-app' | null

/**
 * Session/target surface — implemented by the Go CLI's agent commands.
 * Owned launches, session end and standalone jobs were removed from the agent
 * contract; the corresponding tools report `unavailable` honestly.
 */
export interface RuntimeService {
	listTargets(args: { platform?: Platform }): Promise<ToolOutcome<unknown>>
	build(args: { platform: Platform; requestKey?: string }): Promise<ToolOutcome<unknown>>
	launch(args: {
		target?: string
		requestKey?: string
		browserMode?: 'headless' | 'headed'
	}): Promise<ToolOutcome<unknown>>
	listSessions(): Promise<ToolOutcome<unknown>>
	sessionStatus(sessionId: string): Promise<ToolOutcome<unknown>>
	attach(args: { platform: Platform; targetId?: string }): Promise<ToolOutcome<unknown>>
	readDiagnostics(args: {
		reportId?: string
		platform?: Platform
		sessionId?: string
		jobId?: string
		cursor?: number
		limit?: number
		stream?: 'stdout' | 'stderr' | 'lifecycle'
	}): Promise<ToolOutcome<unknown>>
	endSession(sessionId: string): Promise<ToolOutcome<unknown>>
	endAll(): Promise<ToolOutcome<unknown>>
}

export interface DocsProvider {
	status(app: AppRef | null): unknown
	serviceFor(app: AppRef): {
		index(args: any): Promise<any>
		search(args: any): Promise<any>
		read(args: any): Promise<any>
		guidance(args: any): Promise<any>
	}
}

export interface InspectionService {
	inspect(args: any): Promise<ToolOutcome<unknown>>
	interact(args: any): Promise<ToolOutcome<unknown>>
	screenshot(args: any): Promise<ToolOutcome<unknown>>
}

export interface DevActionsService {
	list(app: AppRef): Promise<ToolOutcome<unknown>>
	invoke(
		app: AppRef,
		args: {
			appInstanceId?: string
			actionId: string
			input: Record<string, unknown>
			registryRevision?: number
			requestKey?: string
		},
	): Promise<ToolOutcome<unknown>>
	describeJob(jobId: string): Promise<{ job: Job; [key: string]: unknown } | null>
}

export interface WorkspaceContext {
	workspaceRoot: string
	configuredAppSelector: string | null
	serverIdentity: ServerInfo
	discovery: Discovery
	boundApp: AppRef | null
	selectionReason: SelectionReason
	policy: PolicyStore
	transport: XplatTransport
	docsStatus: (app: AppRef | null) => unknown
	codeIndexStatus: (app: AppRef | null) => unknown
	code: CodeProvider | null
	docs: DocsProvider
	devActions: DevActionsService
	runtime: RuntimeService
	inspection: InspectionService
}

/** The structuredContent envelope every tool result shares. */
export interface ToolResponse extends CallToolResult {
	structuredContent: ToolOutcome<unknown>
	isError: boolean
	content: [{ type: 'text'; text: string }]
}

export type Respond = (outcome: ToolOutcome<unknown>) => ToolResponse

/** Translate a transport outcome into a tool response. */
export function outcome(result: ToolOutcome<unknown>, respond: Respond): ToolResponse {
	return result.ok
		? respond({ ok: true, data: result.data })
		: respond({ ok: false, error: result.error as ContractError })
}
