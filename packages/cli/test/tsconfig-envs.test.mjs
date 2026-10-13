import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import {
	expandEnvPrograms,
	loadEnvManifest,
	PLATFORM_MODULE_SUFFIXES,
} from '../src/tsconfig-envs.mjs'

const tmp = []

function fixture(manifest, files = ['src/index.ts']) {
	const dir = mkdtempSync(join(tmpdir(), 'xplat-envs-'))
	tmp.push(dir)
	mkdirSync(join(dir, 'src'), { recursive: true })
	for (const rel of files) {
		const abs = join(dir, rel)
		mkdirSync(join(abs, '..'), { recursive: true })
		writeFileSync(abs, 'export {}\n')
	}

	writeFileSync(join(dir, 'tsconfig.envs.json'), JSON.stringify(manifest, null, '\t'))
	return dir
}

function expand(dir) {
	const manifest = loadEnvManifest(dir)
	return expandEnvPrograms(dir, manifest)
}

test.after(() => {
	for (const dir of tmp) {
		rmSync(dir, { recursive: true, force: true })
	}
})

test('a manifest expands to exactly one combined program', () => {
	const dir = fixture({
		environments: {
			web: { files: ['src/index.ts', 'src/index.web.ts'] },
			native: { files: ['src/index.ios.ts'] },
		},
	}, ['src/index.ts', 'src/index.web.ts', 'src/index.ios.ts'])

	const programs = expand(dir)
	assert.equal(programs.length, 1)
	assert.equal(programs[0].env, 'all')
})

test('the program carries the fixed module suffix precedence', () => {
	const dir = fixture({
		environments: { web: { files: ['src/index.ts'] } },
	})

	const [program] = expand(dir)
	const config = JSON.parse(readFileSync(program.configPath, 'utf8'))
	assert.deepEqual(config.compilerOptions.moduleSuffixes, PLATFORM_MODULE_SUFFIXES)
	// The one platform condition ordering is extensionless first.
	assert.equal(PLATFORM_MODULE_SUFFIXES[0], '')
	// No platform customConditions — package boundaries resolve the default
	// (unsuffixed) export surface.
	assert.equal(config.compilerOptions.customConditions, undefined)
	// Combined programs default JSX to the DOM-flavored octane renderer.
	assert.equal(config.compilerOptions.jsxImportSource, 'octane')
})

test('all environment files union into the program', () => {
	const dir = fixture({
		environments: {
			web: { files: ['src/index.ts', 'src/index.web.ts'] },
			native: { files: ['src/index.ios.ts'] },
		},
	}, ['src/index.ts', 'src/index.web.ts', 'src/index.ios.ts'])

	const [program] = expand(dir)
	for (const rel of ['src/index.ts', 'src/index.web.ts', 'src/index.ios.ts']) {
		assert.ok(
			program.files.some((f) => f.endsWith(`/${rel}`)),
			`missing ${rel}`,
		)
	}
})

test('ambient host files precede env files (first-wins global merges)', () => {
	const dir = fixture({
		environments: {
			native: { files: ['src/index.ios.ts'] },
			macos: { files: ['src/index.macos.ts'] },
		},
	}, ['src/index.macos.ts', 'src/index.ios.ts'])

	const [program] = expand(dir)
	const envFiles = program.files.filter((f) => f.startsWith(dir))
	const ambientFiles = program.files.filter((f) => !f.startsWith(dir))
	assert.ok(envFiles.length >= 2)
	assert.ok(ambientFiles.length >= 1, 'expected ambient files')
	// Every ambient file precedes every env file in program order.
	const firstEnv = program.files.indexOf(envFiles[0])
	assert.ok(ambientFiles.every((f) => program.files.indexOf(f) < firstEnv))
})

test('per-environment compilerOptions are rejected except types', () => {
	const dir = fixture({
		environments: {
			native: {
				files: ['src/index.ios.ts'],
				compilerOptions: { moduleSuffixes: ['.ios', ''], types: ['@nativescript/types'] },
			},
		},
	}, ['src/index.ios.ts'])

	assert.throws(() => expand(dir), /environment "native".*moduleSuffixes.*one program/s)
})

test('environment types merge into the combined program', () => {
	const dir = fixture({
		environments: {
			native: {
				files: ['src/index.ios.ts'],
				compilerOptions: { types: ['@nativescript/types'] },
			},
		},
	}, ['src/index.ios.ts'])

	const [program] = expand(dir)
	const config = JSON.parse(readFileSync(program.configPath, 'utf8'))
	assert.deepEqual(config.compilerOptions.types, ['@nativescript/types'])
})

test('top-level moduleSuffixes must match the fixed order or be omitted', () => {
	const bad = fixture(
		{
			environments: { web: { files: ['src/index.ts'] } },
			compilerOptions: { moduleSuffixes: ['.web', ''] },
		},
	)

	assert.throws(() => expand(bad), /moduleSuffixes is fixed/)

	const ok = fixture(
		{
			environments: { web: { files: ['src/index.ts'] } },
			compilerOptions: { moduleSuffixes: [...PLATFORM_MODULE_SUFFIXES] },
		},
	)

	expand(ok)
})

test('platform barrels must be claimed by their environment', () => {
	const missing = fixture(
		{ environments: { web: { files: ['src/index.ts', 'src/index.web.ts'] } } },
		['src/index.ts', 'src/index.web.ts', 'src/index.macos.ts'],
	)

	assert.throws(() => expand(missing), /index\.macos\.ts.*not claimed.*macos/s)

	const covered = fixture(
		{
			environments: {
				web: { files: ['src/index.ts', 'src/index.web.ts'] },
				macos: { files: ['src/index.macos.ts'] },
			},
		},
		['src/index.ts', 'src/index.web.ts', 'src/index.macos.ts'],
	)

	expand(covered)
})

test('the written config extends the manifest and expands in place', () => {
	const dir = fixture({
		environments: { web: { files: ['src/index.ts'] } },
	})

	const [program] = expand(dir)
	assert.ok(existsSync(program.configPath))
	const config = JSON.parse(readFileSync(program.configPath, 'utf8'))
	assert.equal(config.extends, join(dir, 'tsconfig.envs.json'))
})
