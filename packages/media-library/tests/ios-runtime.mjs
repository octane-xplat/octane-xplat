import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { createDialogDriver } from './ios-dialogs.mjs'
import { cp, mkdir, readFile, realpath, symlink, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const packageRoot = fileURLToPath(new URL('..', import.meta.url))
const repo = resolve(process.env.XPLAT_NATIVE_TEST_REPO ?? join(packageRoot, '../..'))
const device = process.env.XPLAT_IOS_DEVICE
assert.ok(device, 'Select the task-owned simulator using XPLAT_IOS_DEVICE')
function run(command, args, options = {}) {
	const result = spawnSync(command, args, {
		encoding: 'utf8',
		maxBuffer: 8 * 1024 * 1024,
		...options,
	})
	assert.equal(result.status, 0, `${result.stdout ?? ''}${result.stderr ?? ''}`)
	return result.stdout
}
const devices = JSON.parse(run('xcrun', ['simctl', 'list', 'devices', '--json']))
const selected = Object.values(devices.devices)
	.flat()
	.find((item) => item.udid === device)
assert.ok(
	selected?.state === 'Booted' && selected.name.startsWith('Xplat'),
	'Use a booted task-owned Xplat simulator',
)
for (const [name, source] of [
	['@nativescript/core', join(repo, 'apps/mobile/node_modules/@nativescript/core')],
	['@octane-xplat/lib', process.env.XPLAT_IMAGE_LIB_ROOT ?? join(repo, 'packages/lib')],
]) {
	const destination = join(packageRoot, 'node_modules', name)
	await mkdir(resolve(destination, '..'), { recursive: true })
	try {
		await symlink(await realpath(source), destination, 'dir')
	} catch (error) {
		if (error.code !== 'EEXIST') {
			throw error
		}
	}
}
const resources = join(packageRoot, 'tests/.runtime/App_Resources')
await cp(join(repo, 'apps/mobile/App_Resources'), resources, {
	recursive: true,
	filter: (path) => !path.endsWith('google-services.json'),
})
const plist = join(resources, 'iOS/Info.plist')
let text = await readFile(plist, 'utf8')
for (const key of ['NSPhotoLibraryUsageDescription', 'NSPhotoLibraryAddUsageDescription']) {
	if (!text.includes(`<key>${key}</key>`)) {
		text = text.replace(
			'<dict>',
			`<dict>\n<key>${key}</key><string>Test disposable media created by this simulator fixture.</string>`,
		)
	}
}
await writeFile(plist, text)
const caseFile = join(packageRoot, 'tests/runtime.ios.ts')
const { prepare } = await import(pathToFileURL(join(repo, 'scripts/probe/project.ts')).href)
const project = await prepare('ios', caseFile, ['@octane-xplat/lib'], resources)
const privacy = (action, service) =>
	run('xcrun', ['simctl', 'privacy', device, action, service, project.appId])
const installed = spawnSync(
	'xcrun',
	['simctl', 'get_app_container', device, project.appId, 'app'],
	{ encoding: 'utf8' },
)
if (installed.status === 0) {
	privacy('reset', 'photos')
	privacy('reset', 'photos-add')
	const container = run('xcrun', [
		'simctl',
		'get_app_container',
		device,
		project.appId,
		'data',
	]).trim()
	await mkdir(join(container, 'Documents'), { recursive: true })
	await writeFile(join(container, 'Documents/media-library-test-phase.txt'), 'initial')
}
let dialogs
function flatten(node) {
	if (!node || typeof node !== 'object') {
		return []
	}
	return [node, ...(node.children ?? []).flatMap(flatten)]
}
async function handleDialog() {
	if (!dialogs) {
		return []
	}
	let step
	try {
		const container = run('xcrun', [
			'simctl',
			'get_app_container',
			device,
			project.appId,
			'data',
		]).trim()
		step = JSON.parse(
			await readFile(join(container, 'Documents/media-library-test-step.json'), 'utf8'),
		)
	} catch {
		step = null
	}
	if (!step || !(step.step === 'request-permission' || step.step.startsWith('delete-'))) {
		return []
	}
	const hierarchy = await dialogs.hierarchy()
	const nodes = flatten(hierarchy.axElement)
	const labels = nodes.map((node) => String(node.label ?? '')).filter(Boolean)
	const text = labels.join(' ')
	const authorized = text.includes('Test disposable media created by this simulator fixture.')
	const button = nodes.find((node) => {
		const label = String(node.label ?? '')
		if (
			authorized &&
			/^(Allow Full Access|Allow Access to All Photos|Allow Access to All Photos and Videos)$/.test(
				label,
			)
		) {
			return true
		}
		if (!step?.step?.startsWith('delete-') || !text.includes(step.name)) {
			return false
		}
		if (step.step === 'delete-albums' && !text.includes(`Xplat fixture ${step.nonce}`)) {
			return false
		}
		return new RegExp(`^Delete(?: ${step.count} (?:Photos?|Videos?|Albums?|Items?))?$`, 'i').test(
			label,
		)
	})
	if (!button) {
		return labels
	}
	const frame = button.frame ?? {}
	const x = Number(frame.x ?? frame.X),
		y = Number(frame.y ?? frame.Y)
	const width = Number(frame.width ?? frame.Width),
		height = Number(frame.height ?? frame.Height)
	assert.ok(
		[x, y, width, height].every(Number.isFinite) && width > 0 && height > 0,
		'AX button bounds must be valid',
	)
	await dialogs.tap(x + width / 2, y + height / 2)
	console.log('Confirmed owned fixture dialog through accessibility: ' + button.label)
	return labels
}
async function probe() {
	const child = spawn(
		'bun',
		[
			'probe',
			'run',
			caseFile,
			'--target',
			'ios',
			'--device',
			device,
			'--deps',
			'@octane-xplat/lib',
			'--resources',
			resources,
			'--timeout',
			'45000',
			'--startup-timeout',
			'180000',
		],
		{ cwd: repo, stdio: ['ignore', 'pipe', 'pipe'] },
	)
	let stdout = '',
		stderr = '',
		done = false,
		lastLabels = []
	child.stdout.on('data', (data) => {
		stdout += data
	})
	child.stderr.on('data', (data) => {
		stderr += data
	})
	const exited = new Promise((resolve, reject) => {
		child.once('error', reject)
		child.once('close', (code) => {
			done = true
			resolve(code)
		})
	})
	const timer = setTimeout(() => child.kill('SIGTERM'), 240000)
	try {
		while (!done) {
			await delay(500)
			if (done) {
				break
			}
			try {
				lastLabels = await handleDialog()
			} catch (error) {
				if (!done) {
					lastLabels = [`Accessibility query: ${error.message}`]
				}
			}
		}
		const code = await exited
		assert.equal(
			code,
			0,
			`${stdout}${stderr}\nLast accessibility labels: ${JSON.stringify(lastLabels)}`,
		)
		const report = JSON.parse(stdout.slice(stdout.indexOf('{')))
		assert.equal(report.results.length, 1)
		assert.equal(report.results[0].status, 'pass', JSON.stringify(report.results[0]))
		return report.results[0]
	} finally {
		clearTimeout(timer)
		if (!done) {
			child.kill('SIGTERM')
			await exited
		}
	}
}
try {
	const initial = await probe()
	assert.equal(
		initial.measurements.identifier,
		project.appId,
		'Privacy changes must target the running fixture app',
	)
	assert.equal(initial.measurements.phase, 'no-access')
	assert.equal(initial.measurements.permission, 'undetermined')
	const container = run('xcrun', [
		'simctl',
		'get_app_container',
		device,
		project.appId,
		'data',
	]).trim()
	await writeFile(join(container, 'Documents/media-library-test-phase.txt'), 'authorized')
	// PhotoKit can retain authorization state in a resident app process.
	spawnSync('xcrun', ['simctl', 'terminate', device, project.appId], { encoding: 'utf8' })
	privacy('grant', 'photos')
	privacy('grant', 'photos-add')
	dialogs = await createDialogDriver(device)
	const authorized = await probe()
	assert.equal(authorized.measurements.phase, 'assets', JSON.stringify(authorized.measurements))
	assert.equal(authorized.measurements.assetDeletion, true)
	spawnSync('xcrun', ['simctl', 'terminate', device, project.appId], { encoding: 'utf8' })
	await writeFile(join(container, 'Documents/media-library-test-phase.txt'), 'denied')
	privacy('revoke', 'photos')
	privacy('revoke', 'photos-add')
	const denied = await probe()
	assert.equal(denied.measurements.phase, 'no-access')
	assert.equal(denied.measurements.permission, 'denied')
	console.log(
		`iOS: ${initial.assertions.length + authorized.assertions.length + denied.assertions.length} assertions across nonprompting, granted and denied Photos access; disposable asset/album lifecycle passed.`,
	)
} finally {
	dialogs?.close()
}
