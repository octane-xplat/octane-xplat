import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync, spawn } from 'node:child_process'
import {
	mkdirSync,
	readFileSync,
	writeFileSync,
	rmSync,
	symlinkSync,
	readdirSync,
	existsSync,
} from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { createHash } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
import { scratchRun } from './scratch.mjs'
import { modelFixtureDir, prepareModelFixtures, modelFiles } from './model-fixtures.mjs'
import { runtimeDir, prepareOrtFixtures } from './ort-fixtures.mjs'
import { nativeInputs } from './native-inputs.mjs'

const root = resolve(import.meta.dirname, '../..'),
	work = join(root, 'research/go-cli')
const target = `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch === 'x64' ? 'amd64' : process.arch}`
const suffix = process.platform === 'win32' ? '.exe' : ''
const binary = join(work, `xplat-go-${target}-cli-onnx${suffix}`),
	build = JSON.parse(readFileSync(binary + '.json'))
const probe = join(work, `xplat-go-${target}-onnx${suffix}`)
const portable = process.env.XPLAT_GO_PORTABLE === '1'
assert.equal(build.onnx, true)
assert.deepEqual(build.inputs, nativeInputs(root))
const scratch = scratchRun(root, 'go-docs-index'),
	cache = join(scratch, 'native cache Ω'),
	namespace = join(cache, 'go-v1')
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex')
const pin = JSON.parse(readFileSync(new URL('./native-assets.json', import.meta.url))).targets[
	target
]
const modelRelative =
	'assets/models/Xenova/all-MiniLM-L6-v2/751bff37182d3f1213fa05d7196b954e230abad9'
const runtimeRelative = `assets/runtime/1.31.1/${target}/` + pin.sha256
const download = process.env.XPLAT_GO_DOCS_DOWNLOAD === '1'
const evidence = {
	scope:
		'Actual-host public native docs index, hybrid retrieval and owned-host cancellation; no Node inference in the executable',
	target,
	build,
	downloadMode: download,
	passed: false,
	queries: [],
}
let cleanupSafe = true
after(() => {
	writeFileSync(
		join(work, `docs-index-qualification-${target}${download ? '-downloads' : ''}.json`),
		JSON.stringify(evidence, null, 2) + '\n',
	)
	if (cleanupSafe) {
		rmSync(scratch, { recursive: true, force: true })
	}
})
function put(path, data) {
	mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
	writeFileSync(
		path,
		typeof data === 'string' || Buffer.isBuffer(data) ? data : JSON.stringify(data),
		{ mode: 0o600 },
	)
	return path
}
function fixture(name, documents = []) {
	const repository = join(scratch, name + '-framework'),
		app = join(scratch, name + '-app')
	put(join(repository, 'bun.lock'), '{}')
	put(join(repository, 'packages/ui/package.json'), { name: '@octane-xplat/ui', version: '1.0.0' })
	mkdirSync(join(repository, 'docs'), { recursive: true })
	for (const [path, content] of documents) {
		put(join(repository, path), content)
	}
	put(join(app, 'package.json'), { name, dependencies: { '@octane-xplat/ui': 'workspace:*' } })
	put(join(app, 'vite.config.ts'), 'export default {}')
	mkdirSync(join(app, 'node_modules/@octane-xplat'), { recursive: true })
	symlinkSync(
		join(repository, 'packages/ui'),
		join(app, 'node_modules/@octane-xplat/ui'),
		process.platform === 'win32' ? 'junction' : 'dir',
	)
	return { repository, app }
}
function argv(project, args, network = false) {
	const command = [binary, ...args, '--project', project, '--package', '@octane-xplat/ui', '--json']
	return network || process.platform !== 'darwin'
		? command
		: ['/usr/bin/sandbox-exec', '-p', '(version 1)(allow default)(deny network*)', ...command]
}
const env = {
	...process.env,
	PATH: '',
	XPLAT_MCP_CACHE: cache,
	XPLAT_DOCS_REPO: '',
	XPLAT_PERMISSIONS: '',
}
const offlineEnv = {
	...env,
	HTTP_PROXY: 'http://127.0.0.1:1',
	HTTPS_PROXY: 'http://127.0.0.1:1',
	http_proxy: 'http://127.0.0.1:1',
	https_proxy: 'http://127.0.0.1:1',
	NO_PROXY: '',
	no_proxy: '',
}

function native(project, args, { network = false, timeout = 180000 } = {}) {
	const [exe, ...arguments_] = argv(project, args, network)
	const run = spawnSync(exe, arguments_, {
		env: network ? env : offlineEnv,
		encoding: 'utf8',
		timeout,
		maxBuffer: 8 << 20,
	})
	assert.equal(run.error, undefined)
	assert.equal(run.stderr, '')
	const envelope = JSON.parse(run.stdout)
	assert.equal(run.status, 0, JSON.stringify(envelope))
	assert.equal(envelope.ok, true)
	return envelope.data
}
function files(directory) {
	if (!existsSync(directory)) {
		return []
	}
	return readdirSync(directory, { recursive: true })
		.filter((name) => name.endsWith('.json'))
		.map((name) => join(directory, name))
}
function noOperations() {
	assert.equal(
		readdirSync(namespace).some((name) => name.startsWith('operation-')),
		false,
	)
}

test('empty inventories prepare nothing, and native indexing supports resumable hybrid retrieval', async () => {
	const empty = fixture('empty')
	const emptyResult = native(empty.app, ['docs', 'index'])
	assert.equal(emptyResult.unavailable.length, 0, JSON.stringify(emptyResult))
	assert.equal(emptyResult.results[0].chunks, 0)
	assert.equal(emptyResult.results[0].embedded, 0)
	assert.deepEqual(readdirSync(namespace), [])
	if (!download) {
		if (!portable) {
			await prepareModelFixtures({ tokenizerOnly: false })
			await prepareOrtFixtures()
		}
		const modelSource = portable ? join(work, 'model-fixtures') : modelFixtureDir
		const runtimeSource = portable ? join(work, 'runtime-assets', pin.directory) : runtimeDir
		for (const [name, hash] of Object.entries(modelFiles)) {
			const data = readFileSync(join(modelSource, name))
			assert.equal(sha(data), hash)
			put(join(namespace, modelRelative, name), data)
		}
		const record = { archive: pin.sha256, files: {} }
		for (const name of [pin.library, 'LICENSE', 'ThirdPartyNotices.txt']) {
			const data = readFileSync(join(runtimeSource, name))
			if (name === pin.library) {
				assert.equal(sha(data), pin.librarySha256)
			}
			put(join(namespace, runtimeRelative, name), data)
			record.files[name] = sha(data)
		}
		put(join(namespace, runtimeRelative, 'runtime.json'), record)
	}
	const cases = JSON.parse(readFileSync(join(work, 'model-cases.json'))).documents
	const documents = cases.map((item, index) => [`docs/section-${index}.md`, item.text])
	documents.push([
		'docs/large-fence.md',
		'# Large fenced example\n\n```text\n' + 'x'.repeat(70000) + '\nHolographic tail marker\n```\n',
	])
	const project = fixture('guides', documents)
	const outside = join(scratch, 'external-guides')
	put(join(outside, 'secret.md'), '# External\n\nPrivate guide marker.\n')
	symlinkSync(
		outside,
		join(project.repository, 'docs/external'),
		process.platform === 'win32' ? 'junction' : 'dir',
	)
	const excluded = native(project.app, ['docs', 'read', '--path', 'docs/external/secret.md'])
	assert.equal(
		excluded.reason,
		'docs-absent',
		'a junction must not turn external files into package docs',
	)
	const indexed = native(project.app, ['docs', 'index'], { network: download })
	assert.equal(indexed.unavailable.length, 0)
	assert.equal(indexed.results[0].status, 'ready', JSON.stringify(indexed))
	assert.equal(indexed.results[0].embedded > 0, true)
	assert.equal(indexed.results[0].truncatedInputs, 1)
	assert.match(indexed.results[0].model, /onnxruntime-1\.31\.1/)
	evidence.index = indexed
	const tail = native(project.app, ['docs', 'search', 'Holographic tail marker', '--mode', 'hybrid'])
	assert.equal(tail.results[0].path, 'docs/large-fence.md')
	assert.equal(tail.retrieval[0].truncatedInputs, 1)
	for (const [name, hash] of Object.entries(modelFiles)) {
		assert.equal(sha(readFileSync(join(namespace, modelRelative, name))), hash)
	}
	assert.equal(sha(readFileSync(join(namespace, runtimeRelative, pin.library))), pin.librarySha256)
	for (let i = 0; i < cases.length; i++) {
		const found = native(project.app, [
			'docs',
			'search',
			cases[i].query,
			'--mode',
			'hybrid',
			'--limit',
			'3',
		])
		assert.equal(found.retrieval[0].used, 'hybrid', JSON.stringify(found.retrieval))
		assert.equal(
			found.results.some((hit) => hit.path === `docs/section-${i}.md`),
			true,
			cases[i].query,
		)
		evidence.queries.push({
			query: cases[i].query,
			paths: found.results.map((hit) => hit.path),
			retrieval: found.retrieval,
		})
		const page = native(project.app, ['docs', 'read', '--ref', found.results[0].ref])
		assert.equal(page.provenance.source, 'development-docs')
	}
	const repeated = native(project.app, ['docs', 'index'])
	assert.equal(repeated.results[0].embedded, 0)
	const corruptFile = files(join(namespace, 'embeddings'))[0],
		record = JSON.parse(readFileSync(corruptFile))
	assert.notEqual(record.values[0], record.values[1])
	;[record.values[0], record.values[1]] = [record.values[1], record.values[0]]
	put(corruptFile, record)
	const corrupted = native(project.app, ['docs', 'search', cases[0].query, '--mode', 'hybrid'])
	assert.equal(corrupted.retrieval[0].used, 'lexical')
	assert.equal(corrupted.retrieval[0].reason, 'index-invalid')
	const repaired = native(project.app, ['docs', 'index'])
	assert.equal(repaired.results[0].embedded, 1)
	put(
		join(project.repository, 'docs/new.md'),
		'# New guide\n\nUltraviolet penguin keeps route state.\n',
	)
	const changed = native(project.app, ['docs', 'search', 'Ultraviolet penguin', '--mode', 'hybrid'])
	assert.equal(changed.retrieval[0].reason, 'index-not-ready')
	assert.equal(changed.results[0].path, 'docs/new.md')
	const updated = native(project.app, ['docs', 'index'])
	assert.equal(updated.results[0].embedded > 0, true)
	rmSync(join(project.repository, 'docs/new.md'))
	const deleted = native(project.app, ['docs', 'search', 'Ultraviolet penguin', '--mode', 'hybrid'])
	assert.equal(
		deleted.results.some((hit) => hit.path === 'docs/new.md'),
		false,
	)
	const config = join(namespace, modelRelative, 'config.json'),
		original = readFileSync(config)
	put(config, '{}')
	const invalidAsset = native(project.app, ['docs', 'search', cases[0].query, '--mode', 'hybrid'])
	assert.equal(invalidAsset.retrieval[0].reason, 'model-unavailable')
	put(config, original)
	noOperations()

	if (process.platform !== 'win32') {
		const cancellation = fixture('cancel', [
			[
				'docs/batch.md',
				'# Owned index\n\n' +
					Array.from(
						{ length: 256 },
						(_, i) =>
							`## Section ${i}\n\n${('Native inference keeps the current route and camera state ' + i + ' ').repeat(18)}\n\n`,
					).join(''),
			],
		])
		const before = new Set(files(join(namespace, 'embeddings')))
		const [exe, ...args] = argv(cancellation.app, ['docs', 'index'])
		const child = spawn(exe, args, { env: offlineEnv })
		let stdout = '',
			stderr = ''
		child.stdout.on('data', (chunk) => (stdout += chunk))
		child.stderr.on('data', (chunk) => (stderr += chunk))
		const done = new Promise((resolveExit, reject) => {
			child.once('error', reject)
			child.once('close', (code) => resolveExit(code))
		})
		try {
			const deadline = Date.now() + 30000
			while (
				files(join(namespace, 'embeddings')).length === before.size &&
				child.exitCode === null &&
				Date.now() < deadline
			) {
				await delay(25)
			}
			assert.equal(child.exitCode, null, 'index must still be running when publication is observed')
			assert.equal(
				files(join(namespace, 'embeddings')).length > before.size,
				true,
				'wait for actual completed embeddings',
			)
			child.kill('SIGTERM')
			assert.equal(await done, 8)
			assert.equal(stderr, '')
			const envelope = JSON.parse(stdout)
			assert.equal(envelope.ok, false)
			assert.equal(envelope.error.code, 'cancelled')
			assert.match(envelope.error.message, /context canceled|cancelled/)
			noOperations()
			const saved = files(join(namespace, 'embeddings')).length - before.size
			assert.equal(saved > 0, true)
			await delay(150)
			assert.equal(
				files(join(namespace, 'embeddings')).length,
				before.size + saved,
				'nothing publishes after confirmed cleanup',
			)
			const resumed = native(cancellation.app, ['docs', 'index'])
			assert.equal(resumed.results[0].status, 'ready')
			assert.equal(resumed.results[0].embedded > 0, true)
			assert.equal(resumed.results[0].embedded < resumed.results[0].chunks, true)
			evidence.cancellation = { saved, resumed: resumed.results[0] }
			noOperations()
		} finally {
			if (child.exitCode === null) {
				child.kill('SIGTERM')
				await done
			}
		}
	}
	await hostCancellation()
	evidence.passed = true
})

async function hostCancellation() {
	const project = fixture('host-cancel', [
		[
			'docs/native.md',
			'# Native owner\n\n' +
				Array.from(
					{ length: 256 },
					(_, i) =>
						`## Owned section ${i}\n\n${('Host inference preserves current state and cleans up its operation ' + i + ' ').repeat(18)}\n\n`,
				).join(''),
		],
	])
	const started = spawnSync(
		probe,
		['host-start', '--directory', scratch, '--project', project.app],
		{ env: offlineEnv, encoding: 'utf8', timeout: 30000 },
	)
	assert.equal(started.status, 0, started.stdout + started.stderr)
	const owner = JSON.parse(started.stdout),
		descriptor = JSON.parse(readFileSync(join(owner.directory, 'host.json')))
	async function rpc(method, params = {}) {
		const response = await fetch(descriptor.address, {
			method: 'POST',
			// spawnSync blocks Node's pool timers while a native CLI operation runs.
			// Use fresh connections, as the native RPC client does, rather than
			// reusing a socket past the owner's idle timeout after that pause.
			headers: {
				Authorization: 'Bearer ' + descriptor.token,
				'Content-Type': 'application/json',
				Connection: 'close',
			},
			body: JSON.stringify({ method, params }),
			signal: AbortSignal.timeout(10000),
		})
		const result = await response.json()
		assert.equal(result.ok, true, result.error)
		return result.data
	}
	let failure
	try {
		const before = files(join(namespace, 'embeddings')).length
		const job = await rpc('native.start', {
			operation: 'docs-index',
			payload: { package: '@octane-xplat/ui' },
		})
		let state = await rpc('job.status', { id: job.id }),
			deadline = Date.now() + 30000
		while (
			files(join(namespace, 'embeddings')).length === before &&
			state.state === 'running' &&
			Date.now() < deadline
		) {
			await delay(25)
			state = await rpc('job.status', { id: job.id })
		}
		assert.equal(state.state, 'running', 'cancel an active native index job')
		assert.equal(
			files(join(namespace, 'embeddings')).length > before,
			true,
			'observe completed model work before cancellation',
		)
		const start = performance.now()
		const ping = await rpc('host.ping')
		assert.equal(ping.generation, owner.owner.generation)
		const pingMs = performance.now() - start
		assert.equal(pingMs < 1000, true, 'owner remains responsive while native inference runs')
		await rpc('job.cancel', { id: job.id })
		deadline = Date.now() + 15000
		while (state.state === 'running' && Date.now() < deadline) {
			state = await rpc('job.status', { id: job.id })
			if (state.state === 'running') {
				await delay(25)
			}
		}
		assert.equal(state.state, 'cancelled', JSON.stringify(state))
		noOperations()
		const saved = files(join(namespace, 'embeddings')).length - before
		assert.equal(saved > 0, true)
		await delay(150)
		assert.equal(files(join(namespace, 'embeddings')).length, before + saved)
		const resumed = native(project.app, ['docs', 'index'])
		assert.equal(resumed.results[0].status, 'ready')
		assert.equal(resumed.results[0].embedded < resumed.results[0].chunks, true)
		evidence.ownerCancellation = {
			saved,
			pingMs,
			resumed: resumed.results[0],
			publicOwnerIntegration: 'pending',
		}
		noOperations()
	} catch (error) {
		failure = error
	}
	try {
		await rpc('host.shutdown')
		const deadline = Date.now() + 15000
		while (existsSync(owner.directory) && Date.now() < deadline) {
			await delay(25)
		}
		assert.equal(existsSync(owner.directory), false, 'owner shutdown awaits native cleanup')
	} catch (error) {
		cleanupSafe = false
		evidence.privateScratchRetained = scratch
		failure = failure
			? new AggregateError([failure, error], 'Native operation and owner cleanup both failed')
			: error
	}
	if (failure) {
		throw failure
	}
}
