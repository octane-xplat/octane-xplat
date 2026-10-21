import { listRetainedSessions, readDevLogs, readRetainedSession } from './dev-logs.ts'
import { discoverNativeReports, readNativeReport } from './native-reports.ts'
import { contractError } from './mcp/contracts/errors.ts'

export interface DiagnosticsArgs {
	reportId?: string
	sessionId?: string
	jobId?: string
	platform?: string
	cursor?: number
	limit?: number
	stream?: string
}

/** Validate selectors identically for CLI and MCP. */
export function validateDiagnosticsSelection(args: DiagnosticsArgs) {
	if ([args.sessionId, args.jobId].filter(Boolean).length > 1) {
		throw contractError('invalid_selection', 'Pass only one of --session or --job.')
	}
	if (
		args.reportId &&
		(!args.sessionId ||
			args.cursor !== undefined ||
			args.limit !== undefined ||
			args.stream !== undefined)
	) {
		throw contractError(
			'invalid_selection',
			'--report requires --session and cannot be combined with log pagination or stream filters.',
		)
	}
	if (args.jobId && args.platform) {
		throw contractError(
			'invalid_selection',
			'--platform filters sessions; a job id already selects its capture.',
		)
	}
	if (
		!args.sessionId &&
		!args.jobId &&
		(args.cursor !== undefined || args.limit !== undefined || args.stream !== undefined)
	) {
		throw contractError(
			'invalid_selection',
			'Select --session or --job before paging or filtering records.',
		)
	}
}

/** Keep host-owned log captures in the same diagnostic envelope as retained runs. */
export function diagnosticsFromLogs(logs: any) {
	return {
		logs,
		reports: [],
		coverage: {
			logs: logs.nextCursor === undefined ? 'unavailable' : 'captured',
			nativeReports: {
				status: 'unavailable',
				detail:
					'Build jobs have output captures but no development session or native report lookup.',
			},
		},
	}
}

/** Read app-bound retained evidence without creating a runtime host. */
export async function retainedDiagnostics(appRoot: string, args: DiagnosticsArgs) {
	validateDiagnosticsSelection(args)
	if (!args.sessionId) {
		return {
			sessions: listRetainedSessions(appRoot, args.platform),
			note: 'Select --session SESSION_ID to read logs and native reports. Both xplat dev and agent launches retain sessions.',
		}
	}
	const run = readRetainedSession(appRoot, args.sessionId)
	if (args.platform && run.platform !== args.platform) {
		throw contractError('invalid_selection', 'The selected run belongs to another platform.')
	}
	if (args.reportId) {
		return { sessionId: run.sessionId, report: readNativeReport(appRoot, run, args.reportId) }
	}
	const { session: _session, ...logs } = readDevLogs(appRoot, args.sessionId, args)
	let native: Awaited<ReturnType<typeof discoverNativeReports>>
	try {
		native = await discoverNativeReports(appRoot, run)
	} catch (error) {
		// Native discovery/cache failure must not hide already readable logs.
		native = {
			reports: [],
			coverage: {
				status: 'unavailable',
				detail: `Native report discovery or retention failed (${error.code ?? 'retention-error'}). Log capture remains readable.`,
			},
		}
	}
	return {
		sessionId: run.sessionId,
		session: run,
		logs,
		reports: native.reports,
		coverage: { logs: 'captured', nativeReports: native.coverage },
	}
}
