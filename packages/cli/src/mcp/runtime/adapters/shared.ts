// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
// Shared helpers for the platform adapters: app metadata, source identity,
// and the command shapes the Xplat CLI uses (mirroring
// packages/cli/src/commands/dev.ts + build.mjs so MCP sessions run the same
// toolchain a developer would).

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'
import { contractError } from '../../contracts/errors.ts'
import { execText, spawnManaged } from '../process.ts'
import { waitForLogMatch } from '../readiness.ts'
import { packageManagerExec, packageManagerFor } from '../../../package-manager.ts'
import { hostBlock } from '../targets.ts'

const readJson = (file) => {
	try {
		return JSON.parse(readFileSync(file, 'utf8'))
	} catch {
		return null
	}
}

/** The app's package.json manifest. */
export const appManifest = (app) => readJson(join(app.root, 'package.json')) ?? {}

/** NativeScript bundle id from nativescript.config.ts (first string in `id:`). */
export function nsAppId(app) {
	const config = join(app.root, 'nativescript.config.ts')
	if (!existsSync(config)) {
		return null
	}

	try {
		const text = readFileSync(config, 'utf8')
		const match = text.match(/\bid\s*:\s*[^'"\n]*['"]([^'"]+)['"]/)
		return match?.[1] ?? null
	} catch {
		return null
	}
}

/** Source revision for build/session provenance; `-dirty` marks uncommitted edits. */
export function gitRevision(app, { exec = execText } = {}) {
	const head = exec('git', ['-C', app.root, 'rev-parse', 'HEAD'])?.trim()
	if (!head) {
		return undefined
	}

	const dirty = exec('git', ['-C', app.root, 'status', '--porcelain'])?.trim()
	return dirty ? `${head}-dirty` : head
}

/** Resolve a file inside the app's own installed @octane-xplat/cli. */
export function appCliFile(app, exportPath, siblingFile) {
	try {
		const require = createRequire(join(app.root, 'package.json'))
		const resolved = require.resolve(`@octane-xplat/cli/${exportPath}`)
		const file = join(dirname(resolved), siblingFile)
		return existsSync(file) ? file : null
	} catch {
		return null
	}
}

/** `bun run …` — resolves binaries from the app's installed dependencies. */
export const appExec = (args, app) =>
	app?.root ? packageManagerExec(app.root, args) : { cmd: 'bun', args: ['run', ...args] }

export const appScript = (name, app) => ({
	cmd: app?.root ? packageManagerFor(app.root) : 'bun',
	args: ['run', name],
})

/** Does the app manifest carry a script? */
export const hasScript = (app, name) => typeof appManifest(app).scripts?.[name] === 'string'

/** Common launch-time prerequisites: the app's package manager must run. */
export function packageManagerPrerequisite({ exec = execText } = {}, app) {
	const manager = app?.root ? packageManagerFor(app.root) : 'bun'
	const out = exec(manager, ['--version'])
	return out
		? { id: manager, name: manager, status: 'satisfied', detail: out.trim() }
		: {
				id: manager,
				name: manager,
				status: 'missing',
				remedy: `Install ${manager} — the runtime adapters use the app's package manager.`,
			}
}

/** `bun run ns run <platform> [--device <id>]` — the same command `xplat dev` spawns. */
export function nsRunCommand(platform, targetId, app) {
	return appExec(['ns', 'run', platform, ...(targetId ? ['--device', targetId] : [])], app)
}

/** `bun run ns build <platform>` — the same command `xplat build` spawns. */
export function nsBuildCommand(platform, app) {
	return appExec(['ns', 'build', platform], app)
}

/** Track coarse launch phases from toolchain output for job progress. */
export function trackPhases(logs, report, phases) {
	return logs.watch((record) => {
		for (const [pattern, phase] of phases) {
			if (pattern.test(record.line)) {
				report({ phase, message: record.line.slice(0, 200) })
				return
			}
		}
	})
}

export const NS_PHASES = [
	[/building|bundling|webpack|vite/i, 'building'],
	[/installing|deploying|copying/i, 'installing'],
	[/successfully synced application|restarting application/i, 'ready'],
]

/** Markers that prove the app actually started on the target. */
export const NS_READY_MARKERS = [
	/successfully synced application/i,
	/restarting application/i,
	/\bCONSOLE (LOG|WARN|ERROR|INFO)\b/,
]

/** Spawn a build-style command to completion; failures carry a log tail. */
export async function runToExit({ command, cwd, logs, signal, report, deps, phase }) {
	const child = spawnManaged({
		cmd: command.cmd,
		args: command.args,
		cwd,
		logBuffer: logs,
		signal,
		spawnImpl: deps.spawn,
	})

	if (phase) {
		report({ phase })
	}

	const { code, error } = await child.exit
	if (error) {
		throw contractError('prerequisite_missing', `Could not run ${command.cmd}: ${error.message}`, {
			recovery: { action: `Install ${command.cmd} and the app\u2019s dependencies.` },
		})
	}

	if (code !== 0) {
		throw contractError(
			'execution_failure',
			`${command.cmd} ${command.args.join(' ')} exited ${code}.`,
			{ context: { tail: logs.read({ limit: 25 }).records.map((r) => r.line) } },
		)
	}
}

/**
 * Launch-style wait: resolve on a readiness marker, fail if the process
 * exits first or the bounded wait expires.
 */
export async function awaitReady({ child, logs, markers, signal, timeoutMs, unreadyDetail }) {
	const exited = child.exit.then(({ code, signal: sig }) => {
		throw contractError(
			'execution_failure',
			`Launch process exited before readiness (code=${code ?? 'null'}${sig ? `, signal=${sig}` : ''}).`,
			{ context: { tail: logs.read({ limit: 25 }).records.map((r) => r.line) } },
		)
	})

	try {
		return await Promise.race([waitForLogMatch(logs, markers, { timeoutMs, signal }), exited])
	} catch (error) {
		if (error.name === 'AbortError' || isTimeout(error)) {
			// Leaving a half-launched owned session running would hide state —
			// stop the launch process and report what was/wasn't confirmed.
			await child.stop()
			throw error.name === 'AbortError'
				? error
				: contractError('timeout', `Readiness was not confirmed within ${timeoutMs}ms.`, {
						retryable: true,
						context: {
							detail: unreadyDetail,
							tail: logs.read({ limit: 25 }).records.map((r) => r.line),
						},
						recovery: {
							action: 'Check the session logs — the app may still be installing on the target.',
						},
					})
		}

		throw error
	}
}

const isTimeout = (error) => error instanceof Error && error.message.startsWith('Readiness marker')

/** Fail fast when this host OS cannot run the platform at all. */
export function assertHost(platform, deps) {
	const blocked = hostBlock(platform, deps.host)
	if (blocked) {
		throw contractError('prerequisite_missing', `${platform} ${blocked}.`, {
			recovery: { action: 'Run this workflow on a matching host or pick another platform.' },
		})
	}
}
