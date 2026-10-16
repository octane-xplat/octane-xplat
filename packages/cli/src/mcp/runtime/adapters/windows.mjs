// Windows adapter — the WinUI 3 host via `ns run windows`. The runtime path
// only exists on a Windows host; other hosts get an honest unavailable for
// launch while build stays visible with its own prerequisite. Attach
// detection is not yet qualified and says so.

import { hostBlock } from '../targets.mjs'
import { spawnManaged } from '../process.mjs'
import {
	assertHost,
	awaitReady,
	gitRevision,
	NS_PHASES,
	NS_READY_MARKERS,
	nsBuildCommand,
	nsRunCommand,
	pnpmPrerequisite,
	runToExit,
	trackPhases,
} from './shared.mjs'

export function createWindowsAdapter() {
	return {
		platform: 'windows',

		async describe(app, deps) {
			const blocked = hostBlock('windows', deps.host)
			const pnpm = pnpmPrerequisite(deps)
			const ready = !blocked && pnpm.status === 'satisfied'
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
					prerequisites: pnpm.status === 'satisfied' ? undefined : [pnpm],
				},
				{
					capability: 'launch',
					status: ready ? 'supported' : 'unavailable',
					detail: blocked ?? undefined,
					prerequisites: pnpm.status === 'satisfied' ? undefined : [pnpm],
				},
				{
					capability: 'attach',
					status: 'unavailable',
					detail: 'Windows dev-session detection is not qualified yet — no attach provider.',
				},
				{
					capability: 'logs',
					status: ready ? 'supported' : 'unavailable',
					detail: blocked ?? undefined,
				},
			]
		},

		async discoverTargets(app, deps) {
			const blocked = hostBlock('windows', deps.host)
			return {
				targets: blocked
					? []
					: [
							{
								targetId: 'windows',
								name: 'Windows (ns run windows)',
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
			assertHost('windows', deps)
			await runToExit({
				command: nsBuildCommand('windows'),
				cwd: app.root,
				logs,
				signal,
				report,
				deps,
				phase: 'building',
			})

			return {
				summary: 'ns build windows succeeded',
				buildIdentity: { revision: gitRevision(app, deps) },
			}
		},

		async launch({ app, logs, signal, report, claim, deps }) {
			assertHost('windows', deps)
			const child = spawnManaged({
				cmd: 'pnpm',
				args: nsRunCommand('windows', null).args,
				cwd: app.root,
				logBuffer: logs,
				signal,
				spawnImpl: deps.spawn,
			})

			claim({
				describe: () => `ns run windows (pid ${child.pid})`,
				dispose: async () => {
					await child.stop()
					return `stopped ns run windows pid ${child.pid}`
				},
			})

			const unwatch = trackPhases(logs, report, NS_PHASES)
			try {
				await awaitReady({
					child,
					logs,
					markers: NS_READY_MARKERS,
					signal,
					timeoutMs: deps.launchTimeoutMs ?? 480000,
					unreadyDetail: 'No NativeScript ready marker was observed in the ns run output.',
				})
			} finally {
				unwatch()
			}

			return {
				detail: 'ns run windows launched',
				processKind: 'fresh',
				readiness: 'confirmed',
				buildIdentity: { revision: gitRevision(app, deps), label: 'ns run windows' },
				sessionDetail: 'Windows host via ns run',
				mainProcess: child,
			}
		},

		async attachables() {
			return []
		},
	}
}
