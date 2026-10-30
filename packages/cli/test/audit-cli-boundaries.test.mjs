import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
	chmodSync,
	cpSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs'

import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { composeTargets } from 'create-octane-xplat/scaffold'
import { listRetainedSessions } from '../dist/dev-logs.js'

const cli = fileURLToPath(new URL('../dist/cli.js', import.meta.url))

function project(t) {
	const root = mkdtempSync(join(tmpdir(), 'xplat-cli-boundary-'))
	t.after(() => rmSync(root, { recursive: true, force: true }))
	return root
}

function write(root, path, contents) {
	const file = join(root, path)
	mkdirSync(dirname(file), { recursive: true })
	writeFileSync(file, contents)
}

function run(root, args, env = {}) {
	return spawnSync(process.execPath, [cli, ...args], {
		cwd: root,
		env: { ...process.env, ...env },
		encoding: 'utf8',
		timeout: 20000,
	})
}

test('dev exits unsuccessfully when its web target fails', (t) => {
	const root = project(t)
	write(root, 'package.json', JSON.stringify({ private: true, type: 'module' }))
	write(root, 'vite.config.ts', 'export default {}')
	write(
		root,
		'bin/bun',
		`#!${process.execPath}\nconsole.error('AUDIT_TARGET_FAILED'); process.exit(42)\n`,
	)
	chmodSync(join(root, 'bin/bun'), 0o755)
	const result = run(root, ['dev', 'web'], { PATH: `${join(root, 'bin')}:${process.env.PATH}` })
	assert.ifError(result.error)
	assert.match(result.stdout + result.stderr, /AUDIT_TARGET_FAILED/)
	assert.notEqual(result.status, 0, 'a failed development target must fail the CLI')
	assert.equal(result.status, 42)
	const sessions = listRetainedSessions(root)
	assert.equal(sessions.length, 1)
	assert.equal(sessions[0].historical, true)
	assert.equal(sessions[0].state, 'failed')
	assert.deepEqual(readdirSync(join(root, 'node_modules/.cache/xplat/sessions/leases')), [])
})

test('dev preserves successful and signal exit statuses and closes each capture', (t) => {
	for (const [body, status] of [
		['process.exit(0)', 0],
		["process.kill(process.pid, 'SIGTERM')", 143],
	]) {
		const root = project(t)
		write(root, 'package.json', JSON.stringify({ private: true, type: 'module' }))
		write(root, 'vite.config.ts', 'export default {}')
		write(root, 'bin/bun', `#!${process.execPath}\n${body}\n`)
		chmodSync(join(root, 'bin/bun'), 0o755)
		const result = run(root, ['dev', 'web'], { PATH: `${join(root, 'bin')}:${process.env.PATH}` })
		assert.ifError(result.error)
		assert.equal(result.status, status, result.stdout + result.stderr)
		assert.equal(listRetainedSessions(root)[0].historical, true)
	}
})

test('dev retains a target failure when another target succeeds', (t) => {
	const root = project(t)
	write(
		root,
		'package.json',
		JSON.stringify({
			private: true,
			type: 'module',
			xplat: { targets: { linux: { runtime: 'gtk' } } },
		}),
	)
	write(root, 'vite.config.ts', 'export default {}')
	// Both targets use a fake Bun child; no GTK host or native runtime starts.
	write(
		root,
		'bin/bun',
		`#!${process.execPath}
console.log(process.argv.includes('vite') ? 'WEB_FAILED' : 'SECOND_TARGET_COMPLETE')
setTimeout(() => process.exit(process.argv.includes('vite') ? 42 : 0), process.argv.includes('vite') ? 0 : 100)
`,
	)
	chmodSync(join(root, 'bin/bun'), 0o755)
	const result = run(root, ['dev', '--targets', 'web,linux'], {
		PATH: `${join(root, 'bin')}:${process.env.PATH}`,
	})
	assert.ifError(result.error)
	assert.match(result.stdout, /WEB_FAILED/)
	assert.match(result.stdout, /SECOND_TARGET_COMPLETE/)
	assert.equal(result.status, 42, result.stdout + result.stderr)
	const sessions = listRetainedSessions(root)
	assert.equal(sessions.length, 2)
	assert.ok(sessions.every((session) => session.historical))
})

test('clean preserves authored native plugin platform sources', (t) => {
	const root = project(t)
	write(
		root,
		'package.json',
		JSON.stringify({
			name: 'native-plugin-fixture',
			nativescript: { platforms: { android: '9.1.0', ios: '9.1.0' } },
		}),
	)
	const sources = {
		'platforms/android/java/Fixture.java': 'public class Fixture {}\n',
		'platforms/ios/src/Fixture.swift': 'public class Fixture {}\n',
	}
	for (const [path, contents] of Object.entries(sources)) {
		write(root, path, contents)
	}
	write(root, 'dist/plugin.js', 'generated output')
	const result = run(root, ['clean'])
	assert.ifError(result.error)
	assert.equal(result.signal, null, result.stdout + result.stderr)
	assert.equal(result.status, 0, result.stdout + result.stderr)
	assert.equal(existsSync(join(root, 'dist')), false)
	for (const [path, contents] of Object.entries(sources)) {
		assert.ok(existsSync(join(root, path)), `authored plugin source was deleted: ${path}`)
		assert.equal(readFileSync(join(root, path), 'utf8'), contents)
	}
})

test('clean removes generated app platforms and caches while preserving authored macOS source', (t) => {
	const root = project(t)
	write(root, 'package.json', JSON.stringify({ private: true }))
	write(root, 'nativescript.config.ts', 'export default { id: "org.example.fixture" }')
	const outputs = [
		'platforms/android',
		'platforms/ios',
		'dist',
		'.ns-vite-build',
		'node_modules/.vite',
		'node_modules/.cache/xplat',
	]
	for (const path of outputs) {
		write(root, `${path}/generated.txt`, 'generated output')
	}
	write(root, 'platforms/macos/main.swift', 'authored source')
	const result = run(root, ['clean'])
	assert.ifError(result.error)
	assert.equal(result.status, 0, result.stdout + result.stderr)
	for (const path of outputs) {
		assert.equal(existsSync(join(root, path)), false, path)
	}
	assert.equal(readFileSync(join(root, 'platforms/macos/main.swift'), 'utf8'), 'authored source')
})

test('add ios updates the enclosing workspace catalog and patch configuration', (t) => {
	const root = project(t)
	const app = join(root, 'apps/web')
	composeTargets(['web'], app)
	const workspaceFile = join(root, 'package.json')
	const template = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8'))
	const original = {
		...template,
		name: 'workspace-fixture',
		workspaces: { ...template.workspaces, packages: ['apps/*'] },
	}
	original.workspaces.catalogs.xplat.vite = '8.0.0'
	original.workspaces.catalogs.custom = { example: '1.2.3' }
	original.overrides.example = '2.0.0'
	original.policy = 'Keep workspace policy'
	original.patchedDependencies['example@2.0.0'] = 'patches/example.patch'
	cpSync(join(app, 'patches'), join(root, 'patches'), { recursive: true })
	write(root, 'patches/example.patch', 'custom patch')
	writeFileSync(workspaceFile, JSON.stringify(original))

	const result = run(app, ['add', 'ios', '--no-install'])
	assert.ifError(result.error)
	assert.equal(result.status, 0, result.stdout + result.stderr)
	const manifest = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8'))
	assert.ok(manifest.devDependencies['@nativescript/ios'], 'the target must actually be added')
	const workspace = JSON.parse(readFileSync(workspaceFile, 'utf8'))
	for (const section of ['dependencies', 'devDependencies']) {
		for (const [name, spec] of Object.entries(manifest[section])) {
			if (spec === 'catalog:xplat') {
				assert.ok(
					workspace.workspaces.catalogs.xplat[name],
					`owning workspace lacks catalog pin for ${name}`,
				)
			}
		}
	}
	assert.ok(
		Object.keys(workspace.patchedDependencies).some((key) => key.startsWith('@nativescript/core@')),
	)
	assert.equal(
		existsSync(join(app, 'pnpm-workspace.yaml')),
		false,
		'do not introduce a nested workspace',
	)
	assert.deepEqual(workspace.workspaces.packages, ['apps/*'])
	assert.equal(workspace.workspaces.catalogs.xplat.vite, '8.0.0')
	assert.deepEqual(workspace.workspaces.catalogs.custom, original.workspaces.catalogs.custom)
	assert.deepEqual(workspace.overrides, original.overrides)
	assert.deepEqual(workspace.configDependencies, original.configDependencies)
	assert.deepEqual(workspace.allowBuilds, original.allowBuilds)
	for (const [key, path] of Object.entries(original.patchedDependencies)) {
		assert.equal(workspace.patchedDependencies[key], path)
	}
	assert.match(readFileSync(workspaceFile, 'utf8'), /Keep workspace policy/)
	assertPatchFiles(root, workspace)
	const after = readFileSync(workspaceFile, 'utf8')
	const repeated = run(app, ['add', 'ios', '--no-install'])
	assert.ifError(repeated.error)
	assert.equal(repeated.status, 0, repeated.stdout + repeated.stderr)
	assert.equal(readFileSync(workspaceFile, 'utf8'), after)
})

// Materialize the shipped config package where pnpm configDependencies installs
// it. This verifies workspace-relative paths without installing native SDKs.
function assertPatchFiles(root, workspace) {
	for (const path of Object.values(workspace.patchedDependencies)) {
		assert.ok(existsSync(join(root, path)), `patch must resolve from the owning workspace: ${path}`)
	}
}

test('add ios merges into a minimal parent workspace and preserves inline custom patches', (t) => {
	const root = project(t)
	const app = join(root, 'apps/web')
	composeTargets(['web'], app)
	write(root, 'patches/core.patch', 'custom patch')
	write(
		root,
		'package.json',
		JSON.stringify({
			private: true,
			packageManager: 'bun@1.4.4',
			workspaces: { packages: ['apps/*'], catalog: { custom: '1.0.0' } },
			patchedDependencies: { '@nativescript/core@9.1.2': 'patches/core.patch' },
			policy: 'custom patch',
		}),
	)

	const result = run(app, ['add', 'ios', '--no-install'])
	assert.ifError(result.error)
	assert.equal(result.status, 0, result.stdout + result.stderr)
	assert.equal(existsSync(join(app, 'pnpm-workspace.yaml')), false)
	const workspace = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
	assert.deepEqual(workspace.workspaces.packages, ['apps/*'])
	assert.deepEqual(workspace.workspaces.catalog, { custom: '1.0.0' })
	const corePatches = Object.keys(workspace.patchedDependencies).filter((key) =>
		key.startsWith('@nativescript/core@'),
	)
	assert.deepEqual(corePatches, ['@nativescript/core@9.1.2'])
	assert.equal(workspace.patchedDependencies[corePatches[0]], 'patches/core.patch')
	assert.match(readFileSync(join(root, 'package.json'), 'utf8'), /custom patch/)
	assert.ok(workspace.workspaces.catalogs.xplat['@nativescript/ios'])
	assertPatchFiles(root, workspace)
})
