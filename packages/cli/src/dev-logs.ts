// Local development output only. Each writer owns a unique run directory;
// readers need neither the writer nor the agent runtime host to be alive.
import { randomUUID } from 'node:crypto'
import {
	appendFileSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	renameSync,
	rmSync,
	writeFileSync,
} from 'node:fs'

import { join } from 'node:path'
import { contractError } from './mcp/contracts/errors.ts'

const RUN_ID = /^run_[a-f0-9-]{36}$/
const SEGMENT_BYTES = 512 * 1024
const LINE_CHARS = 8192
const RETAINED_RUNS = 20

interface DevRun {
	version: 1
	runId: string
	platform: string
	targetId: string
	pid: number
	startedAt: string
	endedAt: string | null
}

export interface DevLogRecord {
	seq: number
	ts: string
	stream: 'stdout' | 'stderr' | 'lifecycle'
	source: string
	line: string
	lineTruncated?: boolean
}

const logRoot = (appRoot: string) => join(appRoot, 'node_modules/.cache/xplat/logs')
const alive = (pid: number) => {
	try {
		process.kill(pid, 0)
		return true
	} catch {
		return false
	}
}

const historical = (run: DevRun) => run.endedAt !== null || !alive(run.pid)

function readRun(appRoot: string, runId: string): DevRun {
	if (!RUN_ID.test(runId)) {
		throw contractError('invalid_selection', 'Invalid development run id.')
	}
	let run: DevRun
	try {
		run = JSON.parse(readFileSync(join(logRoot(appRoot), runId, 'run.json'), 'utf8'))
	} catch (error) {
		if (error.code === 'ENOENT') {
			throw contractError(
				'not_found',
				'No retained development run with this id for the selected app.',
			)
		}

		throw error
	}
	if (run.version !== 1 || run.runId !== runId || !Number.isInteger(run.pid)) {
		throw new Error('Invalid retained development run metadata.')
	}
	return run
}

/** Discover this app's retained runs without creating a capture or agent host. */
export function listDevRuns(appRoot: string, platform?: string) {
	let names: string[]
	try {
		names = readdirSync(logRoot(appRoot))
	} catch (error) {
		if (error.code === 'ENOENT') {
			return []
		}

		throw error
	}
	const runs: Array<DevRun & { historical: boolean }> = []
	for (const name of names.filter((name) => RUN_ID.test(name))) {
		try {
			const run = readRun(appRoot, name)
			if (!platform || run.platform === platform) {
				runs.push({ ...run, historical: historical(run) })
			}
		} catch (error) {
			// A concurrent writer may have created its directory but not its
			// metadata yet, or pruned an old run while this reader listed it.
			if (error.code !== 'not_found') {
				throw error
			}
		}
	}
	return runs.sort(
		(a, b) => b.startedAt.localeCompare(a.startedAt) || a.runId.localeCompare(b.runId),
	)
}

/** Capture one dev target. Two rotating JSONL segments bound retained bytes. */
export function createDevLogCapture(
	appRoot: string,
	{ platform, targetId }: { platform: string; targetId: string },
	{ segmentBytes = SEGMENT_BYTES, retainedRuns = RETAINED_RUNS } = {},
) {
	const run: DevRun = {
		version: 1,
		runId: `run_${randomUUID()}`,
		platform,
		targetId,
		pid: process.pid,
		startedAt: new Date().toISOString(),
		endedAt: null,
	}
	const root = logRoot(appRoot)
	mkdirSync(root, { recursive: true, mode: 0o700 })
	const dir = join(root, run.runId)
	mkdirSync(dir, { mode: 0o700 })
	const metadata = () => {
		writeFileSync(join(dir, 'run.tmp'), JSON.stringify(run), { mode: 0o600 })
		renameSync(join(dir, 'run.tmp'), join(dir, 'run.json'))
	}
	metadata()
	// Active runs are never evicted. Only CLI-owned cache directories matching
	// our run identity are eligible; keep the newest completed runs globally.
	const prune = () => {
		for (const old of listDevRuns(appRoot)
			.filter((r) => r.historical)
			.sort((a, b) => (b.endedAt ?? b.startedAt).localeCompare(a.endedAt ?? a.startedAt))
			.slice(retainedRuns)) {
			rmSync(join(root, old.runId), { recursive: true, force: true })
		}
	}
	prune()
	let bytes = 0
	let seq = 0
	let closed = false
	const append = (input: Omit<DevLogRecord, 'seq' | 'ts' | 'source'> & { source?: string }) => {
		if (closed) {
			return
		}
		const record: DevLogRecord = {
			...input,
			source: input.source ?? platform,
			seq: ++seq,
			ts: new Date().toISOString(),
			line: input.line.slice(0, LINE_CHARS),
			...(input.line.length > LINE_CHARS ? { lineTruncated: true } : {}),
		}
		const encoded = JSON.stringify(record) + '\n'
		const size = Buffer.byteLength(encoded)
		if (size > segmentBytes) {
			throw new Error('Development log record exceeds the segment bound.')
		}
		if (bytes && bytes + size > segmentBytes) {
			rmSync(join(dir, 'previous.jsonl'), { force: true })
			renameSync(join(dir, 'current.jsonl'), join(dir, 'previous.jsonl'))
			bytes = 0
		}
		appendFileSync(join(dir, 'current.jsonl'), encoded, { mode: 0o600 })
		bytes += size
	}
	append({ stream: 'lifecycle', line: 'Development output capture started.' })
	return {
		runId: run.runId,
		append,
		close(detail = 'Development output capture ended.') {
			if (closed) {
				return
			}
			append({ stream: 'lifecycle', line: detail })
			run.endedAt = new Date().toISOString()
			metadata()
			closed = true
			prune()
		},
	}
}

/** Read a selected run. Sequence cursors must be reused with that same run id. */
export function readDevLogs(
	appRoot: string,
	runId: string,
	{ cursor, limit = 500, stream }: { cursor?: number; limit?: number; stream?: string } = {},
) {
	const run = readRun(appRoot, runId)
	const dir = join(logRoot(appRoot), runId)
	const seen = new Map<number, DevLogRecord>()
	let incompleteTail = false
	// Reading previous again covers a rotation between the first two reads.
	for (const name of ['previous.jsonl', 'current.jsonl', 'previous.jsonl']) {
		let text: string
		try {
			text = readFileSync(join(dir, name), 'utf8')
		} catch (error) {
			if (error.code === 'ENOENT') {
				continue
			}

			throw error
		}

		// An interrupted final append may leave one incomplete record. It is
		// never returned or used to advance the cursor.
		if (text && !text.endsWith('\n')) {
			incompleteTail = true
		}

		for (const line of text
			.slice(0, text.lastIndexOf('\n') + 1)
			.split('\n')
			.filter(Boolean)) {
			const record = JSON.parse(line) as DevLogRecord
			seen.set(record.seq, record)
		}
	}
	const records = [...seen.values()].sort((a, b) => a.seq - b.seq)
	const oldestSeq = records[0]?.seq ?? 1
	const newestSeq = records.at(-1)?.seq ?? 0
	if (records.some((r, i) => i && r.seq !== records[i - 1].seq + 1)) {
		throw contractError('execution_failure', 'Log files rotated during the read; retry.', {
			retryable: true,
		})
	}
	if (cursor !== undefined && cursor > newestSeq) {
		throw contractError(
			'invalid_selection',
			'Cursor is ahead of this run. Use a cursor returned for the same run id.',
		)
	}
	const matching = records.filter(
		(r) => (cursor === undefined || r.seq > cursor) && (!stream || r.stream === stream),
	)
	const page = cursor === undefined ? matching.slice(-limit) : matching.slice(0, limit)
	const truncated = (cursor ?? 0) < oldestSeq - 1
	return {
		run,
		records: page,
		nextCursor: matching.length > page.length ? page.at(-1)!.seq : newestSeq,
		oldestSeq,
		newestSeq,
		truncated,
		dropped: oldestSeq - 1,
		incompleteTail,
		historical: historical(run),
		capturedFrom: run.startedAt,
		coverage:
			'Forwarded tool/host output. Browser warnings and errors require xplatDevBridge in the web Vite config. No OS crash reports or output from before capture.',
	}
}
