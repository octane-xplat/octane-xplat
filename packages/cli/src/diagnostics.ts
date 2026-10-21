import { listDevRuns, readDevLogs, readRun } from './dev-logs.ts'
import { discoverNativeReports, readNativeReport } from './native-reports.ts'
import { contractError } from './mcp/contracts/errors.ts'

export interface DiagnosticsArgs {
	runId?: string
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
	if ([args.runId, args.sessionId, args.jobId].filter(Boolean).length > 1) {
		throw contractError('invalid_selection', 'Pass only one of --run, --session, or --job.')
	}
	if (
		args.reportId &&
		(!args.runId ||
			args.cursor !== undefined ||
			args.limit !== undefined ||
			args.stream !== undefined)
	) {
		throw contractError(
			'invalid_selection',
			'--report requires --run and cannot be combined with log pagination or stream filters.',
		)
	}
	if ((args.sessionId || args.jobId) && args.platform) {
		throw contractError(
			'invalid_selection',
			'--platform filters retained dev runs; session/job ids already select their capture.',
		)
	}
	if (
		!args.runId &&
		!args.sessionId &&
		!args.jobId &&
		(args.cursor !== undefined || args.limit !== undefined || args.stream !== undefined)
	) {
		throw contractError(
			'invalid_selection',
			'Select --run, --session, or --job before paging or filtering records.',
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
					'Native report lookup requires a retained --run from xplat dev. Session/job selectors read their own output captures.',
			},
		},
	}
}

/** Read app-bound retained evidence without creating a runtime host. */
export async function retainedDiagnostics(appRoot: string, args: DiagnosticsArgs) {
	validateDiagnosticsSelection(args)
	if (!args.runId) {
		return {
			runs: listDevRuns(appRoot, args.platform),
			note: 'Select --run RUN_ID to read logs and native reports. Runs are recorded by xplat dev, independently of agent sessions.',
		}
	}
	const run = readRun(appRoot, args.runId)
	if (args.platform && run.platform !== args.platform) {
		throw contractError('invalid_selection', 'The selected run belongs to another platform.')
	}
	if (args.reportId) {
		return { runId: run.runId, report: readNativeReport(appRoot, run, args.reportId) }
	}
	const { run: _run, ...logs } = readDevLogs(appRoot, args.runId, args)
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
		runId: run.runId,
		run,
		logs,
		reports: native.reports,
		coverage: { logs: 'captured', nativeReports: native.coverage },
	}
}
