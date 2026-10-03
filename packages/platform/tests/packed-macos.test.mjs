import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import ts from 'typescript'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

test('packed macOS consumer resolves generated declarations and the announce contract', () => {
	const directory = mkdtempSync(join(tmpdir(), 'xplat-announce-consumer-'))
	const run = (command, args, cwd) => {
		const result = spawnSync(command, args, { cwd, encoding: 'utf8', timeout: 120_000 })
		assert.equal(result.status, 0, result.stdout + result.stderr)
		return result.stdout
	}

	const output = run('pnpm', ['pack', '--pack-destination', directory], root)
	const tarball = output.trim().split('\n').at(-1)
	const modules = join(directory, 'node_modules/@octane-xplat/platform')
	mkdirSync(modules, { recursive: true })
	run('tar', ['-xzf', tarball, '--strip-components=1', '-C', modules], directory)
	const manifest = JSON.parse(readFileSync(join(modules, 'package.json'), 'utf8'))
	assert.equal(manifest.exports['.'].macos.types, './types/generated/macos/index.macos.d.ts')
	const entry = join(directory, 'consumer.ts')
	writeFileSync(
		entry,
		`import { announce } from '@octane-xplat/platform'
const fn: (text: string) => void = announce
const result: void = fn('Saved ✓')
// @ts-expect-error only string messages are accepted
announce(42)
// @ts-expect-error no delivery acknowledgement
const delivered: boolean = announce('Saved')
`,
	)

	const options = {
		strict: true,
		skipLibCheck: false,
		noEmit: true,
		target: ts.ScriptTarget.ES2022,
		module: ts.ModuleKind.ESNext,
		moduleResolution: ts.ModuleResolutionKind.Bundler,
		customConditions: ['macos'],
	}

	const resolved = ts.resolveModuleName('@octane-xplat/platform', entry, options, ts.sys)
	assert.equal(
		resolved.resolvedModule.resolvedFileName,
		realpathSync(join(modules, 'types/generated/macos/index.macos.d.ts')),
	)

	const example = join(directory, 'announce-status.ts')
	writeFileSync(
		example,
		readFileSync(join(root, '../../examples/accessibility/announce-status.ts'), 'utf8'),
	)

	const program = ts.createProgram([entry, example], options)
	const diagnostics = ts.getPreEmitDiagnostics(program)
	assert.equal(
		diagnostics.length,
		0,
		ts.formatDiagnosticsWithColorAndContext(diagnostics, {
			getCanonicalFileName: (path) => path,
			getCurrentDirectory: () => directory,
			getNewLine: () => '\n',
		}),
	)
})
