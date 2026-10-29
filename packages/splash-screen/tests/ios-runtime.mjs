import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { cp, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'
const { values } = parseArgs({
	options: {
		'reuse-build': { type: 'boolean', default: false },
		'refresh-js': { type: 'boolean', default: false },
	},
})
assert.ok(
	!values['refresh-js'] || values['reuse-build'],
	'Refresh JS requires an existing native executable',
)
const repo = process.env.XPLAT_NATIVE_TEST_REPO
const device = process.env.XPLAT_IOS_DEVICE
assert.ok(
	repo && device && process.platform === 'darwin',
	'Select the Apple test checkout and an owned simulator',
)
const packageRoot = fileURLToPath(new URL('..', import.meta.url))
const { prepare, filesUnder } = await import(
	pathToFileURL(join(repo, 'scripts/probe/project.ts')).href
)
const { command } = await import(pathToFileURL(join(repo, 'scripts/probe/process.ts')).href)
const resources = join(packageRoot, 'tests/.runtime/App_Resources')
await cp(join(repo, 'packages/create/template/App_Resources'), resources, { recursive: true })
const plistFile = join(resources, 'iOS/Info.plist')
const plist = await readFile(plistFile, 'utf8')
const closing = plist.lastIndexOf('</dict>')
assert.ok(closing >= 0)
await writeFile(
	plistFile,
	plist.slice(0, closing) +
		'<key>XplatSplashScreenMaxHoldMilliseconds</key><integer>1000</integer>\n' +
		plist.slice(closing),
)
const project = await prepare(
	'ios',
	join(packageRoot, 'tests/runtime.ios.ts'),
	['@octane-xplat/splash-screen'],
	resources,
)
// prepare() normally boots the development probe host. This fixture owns the
// release entry and launches it without that host's HTTP control connection.
await writeFile(
	join(project.root, 'src/index.ts'),
	'import ' + JSON.stringify(join(packageRoot, 'tests/runtime.ios.ts')) + '\n',
)
const output = join(project.root, 'platforms/ios/build/Release-iphonesimulator')
const sim = (args, allowFailure = false) => command('xcrun', ['simctl', ...args], { allowFailure })
await sim(['boot', device], true)
await sim(['bootstatus', device, '-b'])
if (!values['reuse-build']) {
	const build = await command(
		'ns',
		['build', 'ios', '--path', project.root, '--release', '--for-device', 'false', '--no-hmr'],
		{ cwd: '/tmp', timeout: 300000 },
	)
	await writeFile(join(project.root, 'splash-release-build.log'), build.stdout + build.stderr)
} else if (values['refresh-js']) {
	const prepared = await command(
		'ns',
		['prepare', 'ios', '--path', project.root, '--release', '--for-device', 'false', '--no-hmr'],
		{ cwd: '/tmp', timeout: 300000 },
	)
	await writeFile(
		join(project.root, 'splash-release-prepare.log'),
		prepared.stdout + prepared.stderr,
	)
}
const artifact = (await filesUnder(output)).find((file) => file.endsWith('.app/Info.plist'))
assert.ok(artifact, 'expected an unsigned simulator release app')
let app = dirname(artifact)
if (values['refresh-js']) {
	const ios = join(project.root, 'platforms/ios')
	const candidates = []
	for (const entry of await readdir(ios, { withFileTypes: true })) {
		if (!entry.isDirectory()) {
			continue
		}
		const assets = join(ios, entry.name, 'app')
		try {
			if ((await stat(join(assets, 'package.json'))).isFile()) {
				candidates.push(assets)
			}
		} catch (error) {
			if (error.code !== 'ENOENT') {
				throw error
			}
		}
	}
	assert.equal(candidates.length, 1)
	const copy = join(project.root, 'splash-refreshed-release.app')
	await cp(app, copy, { recursive: true })
	await cp(candidates[0], join(copy, 'app'), { recursive: true })
	app = copy
}
await sim(['install', device, app])
const container = (await sim(['get_app_container', device, project.appId, 'data'])).stdout.trim()
const documents = join(container, 'Documents')
await mkdir(documents, { recursive: true })
const results = []
try {
	for (const mode of ['manual', 'auto', 'timeout', 'early-hide', 'late']) {
		await sim(['terminate', device, project.appId], true)
		const nonce = randomUUID()
		await writeFile(join(documents, 'splash-request.json'), JSON.stringify({ mode, nonce }))
		await sim(['launch', device, project.appId])
		const deadline = Date.now() + 20000
		let result
		while (Date.now() < deadline) {
			try {
				const current = JSON.parse(await readFile(join(documents, 'splash-result.json'), 'utf8'))
				if (current.nonce === nonce) {
					result = current
					break
				}
			} catch (error) {
				if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) {
					throw error
				}
			}
			await new Promise((resolve) => setTimeout(resolve, 150))
		}
		assert.ok(result, 'timed out: ' + mode)
		assert.equal(result.passed, true, JSON.stringify(result))
		results.push(result)
		console.log(JSON.stringify(result))
	}
	await writeFile(
		join(project.root, 'splash-release-results.json'),
		JSON.stringify({ appId: project.appId, device, results }, null, 2),
	)
} finally {
	await sim(['terminate', device, project.appId], true)
}
