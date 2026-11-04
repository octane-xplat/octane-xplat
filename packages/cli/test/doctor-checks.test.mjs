import assert from 'node:assert/strict'
import { test, after } from 'node:test'
import { spawnSync } from 'node:child_process'
import { writeFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { stripVTControlCharacters } from 'node:util'
import { compatibility } from '../dist/compatibility.js'

const root = mkdtempSync(join(tmpdir(), 'xplat-doctor-report-'))
after(() => rmSync(root, { recursive: true, force: true }))
const cli = fileURLToPath(new URL('../dist/cli.js', import.meta.url))
const engine = new URL('../dist/doctor-checks.js', import.meta.url).href
const env = {
	...process.env,
	PATH: '',
	NODE_OPTIONS: '',
	NODE_PATH: '',
	ANDROID_HOME: '',
	JAVA_HOME: '',
	MACOS_SIGNING_IDENTITY: '',
	MACOS_NOTARY_PROFILE: '',
	DISPLAY: '',
	WAYLAND_DISPLAY: '',
	DBUS_SESSION_BUS_ADDRESS: '',
}

let sequence = 0
function put(dir, path, data) {
	const file = join(dir, path)
	mkdirSync(dirname(file), { recursive: true })
	writeFileSync(file, typeof data === 'string' ? data : JSON.stringify(data))
	return file
}

function fixture(manifest = {}, files = {}) {
	const dir = join(root, 'project ' + sequence++)
	put(dir, 'package.json', {
		private: true,
		packageManager: `bun@${compatibility.tools.bun}`,
		...manifest,
	})
	for (const [path, data] of Object.entries(files)) {
		put(dir, path, data)
	}
	return dir
}

function invoke(dir, entry = cli, overlay = {}) {
	return spawnSync(process.execPath, [entry, 'doctor'], {
		cwd: dir,
		env: { ...env, ...overlay },
		encoding: 'utf8',
		timeout: 30000,
	})
}

function report(dir, overlay = {}) {
	const source = `import {inspectDoctor} from ${JSON.stringify(engine)};const observed=[];const result=await inspectDoctor({onMessage:m=>observed.push(m)});console.log(JSON.stringify({result,observed,exitCode:process.exitCode??0}));`
	const r = spawnSync(process.execPath, ['--input-type=module', '-e', source], {
		cwd: dir,
		env: { ...env, ...overlay },
		encoding: 'utf8',
		timeout: 30000,
	})
	assert.equal(r.status, 0, r.stdout + r.stderr)
	assert.equal(r.stderr, '')
	const { result, observed, exitCode } = JSON.parse(r.stdout)
	assert.equal(exitCode, 0, 'a reusable report must not change the caller exit code')
	assert.deepEqual(result.messages, observed)
	return result
}

function presentation(dir, data, overlay = {}) {
	const r = invoke(dir, cli, overlay)
	assert.equal(r.status, data.exitCode, r.stdout + r.stderr)
	const output = stripVTControlCharacters(r.stdout)
	assert.ok(output.includes(data.summary), output)
	for (const row of data.rows) {
		assert.ok(
			output.includes(`${row.name} — ${row.detail || (row.ok ? 'ok' : 'missing')}`),
			row.name + '\n' + output,
		)
	}
	for (const message of data.messages) {
		assert.ok(output.includes(message.text), output)
	}
	assert.equal(r.stderr.trim(), data.exitCode ? data.diagnosticStderr.trim() : '')
	if (process.env.XPLAT_DOCTOR_REFERENCE_CLI) {
		const before = invoke(dir, process.env.XPLAT_DOCTOR_REFERENCE_CLI, overlay)
		assert.equal(before.status, r.status, before.stdout + before.stderr)
		assert.equal(stripVTControlCharacters(before.stdout), output)
		assert.equal(before.stderr, r.stderr)
	}
}

test('plain project report retains compatibility failures, missing tools, presentation and caller exit ownership', () => {
	const dir = fixture()
	const data = report(dir)
	assert.equal(data.exitCode, 1)
	assert.equal(data.rows.find((row) => row.name === 'compatibility Node').ok, false)
	assert.equal(data.rows.find((row) => row.name === 'node').ok, false)
	assert.equal(data.rows.find((row) => row.name === 'bun').ok, false)
	assert.deepEqual(data.messages, [])
	presentation(dir, data)
})

test('Linux reports config/archive checks and host limits without launching a graphical application', () => {
	const dir = fixture({ xplat: { targets: { linux: { runtime: 'gtk', package: {} } } } })
	const data = report(dir)
	assert.ok(data.rows.some((row) => row.name === 'Linux packaging config' && !row.ok))
	assert.ok(data.rows.some((row) => row.name === 'Linux archive tool' && !row.ok))
	if (process.platform === 'linux') {
		assert.ok(data.rows.some((row) => row.name === 'Linux runtime'))
	} else {
		assert.ok(
			data.messages.some(
				(message) =>
					message.level === 'info' && message.text.includes('verify the GJS/GTK4 runtime on Linux'),
			),
		)
	}
	presentation(dir, data)
})

test('native source analysis keeps plugin declarations and HMR scope warnings separate from check rows', () => {
	const dir = fixture(
		{ dependencies: { '@octane-xplat/ui': 'workspace:*' } },
		{
			'nativescript.config.ts': 'export default {}',
			'src/main.ts': "import '@octane-xplat/ui'; import '@fixture/shared'",
			'tsconfig.json': { compilerOptions: { paths: { '@unused/pkg': ['./unused'] } } },
			'node_modules/@octane-xplat/ui/package.json': {
				name: '@octane-xplat/ui',
				version: compatibility.frameworkVersion,
				peerDependencies: { '@nativescript/camera': '1.0.0' },
			},
			'packages/shared/package.json': { name: '@fixture/shared' },
			'packages/shared/index.ts': 'export {}',
		},
	)
	const data = report(dir)
	assert.deepEqual(data.pluginWarnings, [
		{ plugin: '@nativescript/camera', frameworks: ['@octane-xplat/ui'] },
	])
	assert.deepEqual(data.scopeGaps, ['@fixture/shared'])
	assert.ok(
		data.messages.some(
			(message) => message.level === 'warn' && message.text.includes('native plugin declaration'),
		),
	)
	assert.ok(
		data.messages.some((message) => message.level === 'warn' && message.text.includes('HMR scope')),
	)
	assert.ok(data.summary.includes('1 native plugin declaration warning(s)'))
	presentation(dir, data)
})

test('declaration checker failure preserves diagnostic stderr and explicit report failure', () => {
	const dir = fixture({}, { 'tsrx-typegen.json': {} }),
		data = report(dir)
	assert.equal(data.exitCode, 1)
	assert.ok(data.rows.some((row) => row.name === 'tsrx package declarations' && !row.ok))
	presentation(dir, data)
})

test('macOS and Windows target metadata stays diagnostic data rather than fabricated host qualification', () => {
	for (const target of ['macos', 'windows']) {
		const dir = fixture({
			...(target === 'windows' ? { devDependencies: { '@nativescript/windows': '0.0.1' } } : {}),
			xplat: {
				targets: { [target]: { runtime: target === 'macos' ? 'appkit-node-api' : 'winui' } },
			},
		})

		if (target === 'windows') {
			put(dir, 'nativescript.config.ts', 'export default {}')
		}

		const data = report(dir)
		assert.ok(
			data.rows.some((row) => row.name === (target === 'macos' ? 'macOS host' : 'Windows host')),
		)

		if (target === 'macos') {
			assert.ok(data.rows.some((row) => row.name === 'macOS JavaScriptCore package host'))
		}

		presentation(dir, data)
	}
})

test(
	'ordinary SDK warnings retain the reference nonfatal policy when compatibility is healthy',
	{ skip: process.platform === 'win32' },
	() => {
		const dir = fixture({}, { 'nativescript.config.ts': 'export default {}' })
		const bin = join(dir, 'bin')
		mkdirSync(bin)
		const bun = spawnSync('bun', ['-e', 'console.log(process.execPath)'], { encoding: 'utf8' })
		assert.equal(bun.status, 0, bun.stderr)
		symlinkSync(process.execPath, join(bin, 'node'))
		symlinkSync(bun.stdout.trim(), join(bin, 'bun'))
		const overlay = { PATH: bin },
			data = report(dir, overlay)
		assert.equal(
			data.rows.filter((row) => row.name.startsWith('compatibility')).every((row) => row.ok),
			true,
		)
		assert.ok(
			data.rows.some((row) => !row.ok),
			'isolated tool PATH must report missing SDKs',
		)
		assert.equal(data.exitCode, 0, 'SDK warnings alone do not change the reference exit policy')
		presentation(dir, data, overlay)
	},
)
