import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:http'
import {
	mkdtempSync,
	readdirSync,
	readFileSync,
	writeFileSync,
	mkdirSync,
	realpathSync,
} from 'node:fs'

import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseDocument } from 'yaml'
import { audioResponse } from '../../packages/audio/tests/fixture-server.mjs'

const repo = fileURLToPath(new URL('../../', import.meta.url))
const args = process.argv.slice(2)
const option = (name) => args[args.indexOf(name) + 1]
assert.ok(
	args.includes('--target') && args.includes('--device'),
	'Pass --target ios|android and --device for an owned booted device',
)

const target = option('--target')
assert.ok(
	['ios', 'android'].includes(target),
	'This packed mobile consumer requires ios or android',
)

const device = option('--device')
assert.ok(device && !device.startsWith('--'), 'Pass an explicit device ID')
// The local fixture server is reached through simulator/emulator loopback.
if (target === 'android') {
	assert.match(device, /^emulator-\d+$/, 'This fixture requires an Android emulator')
} else {
	const result = spawnSync('xcrun', ['simctl', 'list', 'devices', 'booted', '--json'], {
		encoding: 'utf8',
	})

	assert.equal(result.status, 0, 'Cannot inspect booted iOS simulators')
	const devices = Object.values(JSON.parse(result.stdout).devices).flat()
	assert.ok(
		devices.some((entry) => entry.udid === device),
		'This fixture requires an owned booted iOS simulator',
	)
}

const work = mkdtempSync(join(tmpdir(), 'xplat-listening-consumer-'))
console.log(`Consumer artifacts: ${work}`)
const run = (command, argv, cwd = repo) => {
	const result = spawnSync(command, argv, { cwd, stdio: 'inherit', timeout: 900000 })
	assert.equal(result.status, 0, `${command} ${argv.join(' ')} failed`)
}

const packages = new Map(
	readdirSync(join(repo, 'packages')).flatMap((name) => {
		try {
			const directory = join(repo, 'packages', name)
			const manifest = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'))
			return [[manifest.name, { directory, manifest }]]
		} catch {
			return []
		}
	}),
)

const selected = new Set()
function include(name) {
	if (selected.has(name) || !packages.has(name)) {
		return
	}
	selected.add(name)
	const { manifest } = packages.get(name)
	for (const dependency of Object.keys({
		...manifest.dependencies,
		...manifest.optionalDependencies,
	})) {
		include(dependency)
	}
}

for (const name of [
	'@octane-xplat/audio',
	'@octane-xplat/network',
	'@octane-xplat/auth',
	'@octane-xplat/ui',
	'@octane-xplat/cli',
	'@octane-xplat/bamboo',
	'@octane-xplat/patches',
]) {
	include(name)
}

run('pnpm', [
	'exec',
	'turbo',
	'run',
	'build',
	'typegen',
	'--concurrency=2',
	...Array.from(selected, (name) => `--filter=${name}`),
])

const pack = join(work, 'pack')
mkdirSync(pack)
const tarballs = new Map()
for (const name of selected) {
	const { directory, manifest } = packages.get(name)
	run('pnpm', ['--config.ignore-scripts=true', 'pack', '--pack-destination', pack], directory)
	tarballs.set(
		name,
		join(pack, `${name.replace(/^@/, '').replace('/', '-')}-${manifest.version}.tgz`),
	)
}

const bootstrap = join(work, 'bootstrap')
mkdirSync(bootstrap)
writeFileSync(
	join(bootstrap, 'package.json'),
	JSON.stringify({
		private: true,
		dependencies: { 'create-octane-xplat': `file:${tarballs.get('create-octane-xplat')}` },
	}),
)

writeFileSync(
	join(bootstrap, 'pnpm-workspace.yaml'),
	'nodeLinker: isolated\npackageImportMethod: copy\n',
)

run('pnpm', ['install', '--ignore-scripts'], bootstrap)
const creator = join(bootstrap, 'node_modules/create-octane-xplat')
const creatorManifest = JSON.parse(readFileSync(join(creator, 'package.json'), 'utf8'))
const app = join(work, 'listening-app')
run(
	'node',
	[
		join(creator, creatorManifest.bin['create-octane-xplat']),
		app,
		'--no-install',
		'--targets',
		`web,${target}`,
	],
	work,
)

const manifestPath = join(app, 'package.json')
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
for (const section of ['dependencies', 'devDependencies']) {
	for (const name of Object.keys(manifest[section] ?? {})) {
		if (tarballs.has(name)) {
			manifest[section][name] = `file:${tarballs.get(name)}`
		}
	}
}

for (const name of ['@octane-xplat/audio', '@octane-xplat/network', '@octane-xplat/auth']) {
	manifest.dependencies[name] = `file:${tarballs.get(name)}`
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
const workspacePath = join(app, 'pnpm-workspace.yaml')
const workspace = parseDocument(readFileSync(workspacePath, 'utf8'))
workspace.delete('configDependencies')
for (const [name, file] of tarballs) {
	workspace.setIn(['overrides', name], `file:${file}`)
}

writeFileSync(workspacePath, String(workspace))
const patches = join(app, 'node_modules/.pnpm-config/@octane-xplat/patches')
mkdirSync(patches, { recursive: true })
run(
	'tar',
	['-xzf', tarballs.get('@octane-xplat/patches'), '-C', patches, '--strip-components=1'],
	work,
)

run('pnpm', ['install'], app)
for (const name of [
	'@octane-xplat/audio',
	'@octane-xplat/network',
	'@octane-xplat/auth',
	'@octane-xplat/ui',
]) {
	assert.ok(
		!realpathSync(join(app, 'node_modules', name)).startsWith(repo),
		`${name} leaked a workspace link`,
	)
}

let finished = false
const server = createServer((request, response) => {
	if (request.url === '/records') {
		finished = false
		response.writeHead(200, { 'content-type': 'application/x-ndjson' })
		response.write('{"rea')
		const first = setTimeout(() => response.write('dy":true}\n'), 50)
		const end = setTimeout(() => {
			finished = true
			response.end('{"done":true}\n')
		}, 3000)

		response.on('close', () => {
			clearTimeout(first)
			clearTimeout(end)
		})
	} else if (request.url === '/state') {
		response.end(JSON.stringify({ finished }))
	} else {
		audioResponse(request, response)
	}
})

await new Promise((resolve) => server.listen(0, '0.0.0.0', resolve))
const origin = `http://${target === 'android' ? '10.0.2.2' : '127.0.0.1'}:${server.address().port}`
const fixture = join(app, 'src/readiness-fixture.tsrx')
let source = readFileSync(new URL('listening-settings.tsrx', import.meta.url), 'utf8')
source = source
	.replace('http://fixture.invalid', origin)
	.replace('../../scripts/probe/context', join(repo, 'scripts/probe/context'))

writeFileSync(fixture, source)
try {
	run('pnpm', ['exec', 'xplat', 'typecheck'], app)
	const child = spawn(
		'pnpm',
		[
			'probe',
			'run',
			fixture,
			'--deps',
			'@octane-xplat/audio,@octane-xplat/network,@octane-xplat/auth',
			'--target',
			target,
			'--device',
			device,
			'--resources',
			join(app, 'App_Resources'),
			'--timeout',
			'60000',
		],
		{ cwd: repo, stdio: 'inherit' },
	)

	const [code] = await once(child, 'close')
	assert.equal(code, 0, 'Packed listening/settings runtime failed')
	console.log(`Packed ${target} listening/settings consumer passed; artifacts retained at ${work}`)
} finally {
	server.closeAllConnections()
	await new Promise((resolve) => server.close(resolve))
}
