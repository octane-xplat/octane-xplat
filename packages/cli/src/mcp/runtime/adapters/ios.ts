// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
// iOS adapter — NativeScript CLI on simulators. Discovery mirrors
// packages/cli/src/targets.ts (simctl only; physical devices stay out of
// scope). Owned launch is `ns run ios --device <udid>`; attach binds a
// booted simulator where the app is installed AND running, with a
// `simctl log stream` tap for post-attach output.

import { prepareIosSimulator } from '../../../ios-simulator.ts'
import { basename } from 'node:path'
import { spawnManaged } from '../process.ts'
import { hostBlock, iosSimulators } from '../targets.ts'
import {
	assertHost,
	awaitReady,
	gitRevision,
	NS_PHASES,
	NS_READY_MARKERS,
	nsAppId,
	nsBuildCommand,
	nsRunCommand,
	pnpmPrerequisite,
	runToExit,
	trackPhases,
} from './shared.ts'

const xcodePrereq = (deps) =>
	deps.exec('xcodebuild', ['-version'])
		? { id: 'xcode', name: 'Xcode command line tools', status: 'satisfied' }
		: {
				id: 'xcode',
				name: 'Xcode command line tools',
				status: 'missing',
				remedy: 'Install Xcode and run `xcode-select --install`.',
			}

export function createIosAdapter() {
	return {
		platform: 'ios',

		async describe(app, deps) {
			const blocked = hostBlock('ios', deps.host)
			const prereqs = [pnpmPrerequisite(deps), xcodePrereq(deps)]
			const missing = prereqs.filter((p) => p.status !== 'satisfied')
			const ready = !blocked && missing.length === 0
			const detail = blocked ?? undefined
			return [
				{
					capability: 'target_discovery',
					status: blocked ? 'unavailable' : 'supported',
					detail,
				},
				{
					capability: 'build',
					status: ready ? 'supported' : 'unavailable',
					detail,
					prerequisites: missing.length ? missing : undefined,
				},
				{
					capability: 'launch',
					status: ready ? 'supported' : 'unavailable',
					detail,
					prerequisites: missing.length ? missing : undefined,
				},
				{
					capability: 'attach',
					status: blocked ? 'unavailable' : 'partial',
					detail:
						blocked ??
						'Binds a booted simulator where the app is installed and running; output is captured via a simctl log-stream tap from attach onward.',
				},
				{ capability: 'logs', status: ready ? 'supported' : 'unavailable', detail },
			]
		},

		async discoverTargets(app, deps) {
			return iosSimulators(deps)
		},

		prerequisites(deps) {
			return [pnpmPrerequisite(deps), xcodePrereq(deps)]
		},

		async build({ app, logs, signal, report, deps }) {
			assertHost('ios', deps)
			await runToExit({
				command: nsBuildCommand('ios'),
				cwd: app.root,
				logs,
				signal,
				report,
				deps,
				phase: 'building',
			})

			return {
				summary: 'ns build ios succeeded',
				buildIdentity: { revision: gitRevision(app, deps) },
			}
		},

		async launch({ app, target, logs, signal, report, claim, deps }) {
			assertHost('ios', deps)
			prepareIosSimulator(target.targetId, deps.execCommand ?? deps.exec)
			const child = spawnManaged({
				cmd: 'pnpm',
				args: nsRunCommand('ios', target.targetId).args,
				cwd: app.root,
				logBuffer: logs,
				signal,
				spawnImpl: deps.spawn,
			})

			claim({
				describe: () => `ns run ios (pid ${child.pid})`,
				dispose: async () => {
					await child.stop()
					return `stopped ns run ios pid ${child.pid} — the app may remain installed/launched on ${target.targetId}`
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
					unreadyDetail:
						'NativeScript builds, installs and syncs in one step — a first run can take several minutes.',
				})
			} finally {
				unwatch()
			}

			return {
				detail: `ns run ios launched on ${target.targetId}`,
				processKind: 'fresh',
				readiness: 'confirmed',
				buildIdentity: { revision: gitRevision(app, deps), label: 'ns run ios' },
				sessionDetail: `iOS simulator ${target.targetId} via ns run`,
				mainProcess: child,
			}
		},

		async attachables(app, deps) {
			const appId = nsAppId(app)
			if (!appId) {
				return []
			}

			const { targets } = iosSimulators(deps)
			const found = []
			for (const sim of targets.filter((t) => t.booted)) {
				const container = deps
					.exec('xcrun', ['simctl', 'get_app_container', sim.targetId, appId, 'app'])
					?.trim()

				if (!container) {
					continue
				}

				const jobs = deps.exec('xcrun', ['simctl', 'spawn', sim.targetId, 'launchctl', 'list'])
				if (!jobs?.includes(appId)) {
					continue // installed but not running — launch handles it
				}

				found.push({
					targetId: sim.targetId,
					name: `${sim.name} — ${appId} running`,
					processKind: 'warm',
					executable: basename(container, '.app'),
					detail: `${appId} is running on this booted simulator`,
				})
			}

			return found
		},

		async attach({ target, logs, claim, deps }) {
			// The user owns the app process; our only owned resource is the
			// log-stream tap, which ends with the session.
			const tap = spawnManaged({
				cmd: 'xcrun',
				args: [
					'simctl',
					'spawn',
					target.targetId,
					'log',
					'stream',
					'--level',
					'info',
					'--predicate',
					`processImagePath CONTAINS[c] "${target.executable}"`,
				],
				logBuffer: logs,
				source: 'simctl-log',
				spawnImpl: deps.spawn,
			})

			claim({
				describe: () => `simctl log stream (pid ${tap.pid})`,
				dispose: async () => {
					await tap.stop()
					return `stopped simctl log stream pid ${tap.pid}`
				},
			})

			logs.note(
				`attached to ${target.name}; log stream filtered to ${target.executable} — earlier output is not captured`,
			)

			return { detail: `attached to ${target.name}` }
		},

		appIdHint: nsAppId,
	}
}
