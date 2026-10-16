// Linux adapter — the WebKitGTK/GJS webview target. The dev entry is the
// app's own `dev` script (`xplat dev` delegates to it the same way);
// packaging runs through the app's installed @octane-xplat/cli. Launch needs
// a Linux host — other hosts report an honest unavailable rather than a
// fake-ready target.

import { hostBlock } from '../targets.mjs'
import { contractError } from '../../contracts/errors.mjs'
import { spawnManaged } from '../process.mjs'
import {
	appCliFile,
	assertHost,
	awaitReady,
	gitRevision,
	hasScript,
	pnpmExec,
	pnpmPrerequisite,
	runToExit,
} from './shared.mjs'

export function createLinuxAdapter() {
	return {
		platform: 'linux',

		async describe(app, deps) {
			const blocked = hostBlock('linux', deps.host)
			const pnpm = pnpmPrerequisite(deps)
			const ready = !blocked && pnpm.status === 'satisfied' && hasScript(app, 'dev')
			return [
				{
					capability: 'target_discovery',
					status: blocked ? 'unavailable' : 'supported',
					detail: blocked ?? 'Single local host target.',
				},
				{
					capability: 'build',
					status: appCliFile(app, 'linux', 'package.mjs') ? 'supported' : 'unavailable',
					prerequisites: pnpm.status === 'satisfied' ? undefined : [pnpm],
				},
				{
					capability: 'launch',
					status: ready ? 'supported' : 'unavailable',
					detail:
						blocked ??
						(hasScript(app, 'dev')
							? 'Runs the app\u2019s dev script — readiness is the first URL the script prints.'
							: 'The app\u2019s package.json has no "dev" script to launch.'),
					prerequisites: pnpm.status === 'satisfied' ? undefined : [pnpm],
				},
				{
					capability: 'attach',
					status: blocked ? 'unavailable' : 'partial',
					detail:
						blocked ??
						'Binds a dev process whose command line references the app root; its earlier output stays in the user\u2019s terminal.',
				},
				{
					capability: 'logs',
					status: ready ? 'supported' : 'unavailable',
					detail: blocked ?? undefined,
				},
			]
		},

		async discoverTargets(app, deps) {
			const blocked = hostBlock('linux', deps.host)
			return {
				targets: blocked
					? []
					: [
							{
								targetId: 'linux',
								name: 'Linux WebKitGTK webview dev host',
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
			if (!appCliFile(app, 'linux', 'package.mjs')) {
				throw contractError(
					'prerequisite_missing',
					'The app does not have @octane-xplat/cli installed — Linux packaging runs through it.',
					{
						recovery: {
							action: 'Add @octane-xplat/cli to the app\u2019s devDependencies and install.',
						},
					},
				)
			}

			await runToExit({
				command: pnpmExec(['xplat', 'build', '--targets', 'linux']),
				cwd: app.root,
				logs,
				signal,
				report,
				deps,
				phase: 'building',
			})

			return {
				summary: 'xplat build --targets linux succeeded',
				buildIdentity: { revision: gitRevision(app, deps) },
			}
		},

		async launch({ app, logs, signal, report, claim, deps }) {
			assertHost('linux', deps)
			if (!hasScript(app, 'dev')) {
				throw contractError(
					'prerequisite_missing',
					'The app\u2019s package.json has no "dev" script — the Linux webview dev entry is app-owned.',
					{ recovery: { action: 'Add a "dev" script that starts the WebKitGTK host.' } },
				)
			}

			const child = spawnManaged({
				cmd: 'pnpm',
				args: ['run', 'dev'],
				cwd: app.root,
				logBuffer: logs,
				signal,
				spawnImpl: deps.spawn,
			})

			claim({
				describe: () => `linux dev script (pid ${child.pid})`,
				dispose: async () => {
					await child.stop()
					return `stopped linux dev script pid ${child.pid}`
				},
			})

			report({ phase: 'starting dev script' })
			await awaitReady({
				child,
				logs,
				markers: [/https?:\/\/(?:localhost|127\.0\.0\.1)/, /webview|host started|ready/i],
				signal,
				timeoutMs: deps.launchTimeoutMs ?? 180000,
				unreadyDetail:
					'No dev-server URL or host-start marker was observed in the app\u2019s dev script output.',
			})

			return {
				detail: 'linux dev script reports ready',
				processKind: 'fresh',
				readiness: 'confirmed',
				buildIdentity: { revision: gitRevision(app, deps), label: 'linux dev' },
				sessionDetail: 'Linux WebKitGTK webview dev host',
				mainProcess: child,
			}
		},

		async attachables(app, deps) {
			if (deps.host !== 'linux') {
				return []
			}

			const out = deps.exec('pgrep', ['-fl', app.root.replace(/[.[\]{}()*+?^$\\|]/g, '\\$&')])
			const lines = out?.split('\n').filter((l) => l.trim() && !l.includes('pgrep')) ?? []
			if (!lines.length) {
				return []
			}

			return [
				{
					targetId: 'linux',
					name: `linux dev processes referencing ${app.id}`,
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
