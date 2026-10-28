// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
import { sourceIdentity } from './capture-manifest.ts'
import { spawn, spawnSync, execFileSync } from 'node:child_process'
import { createServer } from 'node:http'
import { randomUUID, createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { comparePixels, validateCapture } from './parity.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repository = resolve(root, '../..')
const webOnly = process.argv.includes('--web-only')
const device = process.argv.find((arg) => arg.startsWith('--device='))?.slice(9)
if (!webOnly && (!device || !/^[0-9A-F-]{36}$/i.test(device))) {
	throw new Error('Pass --device=SIMULATOR_UDID for the authorized iOS simulator')
}

if (!webOnly && !process.argv.includes('--reserved')) {
	const result = spawnSync(
		'goddard-agent',
		[
			'resource',
			'run',
			'--json',
			JSON.stringify({
				resources: { native_builds: 1, resident_devices: 1, exclusive: [`ios:${device}`] },
				purpose: 'Switch real iOS/web capture qualification',
			}),
			'--',
			process.execPath,
			fileURLToPath(import.meta.url),
			...process.argv.slice(2),
			'--reserved',
		],
		{ stdio: 'inherit' },
	)

	process.exit(result.status ?? 1)
}

const mobilePackage = JSON.parse(readFileSync(join(repository, 'apps/mobile/package.json')))
const visualPackage = JSON.parse(readFileSync(join(root, 'package.json')))
const manifest = {
	runId: randomUUID(),
	...sourceIdentity(),
	device,
	scope: 'milestone-3-web-ios-spike',
	productRequiredTargets: ['web', 'ios', 'android', 'macos', 'windows', 'linux'],
	qualificationTargets: ['web', 'ios'],
	toolchain: {
		nativeCore: mobilePackage.dependencies['@nativescript/core'],
		nativeIOS: mobilePackage.devDependencies['@nativescript/ios'],
		nativeOctane: mobilePackage.dependencies['@nativescript-community/octane'],
		octane: mobilePackage.dependencies.octane,
		storybook: mobilePackage.devDependencies.storybook,
		playwright: visualPackage.devDependencies.playwright,
	},
}

function baselineHashes(directory = join(root, 'vis'), hashes = {}) {
	if (!existsSync(directory)) {
		return hashes
	}

	for (const entry of readdirSync(directory, { withFileTypes: true })) {
		const path = join(directory, entry.name)
		if (entry.isDirectory()) {
			if (!['__results__', '__diffs__'].includes(entry.name)) {
				baselineHashes(path, hashes)
			}
		} else if (path.includes('__baselines__') || path.includes('/vis/common/')) {
			hashes[path] = createHash('sha256').update(readFileSync(path)).digest('hex')
		}
	}

	return hashes
}

const originalBaselines = baselineHashes()
const output = resolve(process.env.VIS_CAPTURE_DIR || join(root, 'artifacts', manifest.runId))
mkdirSync(dirname(output), { recursive: true })
mkdirSync(output)
writeFileSync(join(output, 'manifest.json'), JSON.stringify(manifest, null, 2))
let child
let cancelled = false
const captures = new Map()
for (const signal of ['SIGINT', 'SIGTERM']) {
	process.once(signal, () => {
		cancelled = true
		child?.kill('SIGTERM')
		if (originalProject) {
			writeFileSync(projectPath, originalProject)
		}

		server.closeAllConnections()
	})
}

const server = createServer(async (request, response) => {
	response.setHeader('Access-Control-Allow-Origin', '*')
	response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
	if (request.method === 'OPTIONS') {
		response.end()
		return
	}

	try {
		if (request.method !== 'POST') {
			throw new Error('Capture endpoint accepts POST only')
		}

		let body = ''
		for await (const chunk of request) {
			body += chunk
			if (body.length > 1000000) {
				throw new Error('Capture payload too large')
			}
		}

		const capture = {
			...JSON.parse(body),
			sourceDirty: manifest.sourceDirty,
			toolchain: manifest.toolchain,
		}

		validateCapture(capture, manifest)
		const key = `${capture.target}-${capture.index}`
		if (captures.has(key)) {
			throw new Error('Duplicate capture')
		}

		if (
			!Number.isInteger(capture.index) ||
			capture.index < 0 ||
			capture.index > (capture.target === 'ios' ? 3 : 1)
		) {
			throw new Error('Unexpected capture index')
		}

		const expectedDisplacement = capture.index === (capture.target === 'ios' ? 3 : 1) ? 1 : 0
		if (capture.displacement !== expectedDisplacement) {
			throw new Error('Unexpected rendered displacement')
		}

		captures.set(key, capture)
		writeFileSync(join(output, `${key}.json`), JSON.stringify(capture, null, 2))
		writeFileSync(join(output, `${key}.png`), Buffer.from(capture.pngBase64, 'base64'))
		response.end('saved')
	} catch (error) {
		response.statusCode = 400
		response.end(error.message)
	}
})

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const env = {
	...process.env,
	VISUAL_CAPTURE_URL: `http://127.0.0.1:${server.address().port}`,
	VISUAL_RUN_ID: manifest.runId,
	VISUAL_REVISION: manifest.revision,
	VISUAL_SCENARIO_HASH: manifest.scenarioHash,
}

function run(command, args, cwd, extra = {}) {
	if (cancelled) {
		return Promise.reject(new Error('Capture run cancelled'))
	}

	return new Promise((resolveRun, reject) => {
		child = spawn(command, args, {
			cwd,
			env: { ...env, ...extra },
			stdio: ['ignore', 'pipe', 'pipe'],
		})

		let log = ''
		for (const stream of [child.stdout, child.stderr]) {
			stream.on('data', (chunk) => {
				log += chunk
				process.stdout.write(chunk)
			})
		}

		const timer = setTimeout(() => child.kill('SIGTERM'), 1800000)
		child.on('error', reject)
		child.on('close', (code) => {
			clearTimeout(timer)
			writeFileSync(join(output, `command-${Date.now()}.log`), log)
			child = undefined
			if (code === 0) {
				resolveRun()
			} else {
				reject(new Error(`${command} ${args.join(' ')} exited ${code}`))
			}
		})
	})
}

let originalProject
const projectPath = join(repository, 'apps/mobile/platforms/ios/mobile.xcodeproj/project.pbxproj')
let bootedByUs = false
let phase = 'launch'
try {
	if (!webOnly) {
		const devices = JSON.parse(
			execFileSync('xcrun', ['simctl', 'list', 'devices', 'available', '-j'], { encoding: 'utf8' }),
		)

		const selected = Object.values(devices.devices)
			.flat()
			.find((item) => item.udid === device)

		if (!selected) {
			throw new Error('Selected simulator is unavailable')
		}

		if (selected.state === 'Booted' && !process.argv.includes('--use-booted')) {
			throw new Error('Already booted device requires explicit --use-booted authorization')
		}

		if (selected.state !== 'Booted') {
			execFileSync('xcrun', ['simctl', 'boot', device])
			bootedByUs = true
			execFileSync('xcrun', ['simctl', 'bootstatus', device, '-b'])
		}

		await run('pnpm', ['gen:app'], repository)
		phase = 'ios-build'
		// Changing the config's environment-selected ID does not update an already
		// materialized Xcode project. Limit the override to this generated app target.
		if (!existsSync(projectPath)) {
			await run(
				'pnpm',
				['exec', 'ns', 'prepare', 'ios', '--env.unitTesting'],
				join(repository, 'apps/mobile'),
				{
					XPLAT_VLIST_APP_ID: process.env.XPLAT_VLIST_APP_ID ?? 'org.nativescript.xplat',
				},
			)
		}

		originalProject = readFileSync(projectPath)
		execFileSync(
			'ruby',
			[
				'-rxcodeproj',
				'-e',
				"project = Xcodeproj::Project.open(ARGV[0]); project.targets.select { |t| t.name == 'mobile' }.each { |t| t.build_configurations.each { |c| c.build_settings['PRODUCT_BUNDLE_IDENTIFIER'] = 'org.nativescript.xplat.visual' } }; project.save",
				dirname(projectPath),
			],
			{ cwd: repository },
		)

		// ns run can reuse a binary built under the ordinary harness bundle ID.
		// Build the isolated visual ID first; the runner then injects its live port.
		await run(
			'pnpm',
			['exec', 'ns', 'build', 'ios', '--env.unitTesting'],
			join(repository, 'apps/mobile'),
			{
				XPLAT_VLIST_APP_ID: 'org.nativescript.xplat.visual',
			},
		)

		phase = 'ios-capture'
		await run(
			'pnpm',
			['exec', 'vitest', 'run', 'src/tests/visual/capture.ios.spec.tsrx'],
			join(repository, 'apps/mobile'),
			{
				NS_PLATFORM: 'ios',
				NS_DEVICE: device,
				XPLAT_VLIST_APP_ID: 'org.nativescript.xplat.visual',
			},
		)
	}

	phase = 'web-capture'
	await run('pnpm', ['exec', 'vitest', 'run', 'capture.test'], root)
	phase = 'stability'
	for (const index of webOnly ? [] : [1, 2]) {
		const a = validateCapture(captures.get('ios-0'), manifest)
		const b = validateCapture(captures.get(`ios-${index}`), manifest)
		if (comparePixels(a, b).differentPixels !== 0) {
			throw new Error(`Unstable iOS capture ${index}`)
		}
	}

	phase = 'sensitivity'
	for (const diagnostic of webOnly
		? ['opaque-pixel', 'web-displacement']
		: ['opaque-pixel', 'web-displacement', 'ios-displacement']) {
		const result = spawnSync(
			process.execPath,
			['scripts/parity.ts', `--captures=${output}`, `--diagnostic=${diagnostic}`],
			{ cwd: root, encoding: 'utf8' },
		)

		process.stdout.write(result.stdout + result.stderr)
		const report = JSON.parse(readFileSync(join(output, `${diagnostic}-report.json`)))
		if (result.status !== 1 || report.status !== 'divergence' || report.differentPixels === 0) {
			throw new Error(`${diagnostic} did not fail with divergent pixels`)
		}
	}

	if (webOnly || process.argv.includes('--capture-only')) {
		writeFileSync(
			join(output, 'capture-report.json'),
			JSON.stringify(
				{ phase, status: 'captured-only', regression: 'not-run', parity: 'not-run', ...manifest },
				null,
				2,
			),
		)
	} else {
		phase = 'regression'
		await run('pnpm', ['exec', 'vitest', 'run', 'web.test', '--update=false'], root)
		for (const index of [0, 1, 2]) {
			await run('pnpm', ['exec', 'vitest', 'run', 'ios-regression.test', '--update=false'], root, {
				VIS_ROOT: 'vis/ios',
				VIS_IOS_CAPTURE: join(output, `ios-${index}.json`),
			})
		}

		phase = 'parity'
		await run(process.execPath, ['scripts/parity.ts', `--captures=${output}`], root)
		writeFileSync(
			join(output, 'capture-report.json'),
			JSON.stringify({ phase, status: 'pass', ...manifest }, null, 2),
		)
	}
} catch (error) {
	writeFileSync(
		join(output, 'capture-report.json'),
		JSON.stringify({ phase, status: 'failure', error: error.message, ...manifest }, null, 2),
	)

	console.error(`${phase} failure: ${error.message}`)
	process.exitCode = 1
} finally {
	child?.kill('SIGTERM')
	if (originalProject) {
		writeFileSync(projectPath, originalProject)
	}

	server.closeAllConnections()
	await new Promise((resolveClose) => server.close(resolveClose))
	if (bootedByUs) {
		execFileSync('xcrun', ['simctl', 'shutdown', device])
	}

	const finalBaselines = baselineHashes()
	const unchangedBaselines = JSON.stringify(originalBaselines) === JSON.stringify(finalBaselines)

	writeFileSync(
		join(output, 'baseline-integrity.json'),
		JSON.stringify(
			{ unchanged: unchangedBaselines, before: originalBaselines, after: finalBaselines },
			null,
			2,
		),
	)

	if (!unchangedBaselines) {
		process.exitCode = 1
		console.error('Baseline safety failure: ordinary capture run changed baseline files')
	}

	console.log(`Immutable capture evidence: ${output}`)
}
