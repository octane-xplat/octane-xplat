// Optional local macOS qualification: reserve one native build slot before running.
// Deliberately aborts only its disposable app; never included in PR checks.
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
import { spawn, execFileSync } from 'node:child_process'
import { writeFile, readFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { prepare } from '../../../scripts/probe/project.ts'
import { listRetainedSessions } from '../dist/dev-logs.js'
const project = await prepare('macos', fileURLToPath(import.meta.url))
const root = project.root
const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
manifest.xplat.targets.macos.dev = {
	viteConfig: 'vite.logs.config.mjs',
	bundleFile: 'dist/crash.cjs',
}

await writeFile(join(root, 'package.json'), JSON.stringify(manifest, null, 2))
await writeFile(
	join(root, 'vite.logs.config.mjs'),
	`export default {build:{lib:{entry:'src/index.ts',formats:['cjs'],fileName:()=> 'crash.cjs'}}}`,
)

await writeFile(
	join(root, 'src/index.ts'),
	`const app=NSApplication.sharedApplication;app.setActivationPolicy(2);console.log('CRASH_PROBE_ABORT '+typeof abort);setTimeout(()=>{console.log('CRASH_PROBE_TRIGGER');abort()},1000)`,
)

const cli = resolve('packages/cli/dist/cli.js')
const child = spawn(process.execPath, [cli, 'dev', 'macos'], {
	cwd: root,
	detached: true,
	stdio: ['ignore', 'pipe', 'pipe'],
})

let output = ''
child.stdout.on('data', (c) => (output += c))
child.stderr.on('data', (c) => (output += c))
const closed = new Promise((r) => child.once('close', r))
const timeout = setTimeout(() => {
	try {
		process.kill(-child.pid, 'SIGTERM')
	} catch {}
}, 60000)

await closed
clearTimeout(timeout)
await writeFile(resolve('research/dev-logs/apple-crash-transcript.log'), output)
assert.match(output, /CRASH_PROBE_ABORT function/)
assert.match(output, /CRASH_PROBE_TRIGGER/)
const run = listRetainedSessions(root)[0]
let result
for (let i = 0; i < 30; i++) {
	result = JSON.parse(
		execFileSync(
			process.execPath,
			[cli, 'diagnostics', '--project', root, '--session', run.sessionId, '--json'],
			{ encoding: 'utf8' },
		),
	)

	if (result.data?.reports?.length) {
		break
	}

	await new Promise((r) => setTimeout(r, 1000))
}

assert.equal(result.ok, true)
assert.ok(result.data.reports.length, JSON.stringify(result.data.coverage))
const report = result.data.reports[0]
assert.equal(report.kind, 'native-crash')
assert.equal(report.association, 'confirmed')
const original = JSON.parse(
	execFileSync(
		process.execPath,
		[
			cli,
			'diagnostics',
			'--project',
			root,
			'--session',
			run.sessionId,
			'--report',
			report.id,
			'--json',
		],
		{ encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 },
	),
)

assert.equal(original.ok, true)
assert.match(original.data.report.content, /SIGABRT/)
await writeFile(
	resolve('research/dev-logs/apple-crash-result.json'),
	JSON.stringify(
		{ sessionId: run.sessionId, root, report, coverage: result.data.coverage, passed: true },
		null,
		2,
	),
)

console.log(
	JSON.stringify({
		sessionId: run.sessionId,
		kind: report.kind,
		association: report.association,
		originalBytes: report.bytes,
		passed: true,
	}),
)
