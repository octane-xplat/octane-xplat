// Opt-in packed-artifact stdio acceptance — the release-evidence counterpart
// to consumer-workflow.mjs (which uses an in-memory transport against this
// checkout). Here the consumer installs PACKED @octane-xplat/* tarballs and
// the MCP server is the consumer's own installed `xplat-mcp` bin, connected
// over real stdin/stdout through StdioClientTransport.
//
// Documentation binds to a local release fixture: prepare-packed-consumer.mjs
// tags the framework HEAD as v<installed version> in <work>/release-fixture.git
// and the spawned server's git resolves the canonical release repo URL to that
// fixture through a per-process url.insteadOf (never user git config).
//
// Usage: node tests/packed-stdio-consumer.mjs <work-dir>
import assert from 'node:assert/strict'
import { appendFileSync, readdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import {
	getDefaultEnvironment,
	StdioClientTransport,
} from '@modelcontextprotocol/sdk/client/stdio.js'

const work = process.argv[2] && resolve(process.argv[2])
if (!work) {
	throw new Error('Supply the prepare-packed-consumer.mjs work directory.')
}

const manifest = JSON.parse(readFileSync(join(work, 'packed-consumer.json'), 'utf8'))
const { appDir } = manifest
const osInput = process.platform === 'darwin'
const stderrLog = join(work, 'server-stderr.log')
const evidenceFile = join(work, 'stdio-run.json')
const evidence = []
const blocked = []
const PROFILE_PREFIX = 'xplat-mcp-chromium-'
const profilesBefore = new Set(
	readdirSync(tmpdir()).filter((name) => name.startsWith(PROFILE_PREFIX)),
)

// The canonical release repo is redirected to the local fixture only inside
// the spawned server process — url.insteadOf via GIT_CONFIG_* env, which git
// reads per-invocation without touching user config.
const serverEnv = (extra = {}) => ({
	...getDefaultEnvironment(),
	...process.env,
	XPLAT_MCP_WORKSPACE: appDir,
	XPLAT_MCP_CACHE: manifest.cacheDir,
	XPLAT_MCP_EVIDENCE_DIR: manifest.evidenceDir,
	GIT_CONFIG_COUNT: '1',
	GIT_CONFIG_KEY_0: `url.${manifest.fixtureUrl}.insteadOf`,
	GIT_CONFIG_VALUE_0: 'https://github.com/octane-xplat/octane-xplat',
	...extra,
})

const serverBin = join(appDir, 'node_modules', '.bin', 'xplat-mcp')
assert.ok(realpathSync(serverBin), 'installed xplat-mcp bin missing')

const transport = new StdioClientTransport({
	command: serverBin,
	args: [],
	env: serverEnv(),
	cwd: appDir,
	stderr: 'pipe',
})

transport.stderr?.on('data', (chunk) => appendFileSync(stderrLog, chunk))

const client = new Client({ name: 'packed-stdio-acceptance', version: '1' })
let sessionId
let browserPid
let lastObservation

const call = async (name, args = {}) => {
	if (!['xplat_job_status', 'xplat_inspect', 'xplat_dev_actions'].includes(name)) {
		process.stderr.write(`Checking ${name}\n`)
	}

	const result = await client.callTool({ name, arguments: args })
	assert.equal(result.isError, false, JSON.stringify(result.structuredContent))
	return result.structuredContent.data
}

const until = async (fn, timeoutMs = 60000) => {
	const deadline = Date.now() + timeoutMs
	while (Date.now() < deadline) {
		const result = await fn()
		if (result) {
			return result
		}

		await new Promise((resolve) => setTimeout(resolve, 100))
	}

	throw new Error('Acceptance condition timed out.')
}

const jobDone = (jobId) =>
	until(async () => {
		const { job } = await call('xplat_job_status', { jobId })
		assert.ok(!['failed', 'cancelled'].includes(job.state), JSON.stringify(job))
		return job.state === 'succeeded' ? job : null
	})

const inspect = (name) => call('xplat_inspect', { sessionId, control: { kind: 'testID', name } })
const pidGone = (pid) => {
	try {
		process.kill(pid, 0)
		return false
	} catch {
		return true
	}
}

const productionSources = (dir) =>
	readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
		entry.isDirectory()
			? productionSources(`${dir}/${entry.name}`)
			: [readFileSync(`${dir}/${entry.name}`, 'utf8')],
	)

try {
	// -- installed-artifact provenance ------------------------------------------
	for (const name of [
		'@octane-xplat/ui',
		'@octane-xplat/cli',
		'@octane-xplat/platform',
		'@octane-xplat/mcp',
	]) {
		const resolved = realpathSync(join(appDir, 'node_modules', name))
		assert.ok(
			!resolved.includes('/octane-xplat/packages/'),
			`${name} resolves into the framework workspace: ${resolved}`,
		)
	}

	evidence.push({ check: 'installed packages are packed payloads, not workspace links' })

	await client.connect(transport)
	const status = await call('xplat_project_status')
	assert.equal(status.identity.selection.state, 'bound')
	assert.equal(status.identity.framework.status, 'installed')
	for (const pkg of status.identity.framework.packages) {
		assert.equal(pkg.source, 'installed', JSON.stringify(pkg))
		// The private MCP package packs at 0.0.0; every released lockstep
		// package must resolve to the packed version, not a registry guess.
		assert.equal(
			pkg.version,
			pkg.name === '@octane-xplat/mcp' ? '0.0.0' : manifest.frameworkVersion,
			JSON.stringify(pkg),
		)
	}

	evidence.push({
		check: 'exact installed-version provenance (packed 0.14.0, no workspace/lockfile guess)',
		server: status.server,
		framework: status.identity.framework,
	})

	// -- version-bound docs over the release fixture -----------------------------
	const docs = await call('xplat_docs_search', {
		query: 'testID',
		package: '@octane-xplat/ui',
	})

	assert.ok(docs.results.length, JSON.stringify(docs))
	const hit = docs.results[0]
	assert.equal(hit.provenance.match, 'exact')
	assert.equal(hit.provenance.tag, manifest.releaseTag)
	assert.equal(hit.provenance.commit, manifest.fixtureCommit)
	assert.equal(hit.provenance.servedVersion, manifest.frameworkVersion)
	const page = await call('xplat_docs_read', { ref: hit.ref, limit: 2000 })
	assert.equal(page.provenance.match, 'exact')
	assert.equal(page.provenance.commit, manifest.fixtureCommit)
	evidence.push({
		check: 'docs bound to the exact release tag/commit for the installed version',
		provenance: page.provenance,
	})

	const allDocs = await call('xplat_docs_search', { query: 'testID' })
	const mcpUnavailable = allDocs.unavailable.find(
		(u) => u.provenance?.package === '@octane-xplat/mcp',
	)

	assert.ok(mcpUnavailable, 'expected tag-absent unavailable for @octane-xplat/mcp@0.0.0')
	assert.equal(mcpUnavailable.reason, 'tag-absent')
	// An explicit out-of-binding version can never fall back to latest docs.
	const outside = await call('xplat_docs_read', {
		package: '@octane-xplat/ui',
		version: '0.9.0',
		path: 'docs/testing/test-identifiers.md',
	})

	assert.equal(outside.status, 'unavailable')
	assert.equal(outside.reason, 'tag-absent')
	evidence.push({
		check: 'no latest fallback: unreleased/absent tags return explicit unavailable',
		unavailable: [mcpUnavailable, { requested: '@octane-xplat/ui@0.9.0', reason: outside.reason }],
	})

	// -- current-code retrieval ---------------------------------------------------
	const code = await call('xplat_code_search', {
		query: 'counter.increment',
		corpus: 'app',
		mode: 'exact',
	})

	assert.ok(code.results.length)
	const codePage = await call('xplat_code_read', { ref: code.results[0].ref })
	assert.ok(JSON.stringify(codePage).includes('counter.increment'))
	evidence.push({ check: 'current app code search/read' })

	// -- build + production exclusion ----------------------------------------------
	const build = await call('xplat_build', { platform: 'web' })
	const built = await jobDone(build.job.jobId)
	const dist = productionSources(join(appDir, 'dist'))
	assert.ok(
		!dist.some(
			(source) =>
				source.includes('fixture.describe-counter') ||
				source.includes('starter-counter') ||
				source.includes('__XPLAT_DEV_BRIDGE__'),
		),
	)

	evidence.push({
		check:
			'consumer web build; fixture declaration/handler/bridge token absent from production dist',
		jobId: build.job.jobId,
		buildIdentity: built.result?.buildIdentity,
	})

	// -- owned launch + readiness ---------------------------------------------------
	const launch = await call('xplat_launch', {
		target: 'web',
		browserMode: osInput ? 'headed' : 'headless',
	})

	sessionId = launch.session.sessionId
	const launched = await until(async () => {
		const { session } = await call('xplat_sessions', { sessionId })
		assert.ok(!['failed', 'stopped'].includes(session.state), JSON.stringify(session))
		return session.state === 'ready'
			? { result: { ...session.launch, buildIdentity: session.buildIdentity } }
			: null
	})
	assert.equal(launched.result.readiness, 'confirmed')
	assert.equal(launched.result.browser.launched, true)
	browserPid = launched.result.browser.pid
	assert.ok(browserPid > 0)
	evidence.push({
		check: 'owned vite + headed Chromium launch, readiness confirmed',
		sessionId,
		browser: launched.result.browser,
		buildIdentity: launched.result.buildIdentity,
	})

	// -- stable-control assertions + both input mechanisms ---------------------------
	await until(async () => {
		const result = await client.callTool({
			name: 'xplat_inspect',
			arguments: { sessionId, control: { kind: 'testID', name: 'counter.value' } },
		})

		lastObservation = result.structuredContent
		return !result.isError && result.structuredContent.data.controls[0]?.text === '0'
	})

	const control = await inspect('counter.increment')
	assert.ok(control.controls[0].frame.width > 0)
	const domClick = await call('xplat_interact', {
		sessionId,
		documentId: control.documentId,
		control: { kind: 'testID', name: 'counter.increment' },
		mechanism: 'dom-event',
	})

	await until(async () => (await inspect('counter.value')).controls[0].text === '1')
	assert.equal(domClick.evidence.provenance.mechanism, 'dom-event')
	evidence.push({
		check: 'counter 0 → 1 via browser dom-event',
		provenance: domClick.evidence.provenance,
	})

	// OS keyboard input needs an unlocked console: the helper activates the
	// owned Chromium, which the window server refuses while the screen is
	// locked. A host-state block is recorded and retried once before
	// session_end — it never masquerades as a pass or a code failure.
	let osInputState = osInput ? 'pending' : 'skipped'
	const attemptOsInput = async () => {
		const result = await client.callTool({
			name: 'xplat_interact',
			arguments: {
				sessionId,
				documentId: control.documentId,
				control: { kind: 'testID', name: 'counter.increment' },
				mechanism: 'os-input',
				key: 'Space',
			},
		})

		if (result.isError) {
			const message = JSON.stringify(result.structuredContent)
			if (/could not become active|is not active|permission unavailable/.test(message)) {
				return { state: 'blocked', message }
			}

			throw new Error(`os-input interact failed: ${message}`)
		}

		const osClick = result.structuredContent.data
		await until(async () => (await inspect('counter.value')).controls[0].text === expectedCount)

		assert.equal(osClick.evidence.provenance.mechanism, 'os-input')
		return { state: 'passed', provenance: osClick.evidence.provenance }
	}

	let expectedCount = '2'
	if (osInput) {
		const outcome = await attemptOsInput()
		osInputState = outcome.state
		if (outcome.state === 'passed') {
			evidence.push({
				check: 'counter 1 → 2 via scoped macOS Space — real OS input, distinct from dom-event',
				provenance: outcome.provenance,
			})
		} else {
			blocked.push({ check: 'counter via scoped macOS Space (os-input)', detail: outcome.message })
		}
	} else {
		evidence.push({
			check: 'os-input journey skipped — requires macOS headed Chromium',
			skipped: true,
		})
	}

	// -- failure honesty --------------------------------------------------------------
	const missing = await client.callTool({
		name: 'xplat_inspect',
		arguments: { sessionId, control: { kind: 'testID', name: 'missing-control' } },
	})

	assert.equal(missing.structuredContent.error.code, 'not_found')
	const duplicate = await client.callTool({
		name: 'xplat_inspect',
		arguments: { sessionId, control: { kind: 'testID', name: 'fixture.duplicate' } },
	})

	assert.equal(duplicate.structuredContent.error.code, 'ambiguous_selection')
	const privateHost = await call('xplat_inspect', {
		sessionId,
		control: { kind: 'id', name: 'fixture.private' },
	})

	assert.equal(privateHost.controls[0].text, '[redacted]')
	assert.ok(!JSON.stringify(privateHost).includes('PRIVATE_FIXTURE_VALUE'))
	const bounded = await call('xplat_inspect', { sessionId, limit: 1 })
	assert.equal(bounded.controls.length, 1)
	assert.ok(bounded.nextOffset !== null)
	const capture = await client.callTool({ name: 'xplat_screenshot', arguments: { sessionId } })
	assert.equal(capture.structuredContent.error.code, 'permission_denied')
	const captures = await call('xplat_evidence', { op: 'list', kind: 'screenshot' })
	assert.equal(captures.evidence.length, 0)
	evidence.push({
		check:
			'missing/duplicate controls fail; private redacted; pagination bounded; capture denied without grant',
	})

	// -- automatic dev-action discovery + invocation -----------------------------------
	const registry = await until(async () => {
		const value = await call('xplat_dev_actions')
		return value.instances.find((instance) =>
			instance.actions.some((action) => action.id === 'fixture.describe-counter'),
		)
	})

	const invoke = await call('xplat_dev_action_invoke', {
		appInstanceId: registry.appInstanceId,
		registryRevision: registry.revision,
		actionId: 'fixture.describe-counter',
	})

	const action = await jobDone(invoke.job.jobId)
	assert.equal(action.result.outcome.result.label, 'starter-counter')
	assert.equal(action.result.outcome.result.controls, 3)
	assert.equal(
		(await inspect('counter.value')).controls[0].text,
		osInputState === 'passed' ? '2' : '1',
	)

	evidence.push({
		check: 'bridge-announced action discovered + invoked; app state asserted separately',
		jobId: invoke.job.jobId,
	})

	// Late retry: the console may have unlocked during the lane.
	if (osInputState === 'blocked') {
		const retry = await attemptOsInput()
		if (retry.state === 'passed') {
			osInputState = 'passed'
			blocked.length = 0
			evidence.push({
				check:
					'counter 1 → 2 via scoped macOS Space — real OS input, distinct from dom-event (late retry)',
				provenance: retry.provenance,
			})
		}
	}

	// -- logs + owned cleanup -------------------------------------------------------------
	const logs = await call('xplat_diagnostics', { sessionId, limit: 20 })
	assert.ok(logs.logs.records.length)
	const ended = await call('xplat_session_end', { sessionId })
	assert.ok(ended.result.released.some((item) => item.includes('chromium')))
	assert.ok(ended.result.released.some((item) => item.includes('vite')))
	const stopped = await client.callTool({ name: 'xplat_inspect', arguments: { sessionId } })
	assert.equal(stopped.structuredContent.error.code, 'stale_identity')
	await until(async () => pidGone(browserPid), 15000)
	const leakedProfiles = readdirSync(tmpdir()).filter(
		(name) => name.startsWith(PROFILE_PREFIX) && !profilesBefore.has(name),
	)

	assert.deepEqual(leakedProfiles, [])
	evidence.push({
		check: 'owned browser/profile released; browser pid gone; stopped identity refused',
		result: ended.result,
	})

	// -- verified snapshot cache serves offline ---------------------------------------------
	const offlineTransport = new StdioClientTransport({
		command: serverBin,
		args: [],
		env: serverEnv({
			GIT_CONFIG_KEY_0: `url.file://${join(work, 'does-not-exist.git')}.insteadOf`,
		}),
		cwd: appDir,
		stderr: 'pipe',
	})

	offlineTransport.stderr?.on('data', (chunk) => appendFileSync(stderrLog, chunk))
	const offlineClient = new Client({ name: 'packed-stdio-offline', version: '1' })
	try {
		await offlineClient.connect(offlineTransport)
		const offlinePage = await offlineClient.callTool({
			name: 'xplat_docs_read',
			arguments: {
				package: '@octane-xplat/ui',
				path: 'docs/testing/test-identifiers.md',
				limit: 2000,
			},
		})

		const offlineData = offlinePage.structuredContent.data
		assert.equal(offlineData.provenance.commit, manifest.fixtureCommit)
		assert.equal(offlineData.provenance.offline, true)
		evidence.push({
			check: 'verified cached snapshot serves docs with remote unreachable (offline: true)',
			provenance: offlineData.provenance,
		})
	} finally {
		await offlineClient.close()
		await offlineTransport.close()
	}

	// -- the spawned server itself is an owned process ----------------------------------------
	const serverPid = transport.pid
	await client.close()
	await transport.close()
	if (serverPid) {
		const exited = await until(async () => pidGone(serverPid), 10000).then(
			() => true,
			() => false,
		)

		assert.ok(exited, `xplat-mcp server pid ${serverPid} did not exit after transport close`)
		evidence.push({
			check: 'owned stdio server process exits when the client disconnects',
			serverPid,
		})
	}

	const passed = blocked.length === 0
	const result = {
		passed,
		transport: 'stdio',
		serverBin,
		consumer: appDir,
		releaseFixture: {
			repo: manifest.fixtureUrl,
			tag: manifest.releaseTag,
			commit: manifest.fixtureCommit,
		},
		evidence,
		...(blocked.length ? { blocked } : {}),
	}

	writeFileSync(evidenceFile, JSON.stringify(result, null, 2) + '\n')
	console.log(JSON.stringify({ passed, transport: 'stdio', evidence, blocked }, null, 2))
	if (!passed) {
		process.exitCode = 1
	}
} catch (error) {
	writeFileSync(
		evidenceFile,
		JSON.stringify(
			{
				passed: false,
				error: error.message,
				lastObservation,
				sessionId,
				browserPid,
				evidence,
				...(blocked.length ? { blocked } : {}),
			},
			null,
			2,
		) + '\n',
	)

	throw error
} finally {
	try {
		await client.close()
	} catch {}

	try {
		await transport.close()
	} catch {}

	// Owned-cleanup obligation: never leave the spawned server or a leaked
	// browser behind if the lane failed partway through.
	for (const pid of [browserPid, transport.pid].filter(Boolean)) {
		if (!pidGone(pid)) {
			try {
				process.kill(pid, 'SIGKILL')
			} catch {}
		}
	}
}
