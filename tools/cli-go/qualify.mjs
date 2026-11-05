// Runs the real executable. This file is portable into an isolated host snapshot.
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
	readFileSync,
	writeFileSync,
	mkdirSync,
	mkdtempSync,
	existsSync,
	rmSync,
	statSync,
	realpathSync,
} from 'node:fs'
import { createServer } from 'node:http'
import { createServer as createTLS } from 'node:https'
import { createServer as createProxy } from 'node:http'
import { connect } from 'node:net'
import { join, resolve, dirname } from 'node:path'
import { homedir, platform, arch } from 'node:os'
import { setTimeout as delay } from 'node:timers/promises'
import { performance } from 'node:perf_hooks'
import { gzipSync } from 'node:zlib'
import { canPrepareFixtures, prepareFixtures } from './fixtures.mjs'

const root = resolve(import.meta.dirname, '../..')
const work = join(root, 'research/go-cli')
mkdirSync(work, { recursive: true })
const binary =
	process.env.XPLAT_GO_BINARY ??
	join(
		work,
		`xplat-go-${platform() === 'win32' ? 'windows' : platform()}-${arch() === 'x64' ? 'amd64' : arch()}${platform() === 'win32' ? '.exe' : ''}`,
	)
const build = JSON.parse(readFileSync(binary + '.json'))
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex')
const bytes = readFileSync(binary)
assert.equal(sha(bytes), build.sha256)
for (const [file, hash] of Object.entries(build.inputs)) {
	assert.equal(sha(readFileSync(join(root, file))), hash, `Stale source: ${file}`)
}
if (canPrepareFixtures(root)) {
	prepareFixtures(root, work)
}
const packages = JSON.parse(readFileSync(join(work, 'project-packages.json')))
const base = join(homedir(), 'agent-scratch/octane-xplat/go-cli-stoic-forge')
mkdirSync(base, { recursive: true })
writeFileSync(
	join(base, 'README.md'),
	'Everything in this folder is disposable.\nOwner: Go CLI feasibility. Source: stoic-forge worktree/tools/cli-go. Evidence: research/go-cli and ~/dev/reports/octane-xplat.\n',
)
const scratch = mkdtempSync(join(base, 'workflow-'))
const project = join(scratch, 'project with spaces π'),
	temporary = join(scratch, 'tmp')
mkdirSync(project)
mkdirSync(temporary)
const selected = realpathSync(project)
const environment = {
	...process.env,
	NODE_PATH: '',
	NODE_OPTIONS: '',
	TEMP: temporary,
	TMP: temporary,
	TMPDIR: temporary,
	GO_CLI_SENTINEL: 'selected project π😀',
}
let directory
const servers = []
const record = {
	version: 1,
	host: `${platform()}-${arch()}`,
	os: process.getSystemVersion?.(),
	build,
	scope:
		'Bounded Go core and curated project worker fixture; no production CLI or release installer qualification.',
	passed: false,
	checks: [],
}
function write(file, value) {
	const path = join(project, file)
	mkdirSync(dirname(path), { recursive: true })
	writeFileSync(path, typeof value === 'string' ? value : JSON.stringify(value))
	return path
}
async function run(command, args, options = {}) {
	return await new Promise((resolve, reject) => {
		const child = spawn(command, args, { cwd: project, env: environment, ...options })
		let stdout = '',
			stderr = ''
		const timer = setTimeout(() => {
			child.kill()
			reject(Error('Qualification subprocess timeout'))
		}, 120000)
		child.stdout.on('data', (bytes) => (stdout += bytes))
		child.stderr.on('data', (bytes) => (stderr += bytes))
		child.once('error', reject)
		child.once('close', (status, signal) => {
			clearTimeout(timer)
			resolve({ status, signal, stdout, stderr })
		})
	})
}
async function cli(args, { fail = false, emptyPath = false } = {}) {
	const result = await run(binary, args, {
		env: { ...environment, ...(emptyPath ? { PATH: '' } : {}) },
	})
	assert.equal(result.status, fail ? 1 : 0, `${args.join(' ')}\n${result.stdout}\n${result.stderr}`)
	assert.equal(result.stderr, '')
	return JSON.parse(result.stdout)
}
async function rpc(method, params = {}) {
	const request = write('rpc.json', params)
	return await cli(['rpc', '--directory', directory, '--method', method, '--request', request])
}
async function until(predicate, message, timeout = 20000) {
	const deadline = Date.now() + timeout
	while (Date.now() < deadline) {
		const value = await predicate()
		if (value) {
			return value
		}
		await delay(25)
	}
	assert.fail(message)
}
function alive(pid) {
	try {
		process.kill(pid, 0)
		return true
	} catch (error) {
		if (error.code === 'ESRCH') {
			return false
		}
		throw error
	}
}
async function stopOwner() {
	if (!directory) {
		return
	}
	const ping = await rpc('host.ping')
	await rpc('host.shutdown')
	await until(() => !alive(ping.pid), 'Owner survived shutdown')
	assert.equal(existsSync(directory), false)
	directory = undefined
}
async function assertWindowsPrivate(path) {
	const literal = "'" + path.replaceAll("'", "''") + "'"
	const code = `$a=Get-Acl -LiteralPath ${literal};$u=[Security.Principal.WindowsIdentity]::GetCurrent().User;$r=$a.GetAccessRules($true,$true,[Security.Principal.SecurityIdentifier]);@{owner=($a.GetOwner([Security.Principal.SecurityIdentifier]).Value -eq $u.Value);protected=$a.AreAccessRulesProtected;count=$r.Count;onlyUser=(@($r|Where-Object {$_.IdentityReference.Value -ne $u.Value}).Count -eq 0)}|ConvertTo-Json -Compress`
	const checked = await run('powershell.exe', [
		'-NoProfile',
		'-NonInteractive',
		'-EncodedCommand',
		Buffer.from(code, 'utf16le').toString('base64'),
	])
	assert.equal(checked.status, 0, checked.stderr)
	assert.deepEqual(JSON.parse(checked.stdout), {
		owner: true,
		protected: true,
		count: 1,
		onlyUser: true,
	})
}
async function serve(server) {
	servers.push(server)
	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
	return `http${server.setSecureContext ? 's' : ''}://127.0.0.1:${server.address().port}`
}
try {
	assert.match((await cli(['--help'], { emptyPath: true })).experimental, /Go/)
	const catalog = await cli(['catalog'], { emptyPath: true })
	assert.deepEqual(
		catalog,
		JSON.parse(readFileSync(join(import.meta.dirname, 'catalog.json'))).catalog,
	)
	const schema = catalog.commands[0].command ?? catalog.commands[0].name
	assert.deepEqual(
		await cli(['schema', schema], { emptyPath: true }),
		JSON.parse(readFileSync(join(import.meta.dirname, 'catalog.json'))).schemas[schema],
	)
	record.checks.push('catalog and schema equal canonical TypeScript metadata with empty PATH')
	const dependencies = Object.fromEntries(
		packages.packages.map((item) => {
			const archive = join(work, 'project-packages', item.file),
				data = readFileSync(archive)
			assert.equal(sha(data), item.sha256)
			assert.equal(data.length, item.bytes)
			return [item.name, `file:${archive.replaceAll('\\', '/')}`]
		}),
	)
	write('package.json', {
		name: 'go-native-probe-project',
		private: true,
		type: 'module',
		xplat: { targets: { web: {} } },
		devDependencies: { ...dependencies, vite: packages.vite },
		overrides: { '@octane-xplat/lib': dependencies['@octane-xplat/lib'] },
	})
	const installed = await run('bun', ['install', '--ignore-scripts', '--linker', 'isolated'])
	assert.equal(installed.status, 0, installed.stderr)
	assert.equal(existsSync(join(project, 'node_modules/@octane-xplat/build')), false)
	const discovery = await cli(['discover', '--project', project], { emptyPath: true })
	assert.equal(discovery.project, selected)
	assert.equal(discovery.workerAvailable, true)
	record.checks.push('native JSON/project/selected installed-package discovery')
	const processResult = await cli([
		'exec',
		'--project',
		project,
		'--',
		process.execPath,
		'-e',
		'console.log("stdout π😀"); console.error("stderr β"); process.exit(7)',
	])
	assert.equal(processResult.exitCode, 7)
	assert.equal(processResult.stdout, 'stdout π😀\n')
	assert.equal(processResult.stderr, 'stderr β\n')
	record.checks.push('separate stdout/stderr and child exit code')
	const server = createServer((req, res) => {
		if (req.url === '/slow') {
			req.on('close', () => res.destroy())
			return
		}
		if (req.url === '/redirect') {
			res.writeHead(302, { location: '/ok' })
			res.end()
			return
		}
		res.end('HTTP π😀')
	})
	const url = await serve(server)
	const request = write('http.json', { URL: url + '/redirect' })
	const nativeHTTP = await cli(['http', '--request', request])
	assert.equal(nativeHTTP.body, await (await fetch(url + '/redirect')).text())
	assert.equal(nativeHTTP.status, 200)
	write('http.json', { URL: url + '/ok', MaxBytes: 2 })
	assert.match((await cli(['http', '--request', request], { fail: true })).error, /byte limit/)
	write('http.json', { URL: url + '/slow' })
	assert.match(
		(await cli(['http', '--request', request, '--timeout', '100ms'], { fail: true })).error,
		/deadline|canceled/,
	)
	const key = join(scratch, 'key.pem'),
		cert = join(scratch, 'cert.pem')
	// openssl is fixture generation only; it is never part of the Go executable.
	const ssl = process.platform === 'win32' ? 'C:/Program Files/Git/usr/bin/openssl.exe' : 'openssl'
	const generated = await run(ssl, [
		'req',
		'-x509',
		'-newkey',
		'rsa:2048',
		'-nodes',
		'-days',
		'1',
		'-subj',
		'/CN=localhost',
		'-addext',
		'subjectAltName=IP:127.0.0.1',
		'-keyout',
		key,
		'-out',
		cert,
	])
	assert.equal(generated.status, 0, generated.stderr)
	const tlsURL = await serve(
		createTLS({ key: readFileSync(key), cert: readFileSync(cert) }, (_req, res) =>
			res.end('TLS native'),
		),
	)
	write('http.json', { URL: tlsURL })
	assert.match(
		(await cli(['http', '--request', request], { fail: true })).error,
		/certificate|authority/,
	)
	write('http.json', { URL: tlsURL, CA: cert })
	assert.equal((await cli(['http', '--request', request])).body, 'TLS native')
	write('http.json', { URL: tlsURL.replace('127.0.0.1', 'localhost'), CA: cert })
	assert.match(
		(await cli(['http', '--request', request], { fail: true })).error,
		/certificate|valid for/,
	)
	let connects = 0
	const proxy = createProxy()
	proxy.on('connect', (req, downstream, head) => {
		connects++
		const [host, port] = req.url.split(':')
		const upstream = connect(Number(port), host, () => {
			downstream.write('HTTP/1.1 200 Connection Established\r\n\r\n')
			upstream.write(head)
			downstream.pipe(upstream)
			upstream.pipe(downstream)
		})
		upstream.on('error', () => downstream.destroy())
		downstream.on('error', () => upstream.destroy())
		downstream.on('close', () => upstream.destroy())
	})
	const proxyURL = await serve(proxy)
	write('http.json', { URL: tlsURL, CA: cert, Proxy: proxyURL })
	assert.equal((await cli(['http', '--request', request])).body, 'TLS native')
	assert.equal(connects, 1)
	record.checks.push(
		'native HTTP redirects/body limits/cancellation and TLS trust/task CA/CONNECT proxy',
	)
	write(
		'app/index.tsx',
		'throw Error("screen module must not execute"); export const dataMode="baked"; export default () => null;\n',
	)
	const loader = `import { writeFileSync } from 'node:fs'; export const loader=async()=>{console.log('worker stdout π😀');console.error('worker stderr β');writeFileSync('observation.json',JSON.stringify({cwd:process.cwd(),nodePath:process.env.NODE_PATH,nodeOptions:process.env.NODE_OPTIONS,sentinel:process.env.GO_CLI_SENTINEL,request:process.argv[2]}));return {answer:42};};\n`
	write('app/index.loader.ts', loader)
	const payload = write('payload.json', { bake: true })
	const planned = await cli([
		'worker',
		'--project',
		project,
		'--request',
		payload,
		'--operation',
		'route-plan',
	])
	const observation = JSON.parse(readFileSync(join(project, 'observation.json')))
	assert.equal(observation.cwd, selected)
	assert.equal(observation.nodePath, '')
	assert.equal(observation.nodeOptions, '')
	assert.equal(observation.sentinel, environment.GO_CLI_SENTINEL)
	assert.match(planned.process.stderr, /worker stdout π😀/)
	assert.match(planned.process.stderr, /worker stderr β/)
	const worker = discovery.worker
	const refRequest = write('reference-request.json', {
		protocol: 'octane-build-worker',
		version: 1,
		id: 'reference',
		operation: 'route-plan',
		project: selected,
		bake: true,
	})
	const refOutput = join(project, 'reference-result.json')
	const reference = await run(process.execPath, [worker, refRequest, refOutput])
	assert.equal(reference.status, 0, reference.stderr)
	assert.deepEqual(planned.data, JSON.parse(readFileSync(refOutput)).data)
	assert.equal(planned.data.outputs.length, 18)
	record.checks.push(
		'actual Vite loader/parser worker; all18 planned output bytes equal independent canonical Node worker',
	)
	const started = await cli(['host-start', '--project', project, '--directory', scratch])
	directory = started.directory
	const first = await rpc('host.ping')
	const descriptor = JSON.parse(readFileSync(join(directory, 'host.json')))
	if (process.platform === 'win32') {
		await assertWindowsPrivate(directory)
		await assertWindowsPrivate(join(directory, 'host.json'))
	}
	const denied = await fetch(descriptor.address, {
		method: 'POST',
		body: '{}',
		headers: { authorization: 'Bearer wrong' },
	})
	assert.equal(denied.status, 401)
	const origin = await fetch(descriptor.address, {
		method: 'POST',
		body: '{}',
		headers: { authorization: 'Bearer ' + descriptor.token, origin: 'https://untrusted.example' },
	})
	assert.equal(origin.status, 401)
	write(
		'app/index.loader.ts',
		`import{spawn}from'node:child_process';import{writeFileSync}from'node:fs';export const loader=async()=>{process.on('SIGTERM',()=>{});const child=spawn(process.execPath,['-e','process.on("SIGTERM",()=>{});console.log("ready");setTimeout(()=>process.exit(9),30000)'],{stdio:['ignore','pipe','ignore']});await new Promise(r=>child.stdout.once('data',r));child.stdout.resume();writeFileSync('armed.json',JSON.stringify({pid:process.pid,child:child.pid,request:process.argv[2]}));setTimeout(()=>process.exit(9),30000);await new Promise(()=>{});};\n`,
	)
	const pending = await rpc('worker.start', { operation: 'route-plan', payload: { bake: true } })
	const armed = await until(() => {
		try {
			return JSON.parse(readFileSync(join(project, 'armed.json')))
		} catch {
			return false
		}
	}, 'Canonical worker did not arm')
	if (process.platform !== 'win32') {
		assert.equal(statSync(dirname(armed.request)).mode & 0o777, 0o700)
	} else {
		for (const file of [
			dirname(armed.request),
			armed.request,
			join(dirname(armed.request), 'result.json'),
		]) {
			await assertWindowsPrivate(file)
		}
	}
	const cancelAt = Date.now()
	await rpc('job.cancel', { id: pending.id })
	const cancelled = await until(async () => {
		const job = await rpc('job.status', { id: pending.id })
		return job.state === 'cancelled' ? job : false
	}, 'Worker cancellation did not finish')
	assert.equal(alive(armed.pid), false)
	assert.equal(alive(armed.child), false)
	assert.equal(existsSync(dirname(armed.request)), false)
	record.cancellation = {
		milliseconds: Date.now() - cancelAt,
		state: cancelled.state,
		descendantsGone: true,
	}
	await stopOwner()
	const restarted = await cli(['host-start', '--project', project, '--directory', scratch])
	directory = restarted.directory
	assert.notEqual((await rpc('host.ping')).generation, first.generation)
	await stopOwner()
	record.checks.push(
		'bootstrap/authenticated RPC/origin rejection, resistant-worker descendant cancellation, owner shutdown/restart/cleanup',
	)
	const samples = []
	for (let at = 0; at < 25; at++) {
		const start = performance.now()
		const result = spawnSync(binary, ['--help'], {
			encoding: 'utf8',
			env: { ...environment, PATH: '' },
		})
		assert.equal(result.status, 0, result.stderr)
		if (at >= 5) {
			samples.push(performance.now() - start)
		}
	}
	samples.sort((a, b) => a - b)
	record.measurements = {
		executableBytes: bytes.length,
		gzip6Bytes: gzipSync(bytes, { level: 6 }).length,
		downloadBytes: build.download.bytes,
		medianMs: (samples[9] + samples[10]) / 2,
		p95Ms: samples[18],
		samples,
		goals: { gzipBytes: 5000000, medianMs: 50 },
	}
	record.passed = true
} finally {
	if (directory) {
		await stopOwner()
	}
	for (const server of servers) {
		server.closeAllConnections?.()
		server.close()
	}
	writeFileSync(
		join(work, `qualification-${platform()}-${arch()}${build.onnx ? '-onnx' : ''}.json`),
		JSON.stringify(record, null, 2) + '\n',
	)
	rmSync(scratch, { recursive: true, force: true })
}
console.log(JSON.stringify(record, null, 2))
