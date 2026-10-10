import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { command } from './process.mjs'

const [target, device, project, appId, url, startupTimeout, deviceKind] = process.argv.slice(2)
const physical = deviceKind === 'physical'
let ownsApp = false
let ownsReverse = false
let devicePid
let stopping = false
const port = new URL(url).port
const adb = (args, options) => command('adb', ['-s', device, ...args], options)
const sim = (args, options) => command('xcrun', ['simctl', ...args], options)
const ctl = (args, options) =>
	command('xcrun', ['devicectl', 'device', ...args, '--device', device], options)

const ns = 'ns'
const env = { ...process.env }
if (target === 'android' && process.platform === 'darwin') {
	env.JAVA_HOME = (await command('/usr/libexec/java_home', ['-v', '21'])).stdout.trim()
}

async function stop() {
	if (stopping) {
		return
	}

	stopping = true
	try {
		if (ownsApp) {
			if (target === 'android') {
				await adb(['shell', 'am', 'force-stop', appId])
			} else if (physical) {
				await ctl(['process', 'terminate', '--pid', String(devicePid)], {
					allowFailure: true,
				}).catch(() => {})
			} else {
				await sim(['terminate', device, appId], { allowFailure: true })
			}
		}

		if (ownsReverse) {
			await adb(['reverse', '--remove', 'tcp:' + port])
		}
	} finally {
		process.exit(0)
	}
}

process.on('SIGINT', stop)
process.on('SIGTERM', stop)

const appsUnder = (dir) =>
	readdir(dir).then((names) => names.filter((name) => name.endsWith('.app')))

try {
	if (target === 'android') {
		const pid = await adb(['shell', 'pidof', appId], { allowFailure: true })
		if (pid.stdout.trim()) {
			throw new Error('Probe app is already running; refusing to replace another session')
		}

		const mappings = await adb(['reverse', '--list'])
		if (mappings.stdout.split('\n').some((line) => line.split(/\s+/).includes('tcp:' + port))) {
			throw new Error('Probe port already has an adb reverse mapping')
		}
	} else if (!physical) {
		const jobs = await sim(['spawn', device, 'launchctl', 'list'])
		if (jobs.stdout.split('\n').some((line) => line.includes(appId) && /^\d+\s/.test(line))) {
			throw new Error('Probe app is already running; refusing to replace another session')
		}
	}

	// Device and simulator artifacts are not interchangeable — key the cache
	// so a physical run never installs a simulator binary.
	const artifactFile = join(project, physical ? '.artifact-device.json' : '.artifact.json')
	let artifact
	if (existsSync(artifactFile)) {
		artifact = JSON.parse(await readFile(artifactFile, 'utf8'))
	}

	if (!artifact || !existsSync(artifact)) {
		if (physical) {
			// Device builds need a signing team: prefer the project
			// build.xcconfig, else the caller's XPLAT_IOS_DEVELOPMENT_TEAM.
			const xcconfig = join(project, 'App_Resources/iOS/build.xcconfig')
			const config = existsSync(xcconfig) ? await readFile(xcconfig, 'utf8') : ''
			const team = process.env.XPLAT_IOS_DEVELOPMENT_TEAM
			if (!/^\s*DEVELOPMENT_TEAM\s*=/m.test(config)) {
				if (!team) {
					throw new Error('Physical iOS probes need a signing team: set XPLAT_IOS_DEVELOPMENT_TEAM')
				}

				await writeFile(xcconfig, config + `\nDEVELOPMENT_TEAM = ${team}\n`)
			}
		}

		await command(
			ns,
			[
				'build',
				target,
				'--path',
				project,
				'--no-hmr',
				...(target === 'ios' ? ['--for-device', physical ? 'true' : 'false'] : []),
			],
			{ cwd: '/tmp', env, timeout: Number(startupTimeout) },
		)

		if (target === 'ios') {
			const dir = join(
				project,
				'platforms/ios/build',
				physical ? 'Debug-iphoneos' : 'Debug-iphonesimulator',
			)

			if (physical) {
				// Device builds archive into an .ipa — the .app left beside it is
				// a broken symlink into DerivedData intermediates.
				const ipas = (await readdir(dir)).filter((name) => name.endsWith('.ipa'))
				if (ipas.length !== 1) {
					throw new Error('Expected exactly one device .ipa artifact')
				}

				artifact = join(dir, ipas[0])
			} else {
				const apps = await appsUnder(dir)
				if (apps.length !== 1) {
					throw new Error('Expected exactly one simulator app artifact')
				}

				artifact = join(dir, apps[0])
			}
		} else {
			const { filesUnder } = await import('./project.mjs')
			const apks = (
				await filesUnder(join(project, 'platforms/android/app/build/outputs/apk/debug'))
			).filter((path) => path.endsWith('.apk'))

			if (apks.length !== 1) {
				throw new Error('Expected exactly one debug APK artifact')
			}

			artifact = apks[0]
		}

		await writeFile(artifactFile, JSON.stringify(artifact))
	}

	if (stopping) {
		process.exit(0)
	}

	if (target === 'android') {
		const installed = await adb(['shell', 'pm', 'path', appId], { allowFailure: true })
		if (!installed.stdout.includes('package:')) {
			await adb(['install', artifact], { timeout: 120000 })
		}

		await adb(['reverse', 'tcp:' + port, 'tcp:' + port])
		ownsReverse = true
		await adb(
			['shell', `run-as ${appId} sh -c 'mkdir -p files && cat > files/probe-session.json'`],
			{
				input: JSON.stringify({ url }),
			},
		)

		ownsApp = true
		await adb(['shell', 'am', 'start', '-n', appId + '/com.tns.NativeScriptActivity'])
	} else if (physical) {
		await ctl(['install', 'app', artifact], { timeout: 180000 })
		ownsApp = true
		const launched = await ctl(
			[
				'process',
				'launch',
				'--environment-variables',
				JSON.stringify({ XPLAT_PROBE_SESSION: JSON.stringify({ url }) }),
				appId,
			],
			{ timeout: 60000 },
		)

		devicePid = Number(launched.stdout.match(/processIdentifier\D*(\d+)/)?.[1])
	} else {
		const installed = await sim(['get_app_container', device, appId, 'data'], {
			allowFailure: true,
		})

		if (installed.code) {
			await sim(['install', device, artifact], { timeout: 120000 })
		}

		const container = (await sim(['get_app_container', device, appId, 'data'])).stdout.trim()
		await mkdir(join(container, 'Documents'), { recursive: true })
		await writeFile(join(container, 'Documents/probe-session.json'), JSON.stringify({ url }))
		ownsApp = true
		await sim(['launch', device, appId])
	}

	console.log('[xplat-probe-host-ready]')
	// Parent owns the lifetime; keep the target lock while probes run.
	setInterval(() => {}, 1000)
} catch (error) {
	console.error(error.message)
	await stop()
}
