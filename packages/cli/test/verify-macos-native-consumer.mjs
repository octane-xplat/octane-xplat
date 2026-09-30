import assert from 'node:assert/strict'
import { execFileSync, spawn, spawnSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, realpath, writeFile, access } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const fixture = join(repo, 'packages/cli/test/fixtures')
const scratch = join(repo, 'research')
await mkdir(scratch, { recursive: true })
const app = await mkdtemp(join(scratch, 'macos-native-consumer-'))
const packs = join(app, 'packs')
await mkdir(packs)

function run(command, args, cwd = app) {
	return execFileSync(command, args, {
		cwd,
		encoding: 'utf8',
		timeout: 180_000,
		maxBuffer: 16 * 1024 * 1024,
		env: {
			...process.env,
			MACOS_SIGNING_IDENTITY: '',
			MACOS_NOTARY_PROFILE: '',
			XPLAT_MACOS_SKIP_SIGNING: '0',
		},
	})
}

async function pack(root) {
	const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
	run('pnpm', ['pack', '--pack-destination', packs], root)
	return join(packs, `${manifest.name.replace('@', '').replace('/', '-')}-${manifest.version}.tgz`)
}

await cp(join(fixture, 'macos-native-app'), app, { recursive: true })
const manifest = JSON.parse(await readFile(join(app, 'package.json'), 'utf8'))
const cliPack = await pack(join(repo, 'packages/cli'))
const leafPacks = {}
for (const name of ['c', 'objc', 'swift', 'zig']) {
	const root = join(fixture, 'macos-native-leaves', name)
	const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
	leafPacks[pkg.name] = `file:${await pack(root)}`
}

manifest.dependencies = {
	'@nativescript/macos-node-api': '0.4.4-next.2026-08-09-31292056208',
	octane: '0.6.3',
	...Object.fromEntries(
		Object.entries(leafPacks).filter(([name]) => name !== 'xplat-native-c-fixture'),
	),
}

manifest.devDependencies = { '@octane-xplat/cli': `file:${cliPack}`, vite: '8.3.0' }
await writeFile(join(app, 'package.json'), JSON.stringify(manifest, null, 2))
await writeFile(
	join(app, 'pnpm-workspace.yaml'),
	`packages: []\nnodeLinker: isolated\npackageImportMethod: copy\noverrides:\n${Object.entries(
		leafPacks,
	)
		.map(([name, value]) => `  ${name}: ${JSON.stringify(value)}`)
		.join('\n')}\n`,
)

run('pnpm', ['install', '--ignore-scripts'])
const cli = join(app, 'node_modules/@octane-xplat/cli/src/cli.mjs')
const doctor = run(process.execPath, [cli, 'doctor'])
assert.match(doctor, /macOS native leaf toolchain/)
const built = run(process.execPath, [cli, 'build', '--targets', 'macos'])
assert.match(built, /4 leaf libraries/)
const cached = run(process.execPath, [cli, 'build', '--targets', 'macos'])
assert.match(cached, /cached 4 leaf libraries/)

const packaged = join(app, 'artifacts/macos-arm64/NativeFixture.app')
run('codesign', ['--verify', '--deep', '--strict', packaged])
const relocated = join(app, 'Relocated Native Fixture.app')
await cp(packaged, relocated, { recursive: true, verbatimSymlinks: true })
const executable = join(relocated, 'Contents/MacOS/NativeFixture')
const result = spawnSync(executable, [], { cwd: scratch, encoding: 'utf8', timeout: 10_000 })
assert.equal(result.status, 0, result.stderr)
assert.match(result.stderr, /NATIVE_VALUES c=40 objc=42 swift=43 zig=44/)
run('codesign', ['--verify', '--deep', '--strict', relocated])

const objcRoot = await realpath(join(app, 'node_modules/xplat-native-objc-fixture'))
const cRoot = dirname(
	createRequire(join(objcRoot, 'package.json')).resolve('xplat-native-c-fixture/package.json'),
)

const source = join(cRoot, 'platforms/macos/src/XplatC.c')
let output = ''
const dev = spawn(process.execPath, [cli, 'dev', '--targets', 'macos'], {
	cwd: app,
	stdio: ['ignore', 'pipe', 'pipe'],
})

dev.stdout.on('data', (data) => {
	output += data
})

dev.stderr.on('data', (data) => {
	output += data
})

const waitFor = async (pattern, from = 0) => {
	const deadline = Date.now() + 180_000
	while (Date.now() < deadline) {
		if (pattern.test(output.slice(from))) {
			return
		}

		if (dev.exitCode !== null || dev.signalCode !== null) {
			throw new Error(`Dev exited: ${output.slice(-5000)}`)
		}

		await new Promise((resolve) => setTimeout(resolve, 100))
	}

	throw new Error(`Timed out awaiting ${pattern}: ${output.slice(-5000)}`)
}

try {
	await waitFor(/NATIVE_TICK c=40/)
	const oldPid = [...output.matchAll(/host started pid=(\d+)/g)].at(-1)[1]
	let offset = output.length
	await writeFile(
		source,
		'#include "XplatC.h"\nint xplat_c_value(void) { return XPLAT_VALUE + 1; }\n',
	)

	await waitFor(/NATIVE_TICK c=41/, offset)
	const newPid = [...output.matchAll(/host started pid=(\d+)/g)].at(-1)[1]
	assert.notEqual(newPid, oldPid)
	// Changing JS also restarts direct bundles and keeps the native artifact usable.
	offset = output.length
	const js = join(app, 'src/main.macos.js')
	await writeFile(js, (await readFile(js, 'utf8')) + '\nconsole.log("JS_EDIT_OK")\n')
	await waitFor(/JS_EDIT_OK/, offset)
	const goodPid = [...output.matchAll(/host started pid=(\d+)/g)].at(-1)[1]
	offset = output.length
	await writeFile(source, 'this is not valid C;\n')
	await waitFor(/rebuild failed; preserving the running app/, offset)
	await waitFor(/NATIVE_TICK c=41/, output.length)
	assert.equal([...output.matchAll(/host started pid=(\d+)/g)].at(-1)[1], goodPid)
	// Fixing the source recovers automatically.
	offset = output.length
	await writeFile(source, '#include "XplatC.h"\nint xplat_c_value(void) { return XPLAT_VALUE; }\n')
	await waitFor(/NATIVE_TICK c=40/, offset)
} finally {
	await writeFile(join(app, 'dev-transcript.log'), output)
	dev.kill('SIGINT')
	if (dev.exitCode === null && dev.signalCode === null) {
		await new Promise((resolve) => dev.once('close', resolve))
	}
}

await mkdir(join(app, 'platforms/macos/src'), { recursive: true })
await writeFile(join(app, 'platforms/macos/src/Keep.c'), '/* authored native source */')
run(process.execPath, [cli, 'clean'])
assert.equal(
	await readFile(join(app, 'platforms/macos/src/Keep.c'), 'utf8'),
	'/* authored native source */',
)

await assert.rejects(access(join(app, 'node_modules/.cache/xplat')))
console.log(
	`Packed CLI + transitive leaves, relocated signed app, dev restarts/failure recovery passed: ${app}`,
)
