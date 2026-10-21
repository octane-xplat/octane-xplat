// Read existing OS evidence only: no crash handlers, root, bugreports or sampling.
import { execFile } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import {
	constants,
	closeSync,
	fstatSync,
	mkdirSync,
	openSync,
	readFileSync,
	readdirSync,
	renameSync,
	rmSync,
	statSync,
	writeFileSync,
} from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import type { RetainedSession } from './dev-logs.ts'
import { contractError } from './mcp/contracts/errors.ts'

const execute = promisify(execFile)
const MAX_REPORT_BYTES = 4 * 1024 * 1024
const MAX_TOTAL_BYTES = 16 * 1024 * 1024
const MAX_REPORTS = 10
const REPORT_ID = /^report_[a-f0-9]{64}$/
const digest = (value: string) => createHash('sha256').update(value).digest('hex')
const rootFor = (appRoot: string, run: RetainedSession) =>
	join(appRoot, 'node_modules/.cache/xplat/sessions', run.sessionId, 'reports')

export interface NativeReport {
	id: string
	kind: 'native-crash' | 'crash' | 'anr' | 'process-exit'
	source: 'apple-ips' | 'android-exit-info'
	timestamp: string
	summary: string
	association: 'confirmed' | 'candidate'
	associationReason: string
	bytes: number
}
interface FoundReport extends Omit<NativeReport, 'id' | 'bytes'> {
	content: string
}
interface Coverage {
	status: 'available' | 'none-found' | 'partial' | 'unavailable' | 'unsupported'
	detail: string
}
interface Options {
	host?: string
	home?: string
	exec?: (command: string, args: string[]) => Promise<string>
}
const inWindow = (run: RetainedSession, time: number) =>
	Number.isFinite(time) &&
	time >= Date.parse(run.startedAt) - 5000 &&
	time <= Date.parse(run.endedAt ?? new Date().toISOString()) + 5000

// O_NOFOLLOW prevents a report-file symlink from turning discovery into an
// arbitrary-file read. Size is checked on the opened file, not a stale stat.
function readBounded(path: string, maxBytes = MAX_REPORT_BYTES) {
	const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW)
	try {
		const stat = fstatSync(fd)
		if (!stat.isFile() || stat.size > maxBytes) {
			throw new Error('report-size-limit')
		}
		return readFileSync(fd, 'utf8')
	} finally {
		closeSync(fd)
	}
}

function appleReports(run: RetainedSession, home: string) {
	const directory = join(home, 'Library/Logs/DiagnosticReports')
	let names: string[]
	try {
		names = readdirSync(directory)
	} catch (error) {
		return {
			found: [],
			coverage: {
				status: 'unavailable',
				detail: `Apple report directory cannot be read (${error.code}).`,
			} as Coverage,
		}
	}
	let partial = false
	let scannedBytes = 0
	const found: FoundReport[] = []
	const candidates = names
		.filter((name) => name.endsWith('.ips'))
		.flatMap((name) => {
			try {
				return [{ name, mtime: statSync(join(directory, name)).mtimeMs }]
			} catch {
				partial = true
				return []
			}
		})
		.filter((file) => file.mtime >= Date.parse(run.startedAt) - 5000)
		.sort((a, b) => b.mtime - a.mtime)
	if (candidates.length > 100) {
		partial = true
	}
	for (const { name } of candidates.slice(0, 100)) {
		try {
			const content = readBounded(
				join(directory, name),
				Math.min(MAX_REPORT_BYTES, 64 * 1024 * 1024 - scannedBytes),
			)
			scannedBytes += Buffer.byteLength(content)
			if (scannedBytes > 64 * 1024 * 1024) {
				partial = true
				break
			}
			const split = content.indexOf('\n')
			const header = JSON.parse(content.slice(0, split))
			if (String(header.bug_type) !== '309') {
				continue
			}
			const body = JSON.parse(content.slice(split + 1))
			if (run.platform === 'ios' && Number(body.platform ?? header.platform) !== 7) {
				continue
			}
			if (run.platform === 'macos' && Number(body.platform ?? header.platform) !== 1) {
				continue
			}
			const timestamp = Date.parse(body.captureTime ?? header.timestamp)
			if (!inWindow(run, timestamp)) {
				continue
			}
			const sameDevice =
				run.platform !== 'ios' || String(body.procPath ?? '').includes(`/Devices/${run.targetId}/`)
			if (!sameDevice && /\/Devices\/[A-Fa-f0-9-]{36}\//.test(body.procPath ?? '')) {
				continue
			}
			const bundleId = header.bundleID ?? body.bundleInfo?.CFBundleIdentifier
			if (bundleId && bundleId !== run.nativeIdentity?.appId) {
				continue
			}
			const launchTime = Date.parse(body.procLaunch)
			const confirmed =
				sameDevice &&
				inWindow(run, launchTime) &&
				run.nativeIdentity!.processes.some(
					(process) =>
						process.pid === body.pid &&
						Math.abs(Date.parse(process.observedAt) - launchTime) <= 5000,
				)
			// A cleaned-up temporary bundle may have no bundle identifier in
			// the OS report. Only observed PID+launch ownership can admit it.
			if (!confirmed && bundleId !== run.nativeIdentity?.appId) {
				continue
			}
			found.push({
				kind: 'native-crash',
				source: 'apple-ips',
				timestamp: new Date(timestamp).toISOString(),
				summary: `${body.exception?.type ?? 'Native crash'}${body.exception?.signal ? ` (${body.exception.signal})` : ''}${body.termination?.namespace ? `; ${body.termination.namespace}: ${body.termination.code}` : ''}`,
				association: confirmed ? 'confirmed' : 'candidate',
				associationReason: confirmed
					? 'Observed host PID, launch time and report time match this run; bundle id also matches when present.'
					: 'Bundle id and report time match; exact process ownership is not established.',
				content,
			})
		} catch {
			partial = true
		}
	}
	return {
		found,
		coverage: {
			status: partial ? 'partial' : found.length ? 'available' : 'none-found',
			detail:
				'Local Apple .ips crash reports only; reports can arrive after process exit. Other report directories and hang reports are not scanned.',
		} as Coverage,
	}
}

async function androidReports(run: RetainedSession, exec: NonNullable<Options['exec']>) {
	const device = run.targetId
	const appId = run.nativeIdentity!.appId
	if (!/^[A-Za-z0-9._:-]+$/.test(device) || !/^[A-Za-z]\w*(?:\.\w+)+$/.test(appId)) {
		return {
			found: [],
			coverage: {
				status: 'unavailable',
				detail: 'Invalid recorded Android device or package identity.',
			} as Coverage,
		}
	}
	try {
		const zone = (await exec('adb', ['-s', device, 'shell', 'date', '+%z'])).trim()
		if (!/^[+-]\d{4}$/.test(zone)) {
			throw new Error('device-time-zone-unavailable')
		}
		const output = await exec('adb', [
			'-s',
			device,
			'shell',
			'dumpsys',
			'activity',
			'exit-info',
			appId,
		])
		if (!output.includes('ACTIVITY MANAGER PROCESS EXIT INFO')) {
			throw new Error('exit-info-unavailable')
		}
		const found: FoundReport[] = []
		for (const match of output.matchAll(
			/^[ \t]*ApplicationExitInfo[^\n]*:\r?\n[\s\S]*?(?=^[ \t]*ApplicationExitInfo|^[ \t]*Historical Process Exit|^[ \t]*package:|$(?![\s\S]))/gm,
		)) {
			const content = match[0]
			const processName = /\bprocess=([^\s]+)/.exec(content)?.[1]
			if (processName !== appId && !processName?.startsWith(appId + ':')) {
				continue
			}
			const date = /\btimestamp=(\d{4}-\d\d-\d\d \d\d:\d\d:\d\d\.\d{3})/.exec(content)?.[1]
			const timestamp = Date.parse(`${date?.replace(' ', 'T')}${zone}`)
			if (!inWindow(run, timestamp)) {
				continue
			}
			const reason = /\breason=(\d+)\s*\(([^)]+)\)/.exec(content)
			if (!reason) {
				throw new Error('unknown-exit-info-format')
			}
			found.push({
				kind:
					reason[1] === '5'
						? 'native-crash'
						: reason[1] === '4'
							? 'crash'
							: reason[1] === '6'
								? 'anr'
								: 'process-exit',
				source: 'android-exit-info',
				timestamp: new Date(timestamp).toISOString(),
				summary: `${reason[2]}; status=${/\bstatus=(\d+)/.exec(content)?.[1] ?? 'unknown'}`,
				association: 'candidate',
				associationReason:
					'Recorded device/package and exit time match; timestamp uses the device’s current time zone and does not establish exact process ownership.',
				content,
			})
		}
		if (
			output.includes('ApplicationExitInfo') &&
			!found.length &&
			!/\btimestamp=\d{4}-/.test(output)
		) {
			throw new Error('unknown-exit-info-format')
		}
		return {
			found,
			coverage: {
				status: 'partial',
				detail:
					'App-scoped Android exit history is readable. These are exit records, not full ANR traces or tombstones; trace files are not collected. Empty results mean no matching exit record was found in this run window.',
			} as Coverage,
		}
	} catch (error) {
		return {
			found: [],
			coverage: {
				status: 'unavailable',
				detail: `Android exit history could not be read (${error.code ?? error.message}). Device access and OS support are required.`,
			} as Coverage,
		}
	}
}

function retained(appRoot: string, run: RetainedSession): NativeReport[] {
	try {
		return readdirSync(rootFor(appRoot, run))
			.filter((name) => /^report_[a-f0-9]{64}\.json$/.test(name))
			.flatMap((name) => {
				return [JSON.parse(readBounded(join(rootFor(appRoot, run), name)))]
			})
	} catch (error) {
		if (error.code === 'ENOENT') {
			return []
		}
		throw error
	}
}

/** Discover bounded existing reports, preserving complete originals beside the run. */
export async function discoverNativeReports(
	appRoot: string,
	run: RetainedSession,
	options: Options = {},
) {
	const reports = retained(appRoot, run)
	let coverage: Coverage
	let found: FoundReport[] = []
	if (!['ios', 'macos', 'android'].includes(run.platform)) {
		coverage = {
			status: 'unsupported',
			detail: 'Native report discovery is implemented for macOS, iOS simulators and Android only.',
		}
	} else if (!run.nativeIdentity?.appId) {
		coverage = {
			status: 'unavailable',
			detail:
				'This run has no recorded native app identity. Start a new xplat dev run and wait for native launch output.',
		}
	} else if (run.platform === 'android') {
		const exec =
			options.exec ??
			(async (command, args) =>
				(
					await execute(command, args, {
						timeout: 5000,
						maxBuffer: MAX_REPORT_BYTES,
						encoding: 'utf8',
					})
				).stdout)
		;({ found, coverage } = await androidReports(run, exec))
	} else if ((options.host ?? process.platform) !== 'darwin') {
		coverage = {
			status: 'unavailable',
			detail: 'Apple report discovery requires the Mac that ran the app.',
		}
	} else if (run.platform === 'ios' && !/^[A-Fa-f0-9-]{36}$/.test(run.targetId)) {
		coverage = {
			status: 'unsupported',
			detail:
				'Physical iOS report extraction is not implemented; this source supports simulators only.',
		}
	} else {
		;({ found, coverage } = appleReports(run, options.home ?? homedir()))
	}
	let limited = false
	if (found.length) {
		const directory = rootFor(appRoot, run)
		mkdirSync(directory, { recursive: true, mode: 0o700 })
		const lock = join(directory, 'write.lock')
		let locked = false
		try {
			// A crashed reader may leave a lock; reclaim only after a grace
			// period and proof that its owner no longer exists.
			try {
				const owner = Number(readFileSync(lock, 'utf8'))
				if (Number.isInteger(owner) && owner > 0 && Date.now() - statSync(lock).mtimeMs > 30_000) {
					try {
						process.kill(owner, 0)
					} catch (error) {
						if (error.code === 'ESRCH') {
							rmSync(lock)
						}
					}
				}
			} catch (error) {
				if (error.code !== 'ENOENT') {
					throw error
				}
			}
			try {
				writeFileSync(lock, String(process.pid), { flag: 'wx', mode: 0o600 })
				locked = true
			} catch (error) {
				if (error.code !== 'EEXIST') {
					throw error
				}
				return {
					reports: retained(appRoot, run),
					coverage: {
						status: 'partial' as const,
						detail: 'Another reader is retaining reports. Retry to refresh this snapshot.',
					},
				}
			}
			reports.splice(0, reports.length, ...retained(appRoot, run))
			let bytes = reports.reduce((sum, report) => sum + report.bytes, 0)
			for (const { content, ...description } of found.sort((a, b) =>
				b.timestamp.localeCompare(a.timestamp),
			)) {
				const id = `report_${digest(content)}`
				if (reports.some((report) => report.id === id)) {
					continue
				}
				const size = Buffer.byteLength(content)
				if (
					reports.length >= MAX_REPORTS ||
					size > MAX_REPORT_BYTES ||
					bytes + size > MAX_TOTAL_BYTES
				) {
					limited = true
					continue
				}
				const report = {
					...description,
					summary: description.summary.slice(0, 512),
					id,
					bytes: size,
				}
				// Unique temp files and atomic renames permit concurrent readers without
				// making reports share the log writer's rotation or sequence cursor.
				for (const [extension, value] of [
					['txt', content],
					['json', JSON.stringify(report)],
				]) {
					const temp = join(directory, `${id}.${randomUUID()}.tmp`)
					writeFileSync(temp, value, { mode: 0o600 })
					renameSync(temp, join(directory, `${id}.${extension}`))
				}
				reports.push(report)
				bytes += size
			}
		} finally {
			if (locked) {
				rmSync(lock, { force: true })
			}
		}
	}

	if (limited) {
		coverage = {
			status: 'partial',
			detail: `${coverage.detail} Retention limit reached: 10 reports, 4 MiB each, 16 MiB total; oversized reports are omitted intact.`,
		}
	}
	if (reports.length && coverage.status === 'none-found') {
		coverage = { ...coverage, status: 'available' }
	}
	return { reports: reports.sort((a, b) => b.timestamp.localeCompare(a.timestamp)), coverage }
}

/** Read an already retained original; report ids never act as filesystem paths. */
export function readNativeReport(appRoot: string, run: RetainedSession, id: string) {
	if (!REPORT_ID.test(id)) {
		throw contractError('invalid_selection', 'Invalid native report id.')
	}
	const report = retained(appRoot, run).find((report) => report.id === id)
	if (!report) {
		throw contractError('not_found', 'No retained report with this id for the selected run.')
	}
	const content = readBounded(join(rootFor(appRoot, run), `${id}.txt`))
	if (`report_${digest(content)}` !== id) {
		throw contractError('execution_failure', 'Retained report content failed its integrity check.')
	}
	return { ...report, content }
}
