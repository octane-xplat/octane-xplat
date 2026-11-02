// Release-build iOS regression for the packaged conversion engine: builds a
// real NativeScript app on an owned simulator, verifies the shipped engine
// reached the bundle (the native leaf, or the retained TypeScript worker
// research asset when that backend ships), drives tests/runtime.ios.ts, and
// records host-side memory/CPU so bounded-memory and teardown claims carry
// runtime evidence.
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

const { values } = parseArgs({
	options: { 'reuse-build': { type: 'boolean', default: false } },
})

const packageRoot = fileURLToPath(new URL('..', import.meta.url))
const repo = process.env.XPLAT_NATIVE_TEST_REPO ?? join(packageRoot, '../..')
const device = process.env.XPLAT_IOS_DEVICE
assert.ok(
	device && process.platform === 'darwin',
	'Select an owned simulator with XPLAT_IOS_DEVICE',
)
const [bigFrames = 300, bigWidth = 2048, bigHeight = 2048] = (
	process.env.XPLAT_MC_BIG || '300,2048,2048'
)
	.split(',')
	.map(Number)

const { prepare, filesUnder } = await import(
	pathToFileURL(join(repo, 'scripts/probe/project.ts')).href
)
const { command } = await import(pathToFileURL(join(repo, 'scripts/probe/process.ts')).href)
const sim = (args, allowFailure = false) => {
	console.error(`[simctl] ${args.join(' ')}`)
	return command('xcrun', ['simctl', ...args], { allowFailure, timeout: 300000 })
}
const resources = join(packageRoot, 'tests/.runtime/App_Resources')
await cp(join(repo, 'packages/create/template/App_Resources'), resources, { recursive: true })

const rss = (pid) => {
	const out = spawnSync('ps', ['-o', 'rss=', '-p', String(pid)], { encoding: 'utf8' })
	return Number(out.stdout.trim()) || 0
}
const cpu = (pid) => {
	const out = spawnSync('ps', ['-o', '%cpu=', '-p', String(pid)], { encoding: 'utf8' })
	return Number(out.stdout.trim()) || 0
}
const appPid = async (appId) => {
	for (let attempt = 0; attempt < 40; attempt++) {
		const list = await sim(['spawn', device, 'launchctl', 'list'], true)
		const line = list.stdout.split('\n').find((entry) => entry.includes(appId))
		const pid = Number(line?.trim().split(/\s+/)[0])
		if (pid > 0) return pid
		await new Promise((resolve) => setTimeout(resolve, 500))
	}
	return 0
}

let stage = 'prelaunch'
let project
try {
	project = await prepare(
		'ios',
		join(packageRoot, 'tests/runtime.ios.ts'),
		['@octane-xplat/media-converter'],
		resources,
	)
	console.log(JSON.stringify({ project: project.root, appId: project.appId }))
	// prepare() normally boots the development probe host; this fixture owns
	// the release entry and launches it without that host.
	await writeFile(
		join(project.root, 'src/index.ts'),
		'import ' + JSON.stringify(join(packageRoot, 'tests/runtime.ios.ts')) + '\n',
	)
	const output = join(project.root, 'platforms/ios/build/Release-iphonesimulator')
	// Boot issued while the device is still shutting down makes bootstatus wait
	// forever; wait for a settled state first, then boot.
	const deviceState = async () => {
		const list = await sim(['list', 'devices', '-j'], true)
		for (const devices of Object.values(JSON.parse(list.stdout).devices ?? {})) {
			const found = devices.find((entry) => entry.udid === device)
			if (found) return found.state
		}
	}
	for (let attempt = 0; attempt < 120; attempt++) {
		const state = await deviceState()
		if (state === 'Booted') break
		if (state === 'Shutdown') {
			await sim(['boot', device], true)
		}
		await new Promise((resolve) => setTimeout(resolve, 1000))
	}
	// bootstatus -b can wait far beyond install/launch readiness on iOS 27
	// first-boot migration — try it, but proceed once the device is Booted.
	try {
		await command('xcrun', ['simctl', 'bootstatus', device, '-b'], {
			timeout: 90000,
		})
	} catch {
		// Not fully ready yet; install/launch still work on a Booted device.
	}
	if (!values['reuse-build']) {
		const build = await command(
			'ns',
			['build', 'ios', '--path', project.root, '--release', '--for-device', 'false', '--no-hmr'],
			{ cwd: '/tmp', timeout: 600000 },
		)
		await writeFile(
			join(project.root, 'converter-release-build.log'),
			build.stdout + build.stderr,
		)
	}
	const artifact = (await filesUnder(output)).find((file) => file.endsWith('.app/Info.plist'))
	assert.ok(artifact, 'expected an unsigned simulator release app')
	const app = dirname(artifact)

	// The built bundle must contain the real conversion engine: the compiled
	// worker chunk (TypeScript backend) or the packaged Swift leaf linked into
	// the app binary — not a stub or a missing engine.
	const engineChunk = spawnSync('grep', ['-rl', 'readyForMoreMediaData', app], {
		encoding: 'utf8',
	})
	const nativeLeaf = spawnSync('grep', ['-rl', 'XplatMediaConverter', app], {
		encoding: 'utf8',
	})
	assert.ok(
		engineChunk.status === 0 || nativeLeaf.status === 0,
		'release app contains a conversion engine',
	)

	// simctl terminate can hang indefinitely when the target is not running —
	// only terminate a live process (a numeric PID column, not '-'), on a
	// short leash.
	const running = await sim(['spawn', device, 'launchctl', 'list'], true)
	const alive = running.stdout
		.split('\n')
		.some((line) => line.includes(project.appId) && /^\s*\d/.test(line))
	if (alive) {
		await command('xcrun', ['simctl', 'terminate', device, project.appId], {
			allowFailure: true,
			timeout: 20000,
		})
	}
	await sim(['install', device, app])
	const container = (await sim(['get_app_container', device, project.appId, 'data'])).stdout.trim()
	const documents = join(container, 'Documents')
	await mkdir(documents, { recursive: true })
	await writeFile(
		join(documents, 'converter-options.json'),
		JSON.stringify({ frames: bigFrames, width: bigWidth, height: bigHeight, delayMs: 10 }),
	)
	await rm(join(documents, 'converter-result.json'), { force: true })
	await rm(join(documents, 'converter-stage.json'), { force: true })
	// simctl launch stays attached while the app runs — spawn it and poll for
	// the result file instead of awaiting it.
	const launcher = spawn('xcrun', ['simctl', 'launch', device, project.appId], {
		stdio: 'ignore',
		detached: true,
	})
	launcher.unref()

	const samples = []
	const stageBounds = new Map()
	const pid = await appPid(project.appId)
	let result
	const deadline = Date.now() + 15 * 60 * 1000
	while (Date.now() < deadline) {
		if (pid) {
			samples.push({ t: Date.now(), stage, rss: rss(pid), cpu: cpu(pid) })
		}
		try {
			const marker = JSON.parse(
				await readFile(join(documents, 'converter-stage.json'), 'utf8'),
			)
			if (marker.stage !== stage) {
				stageBounds.set(stage, samples.length)
				stage = marker.stage
			}
		} catch {
			// Marker appears once the app writes it.
		}
		try {
			result = JSON.parse(await readFile(join(documents, 'converter-result.json'), 'utf8'))
			break
		} catch (error) {
			if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error
		}
		await new Promise((resolve) => setTimeout(resolve, 200))
	}
	stageBounds.set(stage, samples.length)
	assert.ok(result, 'timed out waiting for converter-result.json')
	assert.equal(result.passed, true, JSON.stringify(result))

	// Attribute peak RSS to each stage window for the qualification report.
	const windows = [...stageBounds.entries()]
	const perStage = {}
	for (let index = 0; index < windows.length; index++) {
		const [name, start] = windows[index]
		const end = windows[index + 1]?.[1] ?? samples.length
		const slice = samples.slice(start, end)
		if (!slice.length || name === 'prelaunch') continue
		perStage[name] = {
			peakRssMB: Math.round(Math.max(...slice.map((s) => s.rss)) / 1024),
			samples: slice.length,
		}
	}
	// CPU growth during the post-cancel window: near zero means the terminated
	// worker isolate actually stopped encoding; a rising value means it ran on.
	const postCancel = samples.slice(stageBounds.get('post-cancel') ?? 0, stageBounds.get('done'))
	const cancelCpu =
		postCancel.length > 1
			? Math.round(
					((postCancel.at(-1).cpu - postCancel[0].cpu) /
						((postCancel.at(-1).t - postCancel[0].t) / 1000)) *
						10,
				) / 10
			: null
	console.log(
		JSON.stringify({ metrics: result.metrics, perStage, postCancelCpuPerSecond: cancelCpu }),
	)
	console.log('IOS_CONVERTER_WORKER_OK')
} finally {
	const result = spawnSync('xcrun', ['simctl', 'terminate', device, project?.appId ?? 'x'], {
		encoding: 'utf8',
		timeout: 30000,
	})
	void result
	await rm(join(packageRoot, 'tests/.runtime'), { recursive: true, force: true })
}
