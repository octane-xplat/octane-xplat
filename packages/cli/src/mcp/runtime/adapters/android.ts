// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
// Android adapter — NativeScript CLI against adb-visible emulators and
// devices. Owned launch is `ns run android --device <serial>`; attach binds
// a device where the app package is installed and running, with an
// `adb logcat --pid` tap for post-attach output.

import { androidDevices, hostBlock } from '../targets.ts'
import { spawnManaged } from '../process.ts'
import {
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

const adbPrereq = (deps) =>
	deps.exec('adb', ['--version'])
		? { id: 'adb', name: 'Android Debug Bridge', status: 'satisfied' }
		: {
				id: 'adb',
				name: 'Android Debug Bridge',
				status: 'missing',
				remedy: 'Install Android platform-tools (adb on PATH).',
			}

export function createAndroidAdapter() {
	return {
		platform: 'android',

		async describe(app, deps) {
			const blocked = hostBlock('android', deps.host)
			const prereqs = [pnpmPrerequisite(deps), adbPrereq(deps)]
			const missing = prereqs.filter((p) => p.status !== 'satisfied')
			const ready = !blocked && missing.length === 0
			return [
				{
					capability: 'target_discovery',
					status: blocked ? 'unavailable' : 'supported',
					detail: blocked ?? undefined,
				},
				{
					capability: 'build',
					status: ready ? 'supported' : 'unavailable',
					prerequisites: missing.length ? missing : undefined,
				},
				{
					capability: 'launch',
					status: ready ? 'supported' : 'unavailable',
					prerequisites: missing.length ? missing : undefined,
				},
				{
					capability: 'attach',
					status: ready ? 'partial' : 'unavailable',
					detail:
						'Binds a device/emulator where the app package is running; output is captured via an adb logcat tap from attach onward.',
				},
				{ capability: 'logs', status: ready ? 'supported' : 'unavailable' },
			]
		},

		async discoverTargets(app, deps) {
			return androidDevices(deps)
		},

		prerequisites(deps) {
			return [pnpmPrerequisite(deps), adbPrereq(deps)]
		},

		async build({ app, logs, signal, report, deps }) {
			await runToExit({
				command: nsBuildCommand('android'),
				cwd: app.root,
				logs,
				signal,
				report,
				deps,
				phase: 'building',
			})

			return {
				summary: 'ns build android succeeded',
				buildIdentity: { revision: gitRevision(app, deps) },
			}
		},

		async launch({ app, target, logs, signal, report, claim, deps }) {
			const child = spawnManaged({
				cmd: 'pnpm',
				args: nsRunCommand('android', target.targetId).args,
				cwd: app.root,
				logBuffer: logs,
				signal,
				spawnImpl: deps.spawn,
			})

			claim({
				describe: () => `ns run android (pid ${child.pid})`,
				dispose: async () => {
					await child.stop()
					return `stopped ns run android pid ${child.pid} — the app may remain installed/launched on ${target.targetId}`
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
						'Gradle builds and installs in one step — a first run can take several minutes.',
				})
			} finally {
				unwatch()
			}

			return {
				detail: `ns run android launched on ${target.targetId}`,
				processKind: 'fresh',
				readiness: 'confirmed',
				buildIdentity: { revision: gitRevision(app, deps), label: 'ns run android' },
				sessionDetail: `Android target ${target.targetId} via ns run`,
				mainProcess: child,
			}
		},

		async attachables(app, deps) {
			const appId = nsAppId(app)
			if (!appId) {
				return []
			}

			const { targets } = androidDevices(deps)
			const found = []
			for (const device of targets) {
				const installed = deps
					.exec('adb', ['-s', device.targetId, 'shell', 'pm', 'list', 'packages', appId])
					?.includes(appId)

				if (!installed) {
					continue
				}

				const pid = deps.exec('adb', ['-s', device.targetId, 'shell', 'pidof', '-s', appId])?.trim()

				if (!pid) {
					continue // installed but not running
				}

				found.push({
					targetId: device.targetId,
					name: `${device.name} — ${appId} running (pid ${pid})`,
					processKind: 'warm',
					pid,
					detail: `${appId} is running on this target`,
				})
			}

			return found
		},

		async attach({ target, logs, claim, deps }) {
			const tap = spawnManaged({
				cmd: 'adb',
				args: ['-s', target.targetId, 'logcat', '--pid', target.pid],
				logBuffer: logs,
				source: 'adb-logcat',
				spawnImpl: deps.spawn,
			})

			claim({
				describe: () => `adb logcat (pid ${tap.pid})`,
				dispose: async () => {
					await tap.stop()
					return `stopped adb logcat pid ${tap.pid}`
				},
			})

			logs.note(
				`attached to ${target.name}; logcat filtered to pid ${target.pid} — earlier output is not captured`,
			)

			return { detail: `attached to ${target.name}` }
		},
	}
}
