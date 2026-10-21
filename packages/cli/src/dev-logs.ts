// Local development output only. Each writer owns a unique session directory;
// readers need neither the writer nor the agent runtime host to be alive.
import { createHash, randomUUID } from 'node:crypto'
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
import { macOSDevBundleId } from './native-identity.ts'

const SESSION_ID = /^sess_[a-f0-9-]{36}$/
const SEGMENT_BYTES = 512 * 1024
const LINE_CHARS = 8192
const RETAINED_RUNS = 20

export interface RetainedSession {
	version: 2
	sessionId: string
	platform: string
	targetId: string
	pid: number
	startedAt: string
	endedAt: string | null
	state: 'starting' | 'ready' | 'failed' | 'stopped' | 'disconnected'
	origin: 'dev' | 'agent'
	ownership: 'owned' | 'attached'
	appId?: string
	createdAt: string
	processKind?: string | null
	buildIdentity?: unknown
	detail?: string
	launch?: { phase?: string; error?: unknown; [key: string]: unknown }
	nativeIdentity?: { appId: string; processes: Array<{ pid: number; observedAt: string }> }
}

export interface DevLogRecord {
	seq: number
	ts: string
	stream: 'stdout' | 'stderr' | 'lifecycle'
	source: string
	line: string
	lineTruncated?: boolean
}

const logRoot = (appRoot: string) => join(appRoot, 'node_modules/.cache/xplat/sessions')
const alive = (pid: number) => {
	try {
		process.kill(pid, 0)
		return true
	} catch {
		return false
	}
}

const historical = (run: RetainedSession) => run.endedAt !== null || !alive(run.pid)

export function readRetainedSession(appRoot: string, sessionId: string): RetainedSession {
	if (!SESSION_ID.test(sessionId)) {
		throw contractError('invalid_selection', 'Invalid session id.')
	}
	let run: RetainedSession
	try {
		run = JSON.parse(readFileSync(join(logRoot(appRoot), sessionId, 'session.json'), 'utf8'))
	} catch (error) {
		if (error.code === 'ENOENT') {
			throw contractError('not_found', 'No retained session with this id for the selected app.')
		}

		throw error
	}
	if (run.version !== 2 || run.sessionId !== sessionId || !Number.isInteger(run.pid)) {
		throw new Error('Invalid retained session metadata.')
	}
	return historical(run) && !run.endedAt ? { ...run, state: 'disconnected' } : run
}

/** Discover this app's retained sessions without creating a capture or agent host. */
export function listRetainedSessions(appRoot: string, platform?: string) {
	let names: string[]
	try {
		names = readdirSync(logRoot(appRoot))
	} catch (error) {
		if (error.code === 'ENOENT') {
			return []
		}

		throw error
	}
	const runs: Array<RetainedSession & { historical: boolean }> = []
	for (const name of names.filter((name) => SESSION_ID.test(name))) {
		try {
			const run = readRetainedSession(appRoot, name)
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
		(a, b) => b.startedAt.localeCompare(a.startedAt) || a.sessionId.localeCompare(b.sessionId),
	)
}

/** Capture one dev target. Two rotating JSONL segments bound retained bytes. */
export function createDevLogCapture(
	appRoot: string,
	{
		platform,
		targetId,
		sessionId,
		appId,
		ownership = 'owned',
		origin = 'dev',
	}: {
		platform: string
		targetId: string
		sessionId?: string
		appId?: string
		ownership?: 'owned' | 'attached'
		origin?: 'dev' | 'agent'
	},
	{ segmentBytes = SEGMENT_BYTES, retainedRuns = RETAINED_RUNS } = {},
) {
	const run: RetainedSession = {
		version: 2,
		sessionId: sessionId ?? `sess_${randomUUID()}`,
		platform,
		targetId,
		pid: process.pid,
		startedAt: new Date().toISOString(),
		endedAt: null,
		state: 'starting',
		origin,
		ownership,
		appId,
		createdAt: new Date().toISOString(),
	}
	const root = logRoot(appRoot)
	mkdirSync(root, { recursive: true, mode: 0o700 })
	if (!SESSION_ID.test(run.sessionId)) {
		throw contractError('invalid_selection', 'Invalid session id.')
	}
	// One atomic lease per app/platform/target, shared by dev, CLI and MCP.
	// A separate recovery guard serializes stale-owner reclamation.
	const leases = join(root, 'leases')
	mkdirSync(leases, { recursive: true, mode: 0o700 })
	const lease = join(
		leases,
		createHash('sha256')
			.update(platform + '\n' + targetId)
			.digest('hex'),
	)
	const claim = () =>
		writeFileSync(lease, JSON.stringify({ pid: process.pid, sessionId: run.sessionId }), {
			flag: 'wx',
			mode: 0o600,
		})
	if (ownership === 'owned') {
		try {
			claim()
		} catch (error) {
			if (error.code !== 'EEXIST') {
				throw error
			}
			const recovery = lease + '.recovery'
			let held = false
			try {
				try {
					mkdirSync(recovery)
					held = true
				} catch {
					throw contractError('target_busy', 'Target ownership is being checked; retry.')
				}
				const owner = JSON.parse(readFileSync(lease, 'utf8'))
				if (alive(owner.pid)) {
					throw contractError('target_busy', 'This app target already has an active session.', {
						context: { sessionId: owner.sessionId, targetId },
					})
				}
				rmSync(lease)
				try {
					claim()
				} catch (error) {
					if (error.code === 'EEXIST') {
						throw contractError('target_busy', 'Another session claimed this target.')
					}
					throw error
				}
			} finally {
				if (held) {
					rmSync(recovery, { recursive: true, force: true })
				}
			}
		}
	}
	const dir = join(root, run.sessionId)
	mkdirSync(dir, { mode: 0o700 })
	const metadata = () => {
		writeFileSync(join(dir, 'session.tmp'), JSON.stringify(run), { mode: 0o600 })
		renameSync(join(dir, 'session.tmp'), join(dir, 'session.json'))
	}
	if (platform === 'macos') {
		try {
			const manifest = JSON.parse(readFileSync(join(appRoot, 'package.json'), 'utf8'))
			if (manifest.xplat?.targets?.macos?.runtime === 'appkit-node-api') {
				run.nativeIdentity = { appId: macOSDevBundleId(appRoot, manifest), processes: [] }
			}
		} catch {
			/* Missing identity leaves report coverage unavailable. */
		}
	}
	metadata()
	// Active runs are never evicted. Only CLI-owned cache directories matching
	// our run identity are eligible; keep the newest completed runs globally.
	const prune = () => {
		for (const old of listRetainedSessions(appRoot)
			.filter((r) => r.historical)
			.sort((a, b) => (b.endedAt ?? b.startedAt).localeCompare(a.endedAt ?? a.startedAt))
			.slice(retainedRuns)) {
			rmSync(join(root, old.sessionId), { recursive: true, force: true })
		}
	}
	prune()
	let bytes = 0
	let seq = 0
	let closed = false
	let controlTimer: ReturnType<typeof setInterval> | undefined
	const append = (input: Omit<DevLogRecord, 'seq' | 'ts' | 'source'> & { source?: string }) => {
		if (closed) {
			return
		}
		const record: DevLogRecord = {
			...input,
			source: /^\[browser:(?:warn|error)\]/.test(input.line)
				? 'browser'
				: (input.source ?? platform),
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
		sessionId: run.sessionId,
		append,
		get closed() {
			return closed
		},
		update(patch: Partial<RetainedSession>) {
			Object.assign(run, patch)
			metadata()
		},
		onStop(handler: () => Promise<unknown> | void) {
			controlTimer = setInterval(() => {
				try {
					readFileSync(join(dir, 'stop-request'))
				} catch {
					return
				}
				clearInterval(controlTimer)
				void Promise.resolve()
					.then(handler)
					.catch((error) =>
						append({ stream: 'lifecycle', line: `Session cleanup failed: ${error.message}` }),
					)
			}, 100)
			controlTimer.unref()
		},
		observeNativeOutput(line: string) {
			if (closed) {
				return
			}
			if (
				origin === 'dev' &&
				/VITE.*ready in|\[macos-native\] host started|Successfully synced application/.test(line)
			) {
				run.state = 'ready'
				metadata()
			}
			const appId = /Successfully synced application ([A-Za-z][\w]*(?:\.[\w]+)+) on device/.exec(
				line,
			)?.[1]
			const processId =
				platform === 'macos' ? /\[macos-native\] host started pid=(\d+)/.exec(line)?.[1] : null
			if (appId && (platform === 'ios' || platform === 'android')) {
				run.nativeIdentity = { appId, processes: [] }
				metadata()
			}
			if (processId && run.nativeIdentity && run.nativeIdentity.processes.length < 100) {
				run.nativeIdentity.processes.push({
					pid: Number(processId),
					observedAt: new Date().toISOString(),
				})
				metadata()
			}
		},
		close(detail = 'Development output capture ended.') {
			if (closed) {
				return
			}
			append({ stream: 'lifecycle', line: detail })
			run.endedAt = new Date().toISOString()
			if (run.state !== 'failed' && run.state !== 'disconnected') {
				run.state = 'stopped'
			}
			clearInterval(controlTimer)
			if (ownership === 'owned') {
				try {
					if (JSON.parse(readFileSync(lease, 'utf8')).sessionId === run.sessionId) {
						rmSync(lease)
					}
				} catch {}
			}
			metadata()
			closed = true
			prune()
		},
	}
}

/** Read a selected session. Sequence cursors belong to that session ID. */
export function readDevLogs(
	appRoot: string,
	sessionId: string,
	{ cursor, limit = 500, stream }: { cursor?: number; limit?: number; stream?: string } = {},
) {
	const run = readRetainedSession(appRoot, sessionId)
	const dir = join(logRoot(appRoot), sessionId)
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
			'Cursor is ahead of this session. Use a cursor returned for the same session ID.',
		)
	}
	const matching = records.filter(
		(r) => (cursor === undefined || r.seq > cursor) && (!stream || r.stream === stream),
	)
	const page = cursor === undefined ? matching.slice(-limit) : matching.slice(0, limit)
	const truncated = (cursor ?? 0) < oldestSeq - 1
	return {
		session: run,
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
			'Forwarded tool/host output. Browser warnings and errors require xplatDevBridge in the web Vite config. This log stream excludes OS report files and output from before capture; diagnostics discovers native reports separately.',
	}
}

/** Request cleanup from the session owner; never signal a guessed/reused PID. */
export async function endRetainedSession(appRoot: string, sessionId: string) {
	let session = readRetainedSession(appRoot, sessionId)
	if (session.endedAt) {
		return { sessionId, ended: true }
	}
	if (!alive(session.pid)) {
		return {
			sessionId,
			ended: false,
			note: 'Session owner is gone; its retained diagnostics remain available, but live cleanup cannot be confirmed.',
		}
	}
	writeFileSync(join(logRoot(appRoot), sessionId, 'stop-request'), '', { mode: 0o600 })
	const deadline = Date.now() + 10_000
	while (Date.now() < deadline) {
		await new Promise((resolve) => setTimeout(resolve, 100))
		session = readRetainedSession(appRoot, sessionId)
		if (session.endedAt) {
			return { sessionId, ended: true }
		}
	}
	return {
		sessionId,
		ended: false,
		ending: true,
		note: 'Cleanup requested; inspect session status for completion.',
	}
}
