import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { cp, mkdir, readFile, realpath, symlink, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { createDialogDriver } from './ios-dialogs.mjs'
const packageRoot = fileURLToPath(new URL('..', import.meta.url))
const repo = process.env.XPLAT_NATIVE_TEST_REPO
const device = process.env.XPLAT_IOS_DEVICE
assert.ok(repo && device, 'Select skymac.local checkout and a task-owned simulator')
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
await mkdir(join(resources, 'iOS/src'), { recursive: true })
await cp(
	join(packageRoot, 'platforms/ios/src/XplatPrintEngine.swift'),
	join(resources, 'iOS/src/XplatPrintEngine.swift'),
)
const caseFile = join(packageRoot, 'tests/runtime.ios.ts')
const { prepare } = await import(pathToFileURL(join(repo, 'scripts/probe/project.ts')).href)
const project = await prepare('ios', caseFile, ['@octane-xplat/lib'], resources)
let container
const installed = spawnSync(
	'xcrun',
	['simctl', 'get_app_container', device, project.appId, 'data'],
	{ encoding: 'utf8' },
)
if (installed.status === 0) {
	container = installed.stdout.trim()
	await mkdir(join(container, 'Documents'), { recursive: true })
	await writeFile(
		join(container, 'Documents/print-test-step.json'),
		JSON.stringify({ stage: 'starting', appId: project.appId }),
	)
}
const driver = await createDialogDriver(device)
const flatten = (node) =>
	!node || typeof node !== 'object' ? [] : [node, ...(node.children ?? []).flatMap(flatten)]
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
	labels = []
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
		await delay(400)
		if (done) {
			break
		}
		try {
			if (!container) {
				const current = spawnSync(
					'xcrun',
					['simctl', 'get_app_container', device, project.appId, 'data'],
					{ encoding: 'utf8' },
				)
				if (current.status !== 0) {
					continue
				}
				container = current.stdout.trim()
			}
			const step = JSON.parse(
				await readFile(join(container, 'Documents/print-test-step.json'), 'utf8'),
			)
			if (
				step.appId !== project.appId ||
				!['print-dialog', 'pdf-print-dialog', 'printer-picker'].includes(step.stage)
			) {
				continue
			}
			const hierarchy = await driver.hierarchy(project.appId)
			const nodes = flatten(hierarchy.axElement)
			labels = nodes.map((node) => String(node.label ?? '')).filter(Boolean)
			if (!labels.some((label) => /print|printer/i.test(label))) {
				continue
			}
			const cancel = nodes.find((node) => /^(Cancel|Close)$/.test(String(node.label ?? '')))
			if (!cancel) {
				continue
			}
			const frame = cancel.frame ?? {},
				x = Number(frame.x ?? frame.X),
				y = Number(frame.y ?? frame.Y),
				width = Number(frame.width ?? frame.Width),
				height = Number(frame.height ?? frame.Height)
			assert.ok([x, y, width, height].every(Number.isFinite) && width > 0 && height > 0)
			await driver.tap(x + width / 2, y + height / 2)
			console.log('Canceled owned fixture UI through accessibility: ' + step.stage)
		} catch (error) {
			if (!done) {
				labels = ['Accessibility query: ' + error.message]
			}
		}
	}
	const code = await exited
	assert.equal(code, 0, stdout + stderr + '\nLast accessibility labels: ' + JSON.stringify(labels))
	const report = JSON.parse(stdout.slice(stdout.indexOf('{')))
	assert.equal(report.results.length, 1)
	assert.equal(report.results[0].status, 'pass', JSON.stringify(report.results[0]))
	assert.ok(report.results[0].measurements.nativePDFValidated)
	console.log(
		`iOS print runtime: ${report.results[0].assertions.length} PDF/data/ownership and print/printer cancellation assertions passed. No physical print job was sent.`,
	)
} finally {
	clearTimeout(timer)
	if (!done) {
		child.kill('SIGTERM')
		await exited
	}
	driver.close()
}
