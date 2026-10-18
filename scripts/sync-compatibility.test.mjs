import assert from 'node:assert/strict'
import {
	copyFileSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	readdirSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from 'node:fs'

import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { parse } from 'yaml'

const repo = fileURLToPath(new URL('../', import.meta.url))
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'))

test('release bumps regenerate framework catalogs and patch config pins without moving external tool versions or consumer ranges', (t) => {
	const root = mkdtempSync(join(tmpdir(), 'xplat-release-compatibility-'))
	t.after(() => rmSync(root, { recursive: true, force: true }))
	symlinkSync(join(repo, 'node_modules'), join(root, 'node_modules'), 'dir')
	const files = [
		'scripts/bump-versions.ts',
		'scripts/publishable.ts',
		'scripts/sync-compatibility.ts',
		'packages/create/compatibility.ts',
		'packages/create/compatibility.json',
		...['template', 'library-template'].flatMap((template) => [
			`packages/create/${template}/package.json`,
			`packages/create/${template}/pnpm-workspace.yaml`,
		]),
	]
	for (const directory of readdirSync(join(repo, 'packages'))) {
		const manifest = join(repo, 'packages', directory, 'package.json')
		try {
			readJson(manifest)
			files.push(`packages/${directory}/package.json`)
		} catch {}
	}
	for (const file of files) {
		mkdirSync(dirname(join(root, file)), { recursive: true })
		copyFileSync(join(repo, file), join(root, file))
	}
	const before = readJson(join(root, 'packages/create/compatibility.json'))
	const library = readJson(join(root, 'packages/create/library-template/package.json'))
	const version = '987.0.0-test.1'
	const bump = spawnSync(process.execPath, [join(root, 'scripts/bump-versions.ts'), version], {
		cwd: root,
		encoding: 'utf8',
	})
	assert.equal(bump.status, 0, bump.stderr)
	const after = readJson(join(root, 'packages/create/compatibility.json'))
	assert.equal(after.frameworkVersion, version)
	assert.deepEqual(after.packages, before.packages)
	for (const template of ['template', 'library-template']) {
		const ws = parse(
			readFileSync(join(root, 'packages/create', template, 'pnpm-workspace.yaml'), 'utf8'),
		)

		assert.equal(ws.catalogs.xplat['@octane-xplat/cli'], version)
		assert.equal(ws.catalogs.xplat['@tsrx/oxc'], before.packages['@tsrx/oxc'].version)
		assert.equal(ws.configDependencies['@octane-xplat/patches'], version)
	}
	const nextLibrary = readJson(join(root, 'packages/create/library-template/package.json'))
	assert.equal(nextLibrary.peerDependencies.octane, library.peerDependencies.octane)
	assert.equal(nextLibrary.peerDependencies['@octane-xplat/ui'], `^${version}`)
	const check = () =>
		spawnSync(process.execPath, [join(root, 'scripts/sync-compatibility.ts'), '--check'], {
			cwd: root,
			encoding: 'utf8',
		})
	assert.equal(check().status, 0)
	const path = join(root, 'packages/create/template/pnpm-workspace.yaml')
	const drifted = readFileSync(path, 'utf8').replace(
		`octane: ${before.packages.octane.version}`,
		'octane: 0.0.1',
	)
	writeFileSync(path, drifted)
	const failed = check()
	assert.equal(failed.status, 1)
	assert.match(failed.stderr, /compatibility drift/)
	assert.equal(readFileSync(path, 'utf8'), drifted, 'check mode must not repair drift')
})
