// macOS adapter — the AppKit/WKWebView desktop target. Owned launch mirrors
// `xplat dev --targets macos`: apps declaring `xplat.targets.macos.dev` run
// the CLI dev entry (native + webview renderers both); other apps fall back
// to their own `dev` script. Attach binds a running dev entry/host process
// found via pgrep — its scrollback stays in the user's terminal.

import { hostBlock } from '../targets.mjs'
import { contractError } from '../../contracts/errors.mjs'
import { spawnManaged } from '../process.mjs'
import {
	appCliFile,
	assertHost,
	appManifest,
	awaitReady,
	gitRevision,
	hasScript,
	pnpmExec,
	pnpmPrerequisite,
	runToExit,
} from './shared.mjs'

const READY_MARKERS = [
	/\[macos-(native|webview)\] host started/i,
	/\[macos-webview\] frontend/i,
]

const cliPrereq = (app) =>
	appCliFile(app, 'macos', 'dev-entry.mjs')
		? { id: 'xplat-cli', name: '@octane-xplat/cli (installed in app)', status: 'satisfied' }
		: {
				id: 'xplat-cli',
				name: '@octane-xplat/cli (installed in app)',
				status: 'missing',
				remedy: 'Add @octane-xplat/cli to the app\u2019s devDependencies and install.',
			}

export function createMacosAdapter() {
	return {
		platform: 'macos',

		async describe(app, deps) {
			const blocked = hostBlock('macos', deps.host)
			const prereqs = [pnpmPrerequisite(deps), cliPrereq(app)]
			const missing = prereqs.filter((p) => p.status !== 'satisfied')
			const ready = !blocked && missing.length === 0
			return [
				{
					capability: 'target_discovery',
					status: blocked ? 'unavailable' : 'supported',
					detail: blocked ?? 'Single local host target.',
				},
				{
					capability: 'build',
					status: ready ? 'supported' : 'unavailable',
					detail: blocked ?? undefined,
					prerequisites: missing.length ? missing : undefined,
				},
				{
					capability: 'launch',
					status: ready ? 'supported' : 'unavailable',
					detail: blocked ?? undefined,
					prerequisites: missing.length ? missing : undefined,
				},
				{
					capability: 'attach',
					status: blocked ? 'unavailable' : 'partial',
					detail:
						blocked ??
						'Binds a dev process whose command line references the app root; its earlier output stays in the user\u2019s terminal.',
				},
				{ capability: 'logs', status: ready ? 'supported' : 'unavailable' },
			]
		},

		async discoverTargets(app, deps) {
			const blocked = hostBlock('macos', deps.host)
			return {
				targets: blocked
					? []
					: [
							{
								targetId: 'macos',
								name: 'macOS AppKit/WKWebView dev host',
								kind: 'host',
								availability: 'available',
							},
						],
				reason: blocked ?? undefined,
			}
		},

		prerequisites(deps) {
			return [pnpmPrerequisite(deps)]
		},

		async build({ app, logs, signal, report, deps }) {
			assertHost('macos', deps)
			if (!appCliFile(app, 'macos', 'dev-entry.mjs')) {
				throw contractError(
					'prerequisite_missing',
					'The app does not have @octane-xplat/cli installed — macOS packaging runs through it.',
					{ recovery: { action: 'Add @octane-xplat/cli to the app\u2019s devDependencies and install.' } },
				)
			}

			await runToExit({
				command: pnpmExec(['xplat', 'build', '--targets', 'macos']),
				cwd: app.root,
				logs,
				signal,
				report,
				deps,
				phase: 'building',
			})

			return {
				summary: 'xplat build --targets macos succeeded',
				buildIdentity: { revision: gitRevision(app, deps) },
			}
		},

		async launch({ app, logs, signal, report, claim, deps }) {
			assertHost('macos', deps)
			const manifest = appManifest(app)
			const devEntry = appCliFile(app, 'macos', 'dev-entry.mjs')
			let command
			if (manifest.xplat?.targets?.macos?.dev) {
				if (!devEntry) {
					throw contractError(
						'prerequisite_missing',
						'xplat.targets.macos.dev is declared but @octane-xplat/cli is not installed in the app.',
						{ recovery: { action: 'Add @octane-xplat/cli to the app\u2019s devDependencies and install.' } },
					)
				}

				command = { cmd: process.execPath, args: [devEntry, app.root] }
			} else if (hasScript(app, 'dev')) {
				command = { cmd: 'pnpm', args: ['run', 'dev'] }
			} else {
				throw contractError(
					'prerequisite_missing',
					'No macOS dev entry: declare xplat.targets.macos.dev or a package.json "dev" script.',
					{ recovery: { action: 'See the Xplat macOS target guide for dev configuration.' } },
				)
			}

			const child = spawnManaged({
				cmd: command.cmd,
				args: command.args,
				cwd: app.root,
				logBuffer: logs,
				signal,
				spawnImpl: deps.spawn,
			})

			claim({
				describe: () => `macOS dev host (pid ${child.pid})`,
				dispose: async () => {
					await child.stop()
					return `stopped macOS dev host pid ${child.pid}`
				},
			})

			report({ phase: 'starting dev host' })
			await awaitReady({
				child,
				logs,
				markers: READY_MARKERS,
				signal,
				timeoutMs: deps.launchTimeoutMs ?? 300000,
				unreadyDetail:
					'The macOS dev host builds a native bundle on first run; no host-start marker was observed.',
			})

			return {
				detail: 'macOS dev host started',
				processKind: 'fresh',
				readiness: 'confirmed',
				buildIdentity: { revision: gitRevision(app, deps), label: 'macos dev' },
				sessionDetail: 'macOS dev host (appkit-node-api / webview)',
				mainProcess: child,
			}
		},

		async attachables(app, deps) {
			if (deps.host !== 'darwin') {
				return []
			}

			const out = deps.exec('pgrep', ['-fl', app.root.replace(/[.[\]{}()*+?^$\\|]/g, '\\$&')])
			if (!out) {
				return []
			}

			const lines = out.split('\n').filter((l) => l.trim() && !l.includes('pgrep'))
			if (!lines.length) {
				return []
			}

			return [
				{
					targetId: 'macos',
					name: `macOS dev processes referencing ${app.id}`,
					processKind: 'warm',
					pids: lines.map((l) => parseInt(l, 10)).filter(Number.isFinite),
					detail: `${lines.length} process(es) match the app root — identity inferred from the command line`,
				},
			]
		},

		async attach({ target, logs }) {
			logs.note(
				`attached to ${target.name} (pids ${target.pids?.join(', ') ?? '?'}) — process output stays in the user\u2019s terminal; only lifecycle events are captured`,
			)

			return { detail: `attached to ${target.name}` }
		},
	}
}
