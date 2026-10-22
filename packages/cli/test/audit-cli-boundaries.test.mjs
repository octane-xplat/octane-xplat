import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { parse, stringify } from 'yaml'
import { composeTargets } from 'create-octane-xplat/scaffold'

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

test('dev exits unsuccessfully when its web target fails', {
	todo: 'Known audit bug: the dev target close handler discards its exit status',
}, (t) => {
	const root = project(t)
	write(root, 'package.json', JSON.stringify({ private: true, type: 'module' }))
	write(root, 'vite.config.ts', 'export default {}')
	write(root, 'bin/pnpm', `#!${process.execPath}\nconsole.error('AUDIT_TARGET_FAILED'); process.exit(42)\n`)
	// Match the executable fake-pnpm seam used by build.test.mjs.
	chmodSync(join(root, 'bin/pnpm'), 0o755)
	const result = run(root, ['dev', 'web'], { PATH: `${join(root, 'bin')}:${process.env.PATH}` })
	assert.ifError(result.error)
	assert.match(result.stdout + result.stderr, /AUDIT_TARGET_FAILED/)
	assert.notEqual(result.status, 0, 'a failed development target must fail the CLI')
})

test('clean preserves authored native plugin platform sources', {
	todo: 'Known audit bug: clean classifies authored plugin platform directories as generated',
}, (t) => {
	const root = project(t)
	write(root, 'package.json', JSON.stringify({
		name: 'native-plugin-fixture',
		nativescript: { platforms: { android: '9.1.0', ios: '9.1.0' } },
	}))
	const sources = {
		'platforms/android/java/Fixture.java': 'public class Fixture {}\n',
		'platforms/ios/src/Fixture.swift': 'public class Fixture {}\n',
	}
	for (const [path, contents] of Object.entries(sources)) {
		write(root, path, contents)
	}
	const result = run(root, ['clean'])
	assert.ifError(result.error)
	assert.equal(result.signal, null, result.stdout + result.stderr)
	assert.equal(result.status, 0, result.stdout + result.stderr)
	for (const [path, contents] of Object.entries(sources)) {
		assert.ok(existsSync(join(root, path)), `authored plugin source was deleted: ${path}`)
		assert.equal(readFileSync(join(root, path), 'utf8'), contents)
	}
})

test('add ios updates the enclosing workspace catalog and patch configuration', {
	todo: 'Known audit bug: add creates a nested workspace instead of updating the owning workspace',
}, (t) => {
	const root = project(t)
	const app = join(root, 'apps/web')
	composeTargets(['web'], app)
	write(root, 'package.json', JSON.stringify({ name: 'workspace-fixture', private: true }))
	const workspaceFile = join(root, 'pnpm-workspace.yaml')
	const original = parse(readFileSync(join(app, 'pnpm-workspace.yaml'), 'utf8'))
	writeFileSync(workspaceFile, stringify({ packages: ['apps/*'], ...original }))
	unlinkSync(join(app, 'pnpm-workspace.yaml'))

	const result = run(app, ['add', 'ios', '--no-install'])
	assert.ifError(result.error)
	assert.equal(result.status, 0, result.stdout + result.stderr)
	const manifest = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8'))
	assert.ok(manifest.devDependencies['@nativescript/ios'], 'the target must actually be added')
	const workspace = parse(readFileSync(workspaceFile, 'utf8'))
	for (const section of ['dependencies', 'devDependencies']) {
		for (const [name, spec] of Object.entries(manifest[section])) {
			if (spec === 'catalog:xplat') {
				assert.ok(workspace.catalogs.xplat[name], `owning workspace lacks catalog pin for ${name}`)
			}
		}
	}
	assert.ok(Object.keys(workspace.patchedDependencies).some((key) => key.startsWith('@nativescript/core@')))
	assert.equal(existsSync(join(app, 'pnpm-workspace.yaml')), false, 'do not introduce a nested workspace')
})
