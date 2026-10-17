// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
// Web/Chromium adapter. Launch = an owned Vite dev server plus, when a
// Chromium executable is available, an owned browser pointed at it
// (Chromium is the web acceptance target; the DevTools endpoint rides along
// for the inspection adapters). Attach binds an already-running dev server
// by probing candidate ports — identity is a heuristic and says so.

import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromiumExecutable } from '../targets.ts'
import { contractError } from '../../contracts/errors.ts'
import { spawnManaged } from '../process.ts'
import { sleep, urlFromLogs, waitForHttp } from '../readiness.ts'
import { awaitReady, gitRevision, pnpmExec, pnpmPrerequisite } from './shared.ts'

const ATTACH_PORTS = [5200, 5173, 4173, 5201, 3000]

export function createWebAdapter() {
	return {
		platform: 'web',

		async describe(app, deps) {
			const pnpm = pnpmPrerequisite(deps)
			const chromium = chromiumExecutable(deps)
			const ready = pnpm.status === 'satisfied'
			return [
				{ capability: 'target_discovery', status: 'supported' },
				{
					capability: 'build',
					status: ready ? 'supported' : 'unavailable',
					prerequisites: ready ? undefined : [pnpm],
				},
				{
					capability: 'launch',
					status: ready ? 'supported' : 'unavailable',
					detail: chromium
						? 'Owns a Vite dev server and a headless Chromium pointed at it.'
						: 'Owns a Vite dev server. No Chromium executable found — the server URL is reported; browser-side checks need Chromium.',
					prerequisites: [
						...(ready ? [] : [pnpm]),
						...(chromium
							? []
							: [
									{
										id: 'chromium',
										name: 'Chromium browser',
										status: 'unknown',
										remedy:
											'Install Chromium/Chrome or set XPLAT_MCP_CHROMIUM — web acceptance runs against Chromium.',
									},
								]),
					],
				},
				{
					capability: 'attach',
					status: 'partial',
					detail:
						'Attaches to a dev server found by probing local ports; app identity is inferred, not proven.',
				},
				{
					capability: 'logs',
					status: 'partial',
					detail:
						'Owned sessions stream the full dev-server output. Attached sessions capture only post-attach lifecycle events — a server you started keeps its scrollback.',
				},
			]
		},

		async discoverTargets() {
			return {
				targets: [
					{
						targetId: 'web',
						name: 'Vite dev server + Chromium',
						kind: 'browser',
						availability: 'available',
					},
				],
			}
		},

		prerequisites(deps) {
			return [pnpmPrerequisite(deps)]
		},

		async build({ app, logs, signal, report, deps }) {
			const child = spawnManaged({
				...pnpmExec(['vite', 'build']),
				cwd: app.root,
				logBuffer: logs,
				signal,
				spawnImpl: deps.spawn,
			})

			report({ phase: 'building' })
			const { code, error } = await child.exit
			if (error) {
				throw contractError('prerequisite_missing', `Could not run pnpm: ${error.message}`, {
					recovery: { action: 'Install pnpm and the app\u2019s dependencies.' },
				})
			}

			if (code !== 0) {
				throw contractError('execution_failure', `vite build exited ${code}.`, {
					context: { tail: logs.read({ limit: 25 }).records.map((r) => r.line) },
					retryable: false,
				})
			}

			return {
				summary: 'vite build succeeded',
				buildIdentity: { revision: gitRevision(app, deps) },
			}
		},

		async launch({ app, logs, signal, report, claim, deps, browserMode }) {
			const server = spawnManaged({
				...pnpmExec(['vite', '--host', '127.0.0.1']),
				cwd: app.root,
				logBuffer: logs,
				signal,
				spawnImpl: deps.spawn,
			})

			claim({
				describe: () => `vite dev server (pid ${server.pid})`,
				dispose: async () => {
					await server.stop()
					return `stopped vite dev server pid ${server.pid}`
				},
			})

			report({ phase: 'starting dev server' })
			// Vite prints "➜  Local:   http://localhost:PORT/" once serving —
			// a dead process fails fast instead of timing out.
			await awaitReady({
				child: server,
				logs,
				markers: [/Local:\s+(https?:\/\/\S+)/i, /https?:\/\/localhost:\d+/],
				signal,
				timeoutMs: 60000,
				unreadyDetail: 'Vite did not print a local URL — check the session logs.',
			})

			const url = urlFromLogs(logs)
			if (!url) {
				throw contractError('execution_failure', 'Dev server started but no URL was observed.')
			}

			report({ phase: 'waiting for HTTP readiness', message: url })
			try {
				await waitForHttp(url, { timeoutMs: 30000, signal, fetchImpl: deps.fetch })
			} catch (error) {
				if (error.name === 'AbortError') {
					throw error
				}

				throw contractError('timeout', `Dev server at ${url} did not answer HTTP within 30s.`, {
					retryable: true,
					recovery: { action: 'Check the session logs — the app may still be compiling.' },
				})
			}

			const buildIdentity = { revision: gitRevision(app, deps), label: 'vite dev' }
			const browser = await launchChromium(url, { logs, claim, deps, signal, browserMode })
			return {
				detail: `dev server ready at ${url}`,
				url,
				browser,
				processKind: 'fresh',
				buildIdentity,
				readiness: 'confirmed',
				sessionDetail: `web session at ${url}${browser?.devtoolsUrl ? ` (devtools ${browser.devtoolsUrl})` : ''}`,
				mainProcess: server,
			}
		},

		async attachables(app, deps) {
			const found = []
			for (const port of ATTACH_PORTS) {
				const url = `http://127.0.0.1:${port}/`
				try {
					const res = await (deps.fetch ?? fetch)(url, { signal: AbortSignal.timeout(1500) })
					if (res.status < 500) {
						found.push({
							targetId: `web:${port}`,
							name: `dev server on :${port}`,
							detail: `${url} answers HTTP ${res.status} — app identity inferred, not proven`,
							processKind: 'warm',
						})
					}
				} catch {}
			}

			return found
		},

		async attach({ target, logs }) {
			const port = target.targetId.split(':')[1]
			logs.note(
				`attached to pre-existing dev server on :${port} — its earlier output is not captured; only lifecycle events from attach onward are`,
			)

			return { detail: `attached to ${target.name}`, url: `http://127.0.0.1:${port}/` }
		},
	}
}

/** Headless Chromium pointed at the dev URL; reports the DevTools endpoint. */
async function launchChromium(url, { logs, claim, deps, signal, browserMode = 'headless' }) {
	const executable = chromiumExecutable(deps)
	if (!executable) {
		logs.note('no Chromium executable found — server is up; browser-side checks are unavailable')
		return { launched: false, reason: 'chromium-not-found' }
	}

	const profile = mkdtempSync(join(tmpdir(), 'xplat-mcp-chromium-'))
	const browser = spawnManaged({
		cmd: executable,
		args: [
			...(browserMode === 'headed' ? [] : ['--headless=new']),
			'--remote-debugging-port=0',
			'--no-first-run',
			'--no-default-browser-check',
			`--user-data-dir=${profile}`,
			url,
		],
		logBuffer: logs,
		source: 'chromium',
		signal,
		spawnImpl: deps.spawn,
	})

	claim({
		describe: () => `chromium (pid ${browser.pid})`,
		dispose: async () => {
			await browser.stop()
			rmSync(profile, { recursive: true, force: true })
			return `stopped chromium pid ${browser.pid} and removed its profile`
		},
	})

	// DevToolsActivePort lands in the profile dir once CDP is listening.
	let devtoolsUrl = null
	for (let i = 0; i < 40 && !signal?.aborted; i += 1) {
		try {
			const port = readFileSync(join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0].trim()
			if (port) {
				devtoolsUrl = `http://127.0.0.1:${port}`
				break
			}
		} catch {}

		await sleep(250, signal)
	}

	logs.note(
		devtoolsUrl
			? `chromium launched ${browserMode} at ${url}; devtools ${devtoolsUrl}`
			: `chromium launched ${browserMode}; DevTools endpoint was not observed`,
	)

	return { launched: true, headless: browserMode !== 'headed', devtoolsUrl, pid: browser.pid }
}
