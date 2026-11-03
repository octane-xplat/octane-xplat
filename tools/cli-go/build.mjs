import assert from 'node:assert/strict'
import {
	readFileSync,
	writeFileSync,
	mkdirSync,
	readdirSync,
	mkdtempSync,
	rmSync,
	existsSync,
} from 'node:fs'
import { resolve, join, dirname } from 'node:path'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { gzipSync } from 'node:zlib'
import { catalogPayload, commandSchema } from '../../packages/cli/src/agent/catalog.ts'
import { AGENT_COMMANDS } from '../../packages/cli/src/agent/commands.ts'

const root = resolve(import.meta.dirname, '../..')
const work = join(root, 'research/go-cli')
mkdirSync(work, { recursive: true })
const flags = process.argv.slice(2)
assert.ok(flags.every((value) => ['--test', '--onnx'].includes(value)))
const onnx = flags.includes('--onnx')
const zig = onnx && process.env.CC?.startsWith('zig ')
const env = {
	...process.env,
	GOTOOLCHAIN: 'local',
	GOENV: 'off',
	GOWORK: 'off',
	GOCACHE: join(work, 'build-cache'),
	GOMODCACHE: join(work, 'module-cache'),
	CGO_ENABLED: onnx ? '1' : '0',
	ZIG_GLOBAL_CACHE_DIR: join(work, 'zig-global-cache'),
	ZIG_LOCAL_CACHE_DIR: join(work, 'zig-local-cache'),
}
function run(command, args, options = {}) {
	const result = spawnSync(command, args, {
		cwd: import.meta.dirname,
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
	join(import.meta.dirname, 'catalog.json'),
	JSON.stringify({
		catalog: catalogPayload(),
		schemas: Object.fromEntries(
			AGENT_COMMANDS.map((command) => [command.name, commandSchema(command)]),
		),
	}),
)
run('go', ['mod', 'download'], { stdio: 'inherit' })
if (flags.includes('--test')) {
	run('go', ['test', '-mod=readonly', ...(onnx ? ['-tags=onnx'] : []), './...'], {
		stdio: 'inherit',
	})
} else {
	const target = `${env.GOOS ?? (process.platform === 'win32' ? 'windows' : process.platform)}-${env.GOARCH ?? (process.arch === 'x64' ? 'amd64' : process.arch)}`
	const binary = join(
		work,
		`xplat-go-${target}${onnx ? '-onnx' : ''}${target.startsWith('windows') ? '.exe' : ''}`,
	)
	const sha = (bytes) => createHash('sha256').update(bytes).digest('hex')
	const inputs = () =>
		Object.fromEntries(
			readdirSync(import.meta.dirname, { recursive: true })
				.filter((file) => /\.(go|mod|sum|json|mjs|txt)$/.test(file))
				.sort()
				.map((file) => [file, sha(readFileSync(join(import.meta.dirname, file)))]),
		)
	const before = inputs()
	run(
		'go',
		[
			'build',
			'-mod=readonly',
			'-trimpath',
			'-buildvcs=false',
			'-ldflags=-s -w',
			...(onnx ? ['-tags=onnx'] : []),
			'-o',
			binary,
			'.',
		],
		{ stdio: 'inherit' },
	)
	assert.deepEqual(inputs(), before, 'Source changed during build')
	const bytes = readFileSync(binary)
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
			readFileSync(join(import.meta.dirname, 'NOTICE.txt'), 'utf8'),
			readFileSync(join(import.meta.dirname, 'licenses/tokenizers-js.txt'), 'utf8'),
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
			'Experimental bounded Go CLI feasibility probe, not the production CLI.\nNo Node/Bun or old CLI runtime is bundled. Project workers and ONNX/model assets are separate.\n',
		)
		const archive = binary + '.tgz'
		run('tar', [
			'-czf',
			archive,
			'-C',
			stage,
			executable,
			'THIRD-PARTY-NOTICES.txt',
			'LICENSE',
			'README.txt',
		])
		const packed = readFileSync(archive)
		download = { file: archive, bytes: packed.length, sha256: sha(packed) }
	} finally {
		rmSync(stage, { recursive: true, force: true })
	}
	const record = {
		version: 1,
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
	}
	writeFileSync(binary + '.json', JSON.stringify(record, null, 2) + '\n')
	console.log(JSON.stringify(record))
}
