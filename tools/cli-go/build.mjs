import assert from 'node:assert/strict'
import {
	readFileSync,
	writeFileSync,
	mkdirSync,
	mkdtempSync,
	rmSync,
	existsSync,
	cpSync,
} from 'node:fs'

import { resolve, join, dirname } from 'node:path'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { gzipSync } from 'node:zlib'
import { catalogPayload, commandSchema } from '../../packages/cli/src/agent/catalog.ts'
import { AGENT_COMMANDS, LEGACY_COMMANDS } from '../../packages/cli/src/agent/commands.ts'
import {
	routeCommandDescriptor,
	typecheckCommandDescriptor,
	buildCommandDescriptor,
	commandDescriptor,
} from '../cli-nim/route-templates.mjs'

import { CAPABILITY_IDS } from '../../packages/cli/src/mcp/contracts/capabilities.ts'
import { PRODUCT_BOUNDARIES } from '../../packages/cli/src/mcp/contracts/boundaries.ts'
import { nativeCliPin } from '../../packages/cli/src/cli-channel.ts'
import { nativeInputs } from './native-inputs.mjs'
import { buildReleaseWorker } from './release-worker.mjs'
import { updatesHook } from '../../packages/cli/src/updates-hook.ts'

const root = resolve(import.meta.dirname, '../..')
const work = join(root, 'research/go-cli')
const moduleDirectory = join(root, 'packages/cli/go')
mkdirSync(work, { recursive: true })
const flags = process.argv.slice(2)
assert.ok(flags.every((value) => ['--test', '--test-binary', '--onnx', '--cli', '--test-owner-race'].includes(value)))
const onnx = flags.includes('--onnx')
const cli = flags.includes('--cli')
const testBinary = flags.includes('--test-binary')
const ownerRace = flags.includes('--test-owner-race')
assert.ok(!ownerRace || flags.length === 1, 'Owner race qualification is a host-only standalone test mode')
const tags = [...(cli ? [] : ['probe']), ...(onnx ? ['onnx'] : [])]
const sourceVersion = JSON.parse(readFileSync(join(root, 'packages/cli/package.json'))).version
assert.equal(
	sourceVersion,
	JSON.parse(readFileSync(join(root, 'packages/create/compatibility.json'))).frameworkVersion,
	'Synchronize CLI/framework source versions',
)

const version = process.env.XPLAT_GO_VERSION ?? sourceVersion + '-nim.0'
assert.equal(
	nativeCliPin(version, sourceVersion),
	version,
	'Use the exact same-release native prerelease pin',
)

const releaseWorker = cli ? buildReleaseWorker(root, join(work, 'release-worker'), version) : null

const zig = onnx && process.env.CC?.startsWith('zig ')
const env = {
	...process.env,
	GOTOOLCHAIN: 'local',
	GOENV: 'off',
	GOWORK: 'off',
	GOCACHE: join(work, 'build-cache'),
	GOMODCACHE: join(work, 'module-cache'),
	CGO_ENABLED: onnx || ownerRace ? '1' : '0',
	ZIG_GLOBAL_CACHE_DIR: join(work, 'zig-global-cache'),
	ZIG_LOCAL_CACHE_DIR: join(work, 'zig-local-cache'),
}

function run(command, args, options = {}) {
	const result = spawnSync(command, args, {
		cwd: moduleDirectory,
		env,
		encoding: 'utf8',
		...options,
	})
	assert.equal(
		result.status,
		0,
		`${command} ${args.join(' ')}\n${result.stdout ?? ''}${result.stderr ?? ''}${result.error?.message ?? ''}`,
	)
	return result.stdout
}

assert.match(
	run('go', ['version']),
	/^go version go1\.27\.3 /,
	'Install the pinned Go 1.27.3 compiler',
)

if (zig) {
	assert.equal(
		run('zig', ['version']).trim(),
		'0.17.0',
		'Use the pinned Zig 0.17.0 C cross-compiler',
	)
}

writeFileSync(
	join(moduleDirectory, 'catalog.json'),
	JSON.stringify({
		catalog: catalogPayload(),
		updatesHook,
		frameworkVersion: JSON.parse(readFileSync(join(root, 'packages/create/compatibility.json')))
			.frameworkVersion,
		descriptors: AGENT_COMMANDS,
		orchestrationDescriptors: Object.entries({
			routes: routeCommandDescriptor,
			typecheck: typecheckCommandDescriptor,
			build: buildCommandDescriptor,
			dev: (source) => commandDescriptor(source, 'dev'),
			clean: (source) => commandDescriptor(source, 'clean'),
			doctor: (source) => commandDescriptor(source, 'doctor'),
			upgrade: (source) => commandDescriptor(source, 'upgrade'),
			add: (source) => commandDescriptor(source, 'add'),
		})
			.map(([name, descriptor]) => ({
				...descriptor(readFileSync(join(root, `packages/cli/src/commands/${name}.ts`), 'utf8')),
				path: [name],
				context: 'none',
				summary: LEGACY_COMMANDS.find((command) => command.name === name).summary,
			}))
			.map((command) => ({
				...command,
				flags: command.flags.map(({ description, ...flag }) => ({ ...flag, desc: description })),
			}))
			.concat([
				...Object.entries({
					patches: ['apply', 'check'],
					updates: ['init'],
					fonts: ['add'],
					workshop: ['init', 'doctor', 'list', 'dev'],
				})
					.flatMap(([group, children]) =>
						children.map((child) => ({
							...commandDescriptor(
								readFileSync(join(root, `packages/cli/src/commands/${group}.ts`), 'utf8'),
								child,
							),
							name: group + ' ' + child,
							path: [group, child],
							context: 'none',
						})),
					)
					.map((command) => ({
						...command,
						flags: command.flags.map(({ description, ...flag }) => ({
							...flag,
							desc: description,
						})),
					})),
				{
					// The reference formatter has a raw argv parser, not a cmdr descriptor.
					// Keep these three inputs covered by the native/reference workflow gate.
					name: 'fmt',
					path: ['fmt'],
					context: 'none',
					summary: LEGACY_COMMANDS.find((command) => command.name === 'fmt').summary,
					flags: [
						{ flag: 'check', type: 'boolean', desc: 'Report differences without writing' },
						{
							flag: 'stdin-filepath',
							type: 'string',
							key: 'stdinFilepath',
							desc: 'Format stdin using this path',
						},
					],
					positionals: [{ name: 'paths', variadic: true }],
				},
				{
					name: 'lint',
					path: ['lint'],
					context: 'none',
					summary: LEGACY_COMMANDS.find((command) => command.name === 'lint').summary,
					flags: [{ flag: 'fix', type: 'boolean', desc: 'Apply safe lint fixes' }],
					positionals: [{ name: 'paths', variadic: true }],
				},
			]),
		version,
		capabilityIds: CAPABILITY_IDS,
		boundaries: PRODUCT_BOUNDARIES,
		schemas: Object.fromEntries(
			AGENT_COMMANDS.map((command) => [command.name, commandSchema(command)]),
		),
	}),
)

// Preserve the probe harness's generated reference input beside its runner.
writeFileSync(
	join(import.meta.dirname, 'catalog.json'),
	readFileSync(join(moduleDirectory, 'catalog.json')),
)

writeFileSync(
	join(moduleDirectory, 'native-assets.json'),
	readFileSync(join(import.meta.dirname, 'native-assets.json')),
)

run('go', ['mod', 'download'], { stdio: 'inherit' })
if (flags.includes('--test') || ownerRace) {
	run(
		'go',
		[
			'test',
			'-count=1',
			...(ownerRace ? ['-race', '-run=^TestAgentOwner'] : []),
			'-mod=readonly',
			...(tags.length ? ['-tags=' + tags.join(',')] : []),
			'./...',
		],
		{
			stdio: 'inherit',
		},
	)
} else {
	const target = `${env.GOOS ?? (process.platform === 'win32' ? 'windows' : process.platform)}-${env.GOARCH ?? (process.arch === 'x64' ? 'amd64' : process.arch)}`
	const binary = join(
		work,
		`${testBinary ? 'go-tests' : 'xplat-go'}-${target}${cli ? '-cli' : ''}${onnx ? '-onnx' : ''}${target.startsWith('windows') ? '.exe' : ''}`,
	)

	const sha = (bytes) => createHash('sha256').update(bytes).digest('hex')
	const inputs = () => nativeInputs(root)
	const before = inputs()
	run(
		'go',
		[
			...(testBinary ? ['test', '-c'] : ['build']),
			'-mod=readonly',
			'-trimpath',
			'-buildvcs=false',
			'-ldflags=-s -w',
			...(tags.length ? ['-tags=' + tags.join(',')] : []),
			'-o',
			binary,
			'.',
		],
		{ stdio: 'inherit' },
	)

	assert.deepEqual(inputs(), before, 'Source changed during build')
	const bytes = readFileSync(binary)
	if (testBinary) {
		const record = {
			version: 2,
			kind: 'test-executable',
			compiler: run('go', ['version']).trim(),
			target,
			sourceCommit: spawnSync('git', ['rev-parse', 'HEAD'], {
				cwd: root,
				encoding: 'utf8',
			}).stdout.trim(),
			inputs: before,
			bytes: bytes.length,
			sha256: sha(bytes),
			binary,
		}

		writeFileSync(binary + '.json', JSON.stringify(record, null, 2) + '\n')
		console.log(JSON.stringify({ ...record, inputs: undefined }))
		process.exit(0)
	}

	const stage = mkdtempSync(join(work, 'download-'))
	let download
	try {
		const executable = target.startsWith('windows') ? 'xplat-go.exe' : 'xplat-go'
		writeFileSync(join(stage, executable), bytes, { mode: 0o755 })
		const goroot = run('go', ['env', 'GOROOT']).trim()
		const goLicense = existsSync(join(goroot, 'LICENSE'))
			? join(goroot, 'LICENSE')
			: join(dirname(goroot), 'LICENSE')

		const notices = ['Go standard library\n' + readFileSync(goLicense, 'utf8')]
		notices.push(
			readFileSync(join(moduleDirectory, 'NOTICE.txt'), 'utf8'),
			readFileSync(join(moduleDirectory, 'licenses/tokenizers-js.txt'), 'utf8'),
		)

		for (const [name, version, license] of [
			['golang.org/x/sys', 'v0.49.0', 'LICENSE'],
			['golang.org/x/text', 'v0.43.0', 'LICENSE'],
			['gopkg.in/yaml.v3', 'v3.0.1', 'LICENSE'],
			...(onnx ? [['github.com/yalue/onnxruntime_go', 'v1.38.0', 'LICENSE']] : []),
		]) {
			notices.push(
				name +
					'@' +
					version +
					'\n' +
					readFileSync(join(env.GOMODCACHE, name + '@' + version, license), 'utf8'),
			)
		}

		writeFileSync(join(stage, 'THIRD-PARTY-NOTICES.txt'), notices.join('\n\n'))
		writeFileSync(join(stage, 'LICENSE'), readFileSync(join(root, 'LICENSE')))
		writeFileSync(
			join(stage, 'README.txt'),
			'Experimental bounded Go CLI feasibility probe, not the production CLI.\nNo Node/Bun or old CLI runtime is bundled. Release upgrade policy and its small Node dependencies are included. Project build engines and ONNX/model assets are separate.\n',
		)

		if (cli) {
			cpSync(join(work, 'release-worker'), join(stage, 'native-worker'), { recursive: true })
			writeFileSync(
				join(stage, 'package.json'),
				JSON.stringify({ name: '@octane-xplat/cli', version }),
			)
		}

		const archive = binary + '.tgz'
		run(
			'tar',
			[
				'--no-xattrs',
				'-czf',
				archive,
				'-C',
				stage,
				executable,
				'THIRD-PARTY-NOTICES.txt',
				'LICENSE',
				'README.txt',
				...(cli ? ['package.json', 'native-worker'] : []),
			],
			{ env: { ...env, COPYFILE_DISABLE: '1' } },
		)

		const packed = readFileSync(archive)
		download = { file: archive, bytes: packed.length, sha256: sha(packed) }
	} finally {
		rmSync(stage, { recursive: true, force: true })
	}

	const record = {
		version: 2,
		cli,
		cliVersion: version,
		compiler: run('go', ['version']).trim(),
		target,
		onnx,
		cCompiler: onnx ? (env.CC ?? 'host default') : null,
		zigVersion: zig ? '0.17.0' : null,
		sourceCommit: spawnSync('git', ['rev-parse', 'HEAD'], {
			cwd: root,
			encoding: 'utf8',
		}).stdout.trim(),
		inputs: before,
		bytes: bytes.length,
		gzipBytes: gzipSync(bytes, { level: 6 }).length,
		sha256: sha(bytes),
		binary,
		download,
		releaseWorker,
	}

	writeFileSync(binary + '.json', JSON.stringify(record, null, 2) + '\n')
	console.log(JSON.stringify(record))
}
