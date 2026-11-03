import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, symlinkSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { AGENT_COMMANDS } from '../../packages/cli/src/agent/commands.ts'
import { parseArgs } from '../../packages/cli/src/agent/parse.ts'
import { commandSchema } from '../../packages/cli/src/agent/catalog.ts'
import {
	discoverWorkspace,
	detectGuidance,
	resolveFrameworkBinding,
} from '../../packages/cli/src/mcp/discovery.ts'
import { createPolicyStore } from '../../packages/cli/src/mcp/contracts/policy.ts'
import { scratchRun } from '../cli-nim/scratch.mjs'
import { nativeInputs } from './native-inputs.mjs'

const root = resolve(import.meta.dirname, '../..'),
	work = join(root, 'research/go-cli')
const host = `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch === 'x64' ? 'amd64' : process.arch}`
const suffix = process.platform === 'win32' ? '.exe' : ''
const binary = join(work, `xplat-go-${host}-cli${suffix}`),
	probe = join(work, `xplat-go-${host}${suffix}`)
for (const executable of [binary, probe]) {
	assert.deepEqual(
		JSON.parse(readFileSync(executable + '.json')).inputs,
		nativeInputs(root),
		'Stale Go contract build',
	)
}
const scratch = scratchRun(root, 'go-contracts')
function put(path, value) {
	mkdirSync(dirname(path), { recursive: true })
	writeFileSync(path, typeof value === 'string' ? value : JSON.stringify(value))
	return path
}
function cli(args, options = {}) {
	const result = spawnSync(binary, args, {
		cwd: scratch,
		encoding: 'utf8',
		timeout: 10000,
		env: {
			...process.env,
			PATH: '',
			XPLAT_PERMISSIONS: '',
			XPLAT_AGENT_CLIENT: '',
			...options.env,
		},
	})
	assert.equal(result.stderr, '', result.stderr)
	const value = JSON.parse(result.stdout)
	delete value.requestId
	return { status: result.status, value }
}
function normal(value) {
	if (Array.isArray(value)) {
		return value.map(normal)
	}
	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value)
				.filter(([key]) => !['grantedAt', 'selectedAt'].includes(key))
				.map(([key, item]) => [key, normal(item)]),
		)
	}
	return value
}

test('all descriptors expose truthful native schemas outside a project', () => {
	for (const command of AGENT_COMMANDS) {
		const actual = cli([...command.path, '--schema'])
		assert.equal(actual.status, 0)
		const expected = commandSchema(command)
		expected.status = [
			'catalog',
			'permissions',
			'app select',
			'status',
			'capabilities',
			'code search',
			'code read',
		].includes(command.name)
			? 'implemented'
			: 'pending'
		assert.deepEqual(actual.value.data, expected)
	}
	const catalog = cli(['catalog', '--json'])
	assert.equal(catalog.status, 0)
	assert.equal(
		catalog.value.data.cli.version,
		JSON.parse(readFileSync(binary + '.json')).cliVersion,
	)
	assert.equal(
		catalog.value.data.commands.filter((command) => command.status === 'implemented').length,
		7,
	)
	for (const [args, code] of [
		[['docs', '--json'], 'invalid_selection'],
		[['docs', 'unknown', '--json'], 'invalid_selection'],
		[['actions', 'status', '--json'], 'invalid_selection'],
		[['session', 'list', '--json'], 'unavailable'],
	]) {
		const actual = cli(args)
		assert.equal(actual.value.ok, false)
		assert.equal(actual.value.error.code, code)
	}
})

test('status preserves identity, guidance and actual package bindings without claiming pending providers', () => {
	const project = join(scratch, 'status')
	put(join(project, 'package.json'), { name: 'workspace', workspaces: ['apps/*'] })
	put(join(project, 'AGENTS.md'), 'Workspace guidance')
	put(join(project, 'apps/one/package.json'), {
		name: 'one',
		dependencies: { '@octane-xplat/ui': '^0.18.0' },
	})
	put(join(project, 'apps/one/vite.config.ts'), 'export default {}')
	put(join(project, 'apps/one/CLAUDE.md'), 'App guidance')
	put(join(project, 'apps/one/node_modules/@octane-xplat/ui/package.json'), {
		name: '@octane-xplat/ui',
		version: '0.19.0',
	})
	put(
		join(project, 'pnpm-lock.yaml'),
		"importers: {apps/one: {dependencies: {'@octane-xplat/ui': {version: '0.18.0'}}}}",
	)
	const status = cli(['status', '--project', project, '--json'])
	assert.equal(status.status, 0)
	assert.equal(
		status.value.context.projectId,
		null,
		'Sole selection does not persist an explicit binding',
	)
	const data = status.value.data,
		discovery = discoverWorkspace(project),
		app = discovery.apps[0]
	assert.deepEqual(data.identity, {
		...discovery,
		selection: { state: 'bound', app, reason: 'sole-app' },
		framework: JSON.parse(JSON.stringify(resolveFrameworkBinding(project, app.root))),
	})
	assert.deepEqual(data.guidance.sources, [
		...detectGuidance(project),
		...detectGuidance(app.root).map((source) => ({ ...source, path: `${app.id}/${source.path}` })),
	])
	assert.equal(data.server.name, '@octane-xplat/cli')
	assert.equal(data.prerequisites.find((check) => check.id === 'node').status, 'missing')
	assert.equal(data.prerequisites.find((check) => check.id === 'chromium').status, 'unknown')
	assert.deepEqual(data.docs, { state: 'not_provided' })
	assert.equal(data.codeIndex.state, 'ready')
	for (const matrix of data.capabilities) {
		assert.equal(matrix.declared, true)
		assert.deepEqual(
			matrix.capabilities
				.filter((entry) => entry.status === 'supported')
				.map((entry) => entry.capability),
			['project_status', 'code_search'],
		)
		assert.equal(
			matrix.capabilities.find((entry) => entry.capability === 'screenshot').requiresPermission,
			'visual-capture',
		)
		assert.equal(
			matrix.capabilities.find((entry) => entry.capability === 'guidance').status,
			'partial',
		)
	}
	assert.deepEqual(
		cli(['capabilities', '--project', project, '--json']).value.data.capabilities,
		data.capabilities,
	)
	assert.deepEqual(
		cli(['capabilities', '--project', project, '--platform', 'ios', '--json']).value.data
			.capabilities,
		[],
	)
	put(join(project, 'apps/two/package.json'), { name: 'two', xplat: { targets: {} } })
	const ambiguous = cli(['status', '--project', project, '--json']).value.data
	assert.equal(ambiguous.identity.selection.state, 'ambiguous')
	assert.equal(ambiguous.identity.framework, null)
	assert.equal(ambiguous.capabilities[0].declared, false)
	assert.deepEqual(ambiguous.guidance.sources, data.guidance.sources)
	const bound = cli(['status', '--project', project, '--app', app.id, '--json'])
	assert.equal(bound.value.context.projectId, app.id)
	assert.equal(bound.value.data.identity.selection.reason, 'explicit')
})

test('native prerequisite probes inspect actual Node availability and clear injected Node options', () => {
	const project = join(scratch, 'prerequisites')
	put(join(project, 'package.json'), {
		name: 'app',
		packageManager: 'pnpm@11.0.0',
		xplat: { targets: {} },
	})
	const result = cli(['status', '--project', project, '--json'], {
		env: { PATH: process.env.PATH, NODE_OPTIONS: '--not-a-real-option', NODE_PATH: '/missing' },
	})
	assert.equal(result.status, 0)
	const checks = result.value.data.prerequisites
	assert.equal(checks.find((check) => check.id === 'node').detail, process.version)
	assert.equal(checks.find((check) => check.id === 'node').status, 'satisfied')
	assert.ok(checks.some((check) => check.id === 'pnpm'))
	assert.ok(
		!checks.some((check) => check.id === 'bun'),
		'Do not require Bun for a declared pnpm project',
	)
})

test('descriptor parser matches independent Node across the existing native argument corpus', () => {
	const requests = []
	const add = (command, argv) => requests.push({ command, argv })
	for (const command of AGENT_COMMANDS) {
		for (const argv of [
			[],
			['--help'],
			['-h'],
			['--help=true'],
			['--schema'],
			['--unknown'],
			['--help', '--unknown'],
			['--', '--json'],
			['extra', 'more'],
			['--json=false'],
			['-json'],
			['---json'],
		]) {
			add(command, argv)
		}
		for (const flag of command.flags) {
			const values =
				flag.type === 'boolean'
					? ['true', 'false', '']
					: flag.type === 'integer'
						? [
								'',
								' ',
								'0',
								'-0',
								'1',
								'1.0',
								'1e1',
								'1e20',
								'1e21',
								'1e30',
								'\u00a0',
								'\ufeff1\u00a0',
								'1.5',
								'0x10',
								'0b10',
								'0o10',
								'0x',
								'+0x10',
								'0x+10',
								'0x-10',
								'1_0',
								'NaN',
								'Infinity',
								'abc',
								'-1',
								'1000000',
							]
						: flag.type === 'enum'
							? [...flag.values, 'invalid', '']
							: ['', 'hello world', 'https://example.invalid/a?q=x', '-']
			add(command, [`--${flag.flag}`])
			add(command, [`--${flag.flag}`, '--help'])
			for (const value of values) {
				add(command, [`--${flag.flag}=${value}`, '--help'])
				add(command, [`--${flag.flag}`, value, '--help'])
			}
		}
	}
	const synthetic = {
		name: 'unicode',
		positionals: [{ name: 'value', required: true, min: 2, max: 3 }],
		flags: [],
	}
	for (const value of ['a', 'ab', 'abcd', '😀', '😀a', '😀😀']) {
		add(synthetic, [value])
	}
	const input = put(join(scratch, 'parse.json'), requests)
	const run = spawnSync(probe, ['parse', '--request', input], {
		encoding: 'utf8',
		timeout: 10000,
		maxBuffer: 32 << 20,
		env: { ...process.env, PATH: '' },
	})
	assert.equal(run.status, 0, run.stderr)
	const replies = JSON.parse(run.stdout)
	assert.equal(replies.length, requests.length)
	for (const [at, { command, argv }] of requests.entries()) {
		assert.deepEqual(
			replies[at],
			JSON.parse(JSON.stringify(parseArgs(command, argv))),
			`${command.name}: ${JSON.stringify(argv)}`,
		)
	}
	console.log(`${requests.length} independent parser comparisons`)
})

test('discovery, persisted per-client binding and envelope identity match Node', () => {
	const project = join(scratch, 'workspace')
	put(join(project, 'package.json'), { name: 'fixture', workspaces: ['apps/*'] })
	for (const [name, target] of [
		['one', 'web'],
		['two', 'linux'],
	]) {
		const app = join(project, 'apps', name)
		put(join(app, 'package.json'), {
			name: 'same-name',
			xplat: { targets: target === 'linux' ? { linux: { runtime: 'gtk' } } : {} },
		})
		if (target === 'web') {
			put(join(app, 'vite.config.mts'), '')
		}
	}
	put(join(project, 'node_modules/ignored/package.json'), { xplat: { targets: {} } })
	put(join(project, 'research/ignored/package.json'), { xplat: { targets: {} } })
	const input = put(join(scratch, 'context.json'), { project })
	function context(values) {
		put(input, { project, ...values })
		const run = spawnSync(probe, ['workspace-context', '--request', input], {
			encoding: 'utf8',
			env: { ...process.env, PATH: '', XPLAT_AGENT_CLIENT: '' },
		})
		assert.equal(run.status, 0, run.stderr)
		return JSON.parse(run.stdout)
	}
	const discovery = discoverWorkspace(project)
	assert.deepEqual(context({}).discovery, discovery)
	assert.equal(context({}).selection.state, 'ambiguous')
	const duplicate = cli(['app', 'select', 'same-name', '--project', project, '--json'])
	assert.equal(duplicate.status, 2)
	assert.equal(duplicate.value.error.code, 'ambiguous_selection')
	const selected = cli([
		'app',
		'select',
		join('apps', 'one'),
		'--project',
		project,
		'--client',
		'alice',
		'--json',
	])
	assert.equal(selected.status, 0)
	assert.equal(selected.value.context.projectId, join('apps', 'one'))
	assert.equal(selected.value.context.selection.reason, 'explicit')
	assert.equal(context({ client: 'alice' }).context.projectId, join('apps', 'one'))
	assert.equal(context({ client: 'other' }).context.projectId, null)
	assert.equal(context({ client: 'alice', app: '' }).context.projectId, null)
	const unsafe = cli([
		'app',
		'select',
		join('apps', 'one'),
		'--project',
		project,
		'--client',
		'../../outside',
		'--json',
	])
	assert.equal(unsafe.status, 2)
	assert.equal(existsSync(join(project, 'node_modules/.cache/outside.json')), false)
	const single = join(scratch, 'sole')
	put(join(single, 'package.json'), { name: 'sole', xplat: { targets: {} } })
	put(input, { project: single })
	const run = spawnSync(probe, ['workspace-context', '--request', input], {
		encoding: 'utf8',
		env: { ...process.env, PATH: '' },
	})
	const value = JSON.parse(run.stdout)
	assert.equal(value.selection.reason, 'sole-app')
	assert.equal(value.context.projectId, null)
})

test('permission policy matches Node without creating visual or retention grants', () => {
	for (const env of [
		'',
		'visual-capture',
		' evidence-retain , external-effects ',
		'\u0085visual-capture',
	]) {
		const scopes = env
			.split(',')
			.map((scope) => scope.trim())
			.filter(Boolean)
		const policy = createPolicyStore({
			taskAuthorization: true,
			grants: scopes.map((scope) => ({ scope, state: 'granted', source: 'server-config' })),
		})
		assert.deepEqual(
			normal(cli(['permissions', '--json'], { env: { XPLAT_PERMISSIONS: env } }).value.data.grants),
			normal(policy.list()),
		)
	}
	const denied = cli(['permissions', '--scope', 'visual-capture', '--json'])
	assert.equal(denied.status, 0)
	assert.equal(denied.value.data.check.granted, false)
})

test(
	'selection cache refuses a symlink escape before creating external directories',
	{ skip: process.platform === 'win32' },
	() => {
		const project = join(scratch, 'guard'),
			outside = join(scratch, 'external')
		put(join(project, 'package.json'), { xplat: { targets: {} } })
		mkdirSync(outside)
		symlinkSync(outside, join(project, 'node_modules'), 'dir')
		const result = cli(['app', 'select', '.', '--project', project, '--json'])
		assert.notEqual(result.status, 0)
		assert.equal(existsSync(join(outside, '.cache')), false)
	},
)

test.after(() => rmSync(scratch, { recursive: true, force: true }))
