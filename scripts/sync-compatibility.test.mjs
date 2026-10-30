import assert from 'node:assert/strict'
import {
	chmodSync,
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

// Stage a copy of the release-relevant tree. `bin` goes first on PATH so the
// bump script's `npm view` probe can be stubbed without a registry.
function stage(t, npmStub) {
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
	const npm = join(root, 'bin', 'npm')
	mkdirSync(dirname(npm), { recursive: true })
	writeFileSync(npm, npmStub)
	chmodSync(npm, 0o755)
	const env = { ...process.env, PATH: `${join(root, 'bin')}:${process.env.PATH}` }
	const bump = (version) =>
		spawnSync(process.execPath, [join(root, 'scripts/bump-versions.ts'), version], {
			cwd: root,
			encoding: 'utf8',
			env,
		})
	return { root, bump }
}

const typegenVersion = readJson(join(repo, 'packages/tsrx-typegen/package.json')).version

test('release bumps regenerate framework catalogs and patch config pins without moving external tool versions or consumer ranges', (t) => {
	const { root, bump } = stage(
		t,
		`#!/bin/sh\nif [ "$1" = view ]; then echo '"${typegenVersion}"'; exit 0; fi\nexit 1\n`,
	)
	const before = readJson(join(root, 'packages/create/compatibility.json'))
	const library = readJson(join(root, 'packages/create/library-template/package.json'))
	const version = '987.0.0-test.1'
	const result = bump(version)
	assert.equal(result.status, 0, result.stderr)
	const after = readJson(join(root, 'packages/create/compatibility.json'))
	assert.equal(after.frameworkVersion, version)
	// A published in-repo tsrx-typegen version moves its starter pin; every
	// other external pin stays untouched.
	assert.equal(after.packages['tsrx-typegen'].version, typegenVersion)
	const rest = ({ 'tsrx-typegen': _skip, ...packages }) => packages
	assert.deepEqual(rest(after.packages), rest(before.packages))
	for (const template of ['template', 'library-template']) {
		const ws = parse(readFileSync(join(root, 'packages/create', template, 'package.json'), 'utf8'))

		assert.equal(ws.workspaces.catalogs.xplat['@octane-xplat/cli'], version)
		assert.equal(ws.workspaces.catalogs.xplat['@tsrx/oxc'], before.packages['@tsrx/oxc'].version)
		assert.equal(ws.packageManager, `bun@${before.tools.bun}`)
	}
	const libraryWs = parse(
		readFileSync(join(root, 'packages/create/library-template/package.json'), 'utf8'),
	)
	assert.equal(libraryWs.workspaces.catalogs.xplat['tsrx-typegen'], typegenVersion)
	const nextLibrary = readJson(join(root, 'packages/create/library-template/package.json'))
	assert.equal(nextLibrary.peerDependencies.octane, library.peerDependencies.octane)
	assert.equal(nextLibrary.peerDependencies['@octane-xplat/ui'], `^${version}`)
	const check = () =>
		spawnSync(process.execPath, [join(root, 'scripts/sync-compatibility.ts'), '--check'], {
			cwd: root,
			encoding: 'utf8',
		})
	assert.equal(check().status, 0)
	const path = join(root, 'packages/create/template/package.json')
	const drifted = readFileSync(path, 'utf8').replace(
		`"octane": "${before.packages.octane.version}"`,
		'"octane": "0.0.1"',
	)
	writeFileSync(path, drifted)
	const failed = check()
	assert.equal(failed.status, 1)
	assert.match(failed.stderr, /compatibility drift/)
	assert.equal(readFileSync(path, 'utf8'), drifted, 'check mode must not repair drift')
})

test('release bumps keep the tsrx-typegen pin when the in-repo version is not published', (t) => {
	const { root, bump } = stage(t, '#!/bin/sh\nexit 1\n')
	const before = readJson(join(root, 'packages/create/compatibility.json'))
	const result = bump('987.0.0-test.1')
	assert.equal(result.status, 0, result.stderr)
	assert.match(result.stderr, /not published/)
	const after = readJson(join(root, 'packages/create/compatibility.json'))
	assert.equal(after.packages['tsrx-typegen'].version, before.packages['tsrx-typegen'].version)
	assert.deepEqual(after.packages, before.packages)
	const ws = parse(
		readFileSync(join(root, 'packages/create/library-template/package.json'), 'utf8'),
	)
	assert.equal(
		ws.workspaces.catalogs.xplat['tsrx-typegen'],
		before.packages['tsrx-typegen'].version,
	)
})
