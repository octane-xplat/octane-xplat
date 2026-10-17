// Shared internal types for the MCP transport adapter. The context object is
// assembled by createWorkspaceContext in the shared service layer
// (@octane-xplat/cli/mcp/status); its registries/stores are typed by the
// published contracts while service slots (runtime, docs, inspection,
// dev-actions) keep the adapter-facing surface the tools actually use.

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import type { discoverWorkspace } from '@octane-xplat/cli/mcp/discovery'
import type { CapabilityRegistry } from '../types/contracts/capabilities'
import type { CodeProvider } from '../types/contracts/code'
import type { ToolOutcome } from '../types/contracts/errors'
import type { EvidenceStore } from '../types/contracts/evidence'
import type { AppRef, Platform } from '../types/contracts/identity'
import type { PolicyStore } from '../types/contracts/policy'
import type { Job, JobRegistry, SessionRegistry } from '../types/contracts/sessions'
import type { ServerInfo } from '../types/contracts/status'

export type Discovery = ReturnType<typeof discoverWorkspace>

/** The app-binding result: explicit/configured binding, sole app, or a list the developer must choose from. */
export type Selection =
	| { state: 'bound'; app: AppRef; reason: string | null }
	| { state: 'ambiguous'; candidates: AppRef[] }
	| { state: 'none'; reason: string }

export type SelectionReason = 'explicit' | 'configured' | 'sole-app' | null

export interface RuntimeService {
	registerCapabilities(): void
	listTargets(args: { platform?: Platform }): Promise<any>
	build(args: { platform: Platform; requestKey?: string }): Promise<any>
	launch(args: {
		platform: Platform
		targetId?: string
		requestKey?: string
		browserMode?: 'headless' | 'headed'
	}): Promise<any>
	attach(args: { platform: Platform; targetId?: string }): Promise<any>
	readLogs(args: {
		sessionId?: string
		jobId?: string
		cursor?: number
		limit?: number
		stream?: 'stdout' | 'stderr' | 'lifecycle'
	}): any
	endSession(sessionId: string): Promise<any>
	endAll(): Promise<any>
}

export interface DocsProvider {
	status(app: AppRef | null): unknown
	serviceFor(app: AppRef): {
		search(args: any): Promise<any>
		read(args: any): Promise<any>
		guidance(args: any): Promise<any>
	}
}

export interface InspectionService {
	inspect(args: any): Promise<any>
	interact(args: any): Promise<any>
	screenshot(args: any): Promise<any>
}

export interface DevActionsService {
	list(app: AppRef): Promise<any>
	invoke(
		app: AppRef,
		args: {
			appInstanceId?: string
			actionId: string
			input: Record<string, unknown>
			registryRevision?: number
			requestKey?: string
		},
	): Promise<any>
	describeJob(jobId: string): { job: Job; [key: string]: unknown } | null
}

export interface WorkspaceContext {
	workspaceRoot: string
	configuredAppSelector: string | null
	serverIdentity: ServerInfo
	discovery: Discovery
	boundApp: AppRef | null
	selectionReason: SelectionReason
	capabilities: CapabilityRegistry
	policy: PolicyStore
	sessions: SessionRegistry
	jobs: JobRegistry
	evidence: EvidenceStore
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
