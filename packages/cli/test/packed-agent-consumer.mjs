// Packed independent-consumer acceptance for the agent CLI discovery and
// retrieval journey (item 1). Drives the INSTALLED `xplat` bin — packed
// tarball payloads, release-tag fixture — through help/catalog/schema,
// status/selection/capabilities/permissions/targets, exact-version
// docs/guidance, current-source code, and honest offline/error results.
// No repository-only scripts are involved in the journey itself.
//
// Prepare first: node packages/mcp/tests/prepare-packed-consumer.mjs <work>
// Then:          node packages/cli/test/packed-agent-consumer.mjs <work>
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, realpathSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const work = process.argv[2] && resolve(process.argv[2])
if (!work) {
	throw new Error('Supply the prepare-packed-consumer.mjs work directory.')
}

const manifest = JSON.parse(readFileSync(join(work, 'packed-consumer.json'), 'utf8'))
const { appDir } = manifest
const evidence = []
const osInput = process.platform === 'darwin'
const PROFILE_PREFIX = 'xplat-mcp-chromium-'
const profilesBefore = new Set(
	readdirSync(tmpdir()).filter((name) => name.startsWith(PROFILE_PREFIX)),
)

const xplatBin = join(appDir, 'node_modules', '.bin', 'xplat')
assert.ok(existsSync(xplatBin), `installed xplat bin missing at ${xplatBin}`)
// The agent journey uses the installed artifact — never the repo checkout.
assert.ok(
	!realpathSync(xplatBin).includes('/octane-xplat/packages/'),
	`xplat bin resolves into the framework workspace: ${realpathSync(xplatBin)}`,
)

// As in the stdio lane, the canonical release repo is redirected to the
// local release fixture per spawned process.
const agentEnv = (extra = {}) => ({
	...process.env,
	XPLAT_MCP_CACHE: manifest.cacheDir,
	GIT_CONFIG_COUNT: '1',
	GIT_CONFIG_KEY_0: `url.${manifest.fixtureUrl}.insteadOf`,
	GIT_CONFIG_VALUE_0: 'https://github.com/octane-xplat/octane-xplat',
	...extra,
})

const run = (args, { cwd = appDir, env = {} } = {}) => {
	try {
		const stdout = execFileSync(xplatBin, args, {
			cwd,
			env: agentEnv(env),
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'pipe'],
		})

		return { code: 0, stdout, stderr: '' }
	} catch (error) {
		return {
			code: error.status,
			stdout: error.stdout ?? '',
			stderr: error.stderr ?? '',
		}
	}
}

const json = (out) => {
	const parsed = JSON.parse(out.stdout)
	assert.equal(parsed.contractVersion, 1, out.stdout)
	assert.match(parsed.requestId, /^req-/)
	return parsed
}

const check = (name, fn) => {
	process.stderr.write(`Checking ${name}\n`)
	fn()
}

let sessionId
let browserPid

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)

const until = (fn, timeoutMs = 60000) => {
	const deadline = Date.now() + timeoutMs
	while (Date.now() < deadline) {
		const value = fn()
		if (value) {
			return value
		}

		sleep(150)
	}

	throw new Error('Acceptance condition timed out.')
}

const jobDone = (jobId, timeoutMs = 120000) =>
	until(() => {
		const { job } = json(run(['job', 'status', jobId, '--json'])).data
		assert.ok(!['failed', 'cancelled'].includes(job.state), JSON.stringify(job))
		return job.state === 'succeeded' ? job : null
	}, timeoutMs)

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
	// -- ordinary help, no project ------------------------------------------------
	check('xplat --help lists the agent commands without a project', () => {
		const out = run(['--help'], { cwd: '/' })
		assert.equal(out.code, 0)
		for (const name of ['catalog', 'status', 'docs', 'code', 'capabilities', 'targets']) {
			assert.ok(out.stdout.includes(`- ${name} `), `help missing ${name}`)
		}
	})

	// -- catalog + schema ----------------------------------------------------------
	check('catalog --json reports the command contract', () => {
		const { data } = json(run(['catalog', '--json']))
		assert.equal(data.cli.name, '@octane-xplat/cli')
		assert.equal(data.cli.version, manifest.frameworkVersion)
		const names = data.commands.map((c) => c.command)
		for (const expected of [
			'catalog',
			'status',
			'app select',
			'capabilities',
			'permissions',
			'targets',
			'docs search',
			'docs read',
			'guidance',
			'code search',
			'code read',
		]) {
			assert.ok(names.includes(expected), `missing ${expected}`)
		}

		for (const runtime of [
			'runtime build',
			'session start',
			'session attach',
			'session list',
			'session status',
			'session end',
			'job status',
			'job cancel',
			'logs',
			'inspect',
			'interact',
			'capture',
			'evidence list',
			'actions list',
			'actions invoke',
			'actions status',
		]) {
			assert.ok(names.includes(runtime), `missing ${runtime}`)
		}

		assert.ok(data.boundaries.length > 0)
	})

	evidence.push({ check: 'catalog lists implemented commands, planned surface, boundaries' })

	check('--schema describes a command without executing it', () => {
		const { data } = json(run(['docs', 'search', '--schema'], { cwd: '/' }))
		assert.equal(data.command, 'docs search')
		assert.equal(data.requiresBoundApp, true)
		assert.deepEqual(data.supportedContractVersions, [1])
	})

	// -- status: installed-version identity ---------------------------------------
	const status = json(run(['status', '--json'])).data
	assert.equal(status.server.name, '@octane-xplat/cli')
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
		check: 'status resolves the app and packed installed versions (no workspace/lockfile guess)',
		framework: status.identity.framework,
	})

	// -- exact-version docs ---------------------------------------------------------
	const docs = json(run(['docs', 'search', 'testID', '--json'])).data
	assert.ok(docs.results.length, JSON.stringify(docs))
	const hit = docs.results[0]
	assert.equal(hit.provenance.match, 'exact')
	assert.equal(hit.provenance.tag, manifest.releaseTag)
	assert.equal(hit.provenance.commit, manifest.fixtureCommit)
	assert.equal(hit.provenance.servedVersion, manifest.frameworkVersion)

	const page = json(run(['docs', 'read', '--ref', hit.ref, '--json'])).data
	assert.equal(page.provenance.match, 'exact')
	assert.equal(page.provenance.commit, manifest.fixtureCommit)
	evidence.push({ check: 'docs bound to the exact release tag/commit of the installed version' })

	check('unreleased versions return explicit unavailable — never latest', () => {
		const outside = json(
			run([
				'docs',
				'read',
				'--package',
				'@octane-xplat/ui',
				'--version',
				'0.9.0',
				'--path',
				'docs/testing/test-identifiers.md',
				'--json',
			]),
		).data

		assert.equal(outside.status, 'unavailable')
		assert.equal(outside.reason, 'tag-absent')
	})

	check('offline docs report unavailable with installed-source fallback', () => {
		const offline = json(
			run(
				[
					'docs',
					'read',
					'--package',
					'@octane-xplat/ui',
					'--path',
					'docs/testing/test-identifiers.md',
					'--json',
				],
				{
					env: {
						XPLAT_DOCS_REPO: 'file:///nonexistent/xplat-release',
						XPLAT_MCP_CACHE: join(work, 'docs-cache-offline'),
					},
				},
			),
		).data

		assert.equal(offline.status, 'unavailable')
		assert.equal(offline.fallback.kind, 'installed-source')
	})

	evidence.push({ check: 'explicit unavailable + installed-source fallback, no latest guess' })

	// -- guidance + current-source code ---------------------------------------------
	const guidance = json(run(['guidance', '--json'])).data
	assert.ok(Array.isArray(guidance.entries), JSON.stringify(guidance))
	evidence.push({ check: `guidance returned ${guidance.entries.length} version-bound entries` })

	const code = json(run(['code', 'search', 'testID', '--mode', 'exact', '--json'])).data
	assert.ok(code.results.length, 'code search found no current-source hits')
	const codeHit = code.results[0]
	assert.equal(codeHit.freshness.state, 'current')
	const slice = json(run(['code', 'read', '--ref', codeHit.ref, '--json'])).data
	assert.equal(slice.freshness.state, 'current')
	evidence.push({ check: 'code search/read serve current source with refs and freshness' })

	// -- capabilities / permissions / targets ----------------------------------------
	const caps = json(run(['capabilities', '--platform', 'web', '--json'])).data
	const capIds = caps.capabilities[0].capabilities.map((c) => c.capability)
	for (const id of ['docs', 'code_search', 'target_discovery', 'build', 'launch']) {
		assert.ok(capIds.includes(id), `capability ${id} missing`)
	}

	evidence.push({ check: 'capability matrix reports per-operation rows' })

	const denied = json(run(['permissions', '--scope', 'visual-capture', '--json'])).data
	assert.equal(denied.check.granted, false)
	assert.equal(denied.grant.state, 'required')
	evidence.push({ check: 'visual-capture stays a required grant — discovery grants nothing' })

	const targets = json(run(['targets', '--platform', 'web', '--json'])).data
	const web = targets.platforms.find((p) => p.platform === 'web')
	assert.equal(web.declared, true)
	assert.equal(web.targets[0].targetId, 'web')
	evidence.push({ check: 'targets reports exact ids for declared platforms' })

	// -- runtime journey through the agent runtime host --------------------------------
	// The host is a per-workspace process the stateful commands spawn on
	// demand — `session list` before any work reports its absence honestly.
	const noSessions = json(run(['session', 'list', '--json'])).data
	assert.equal(noSessions.host.state, 'absent')
	assert.deepEqual(noSessions.sessions, [])

	const build = json(run(['runtime', 'build', '--platform', 'web', '--json'])).data
	const built = jobDone(build.job.jobId)
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
		check: 'runtime build job through the host; fixture handlers absent from production dist',
		jobId: build.job.jobId,
		buildIdentity: built.result?.buildIdentity,
	})

	const launch = json(
		run([
			'session',
			'start',
			'--platform',
			'web',
			'--browser-mode',
			osInput ? 'headed' : 'headless',
			'--json',
		]),
	).data

	sessionId = launch.session.sessionId
	const launched = jobDone(launch.job.jobId)
	assert.equal(launched.result.readiness, 'confirmed')
	assert.equal(launched.result.browser.launched, true)
	browserPid = launched.result.browser.pid
	assert.ok(browserPid > 0)
	evidence.push({
		check: 'owned vite + Chromium session via the host, readiness confirmed',
		sessionId,
		browser: launched.result.browser,
	})

	const listed = json(run(['session', 'list', '--json'])).data
	const boundSession = listed.sessions.find((s) => s.sessionId === sessionId)
	assert.equal(boundSession.state, 'ready')
	assert.equal(boundSession.ownership, 'owned')
	assert.equal(listed.host.state, 'live')
	evidence.push({ check: 'session list/status report the live owned session' })

	// -- stable-control assertions + both input mechanisms ------------------------------
	const inspect = (extra = []) => json(run(['inspect', sessionId, ...extra, '--json']))
	until(() => {
		const result = inspect(['--testid', 'counter.value'])
		return result.ok && result.data.controls[0]?.text === '0'
	})

	const control = inspect(['--testid', 'counter.increment']).data
	assert.ok(control.controls[0].frame.width > 0)
	const domClick = json(
		run([
			'interact',
			sessionId,
			'--document',
			control.documentId,
			'--testid',
			'counter.increment',
			'--mechanism',
			'dom-event',
			'--json',
		]),
	).data

	assert.equal(domClick.evidence.provenance.mechanism, 'dom-event')
	until(() => inspect(['--testid', 'counter.value']).data.controls[0]?.text === '1')
	evidence.push({ check: 'counter 0 → 1 via dom-event through the host transport' })

	let osInputState = osInput ? 'pending' : 'skipped'
	const attemptOsInput = () => {
		const out = run([
			'interact',
			sessionId,
			'--document',
			control.documentId,
			'--testid',
			'counter.increment',
			'--mechanism',
			'os-input',
			'--key',
			'Space',
			'--json',
		])

		const parsed = JSON.parse(out.stdout)
		if (!parsed.ok) {
			const message = JSON.stringify(parsed.error)
			if (/could not become active|is not active|permission unavailable/.test(message)) {
				return { state: 'blocked', message }
			}

			throw new Error(`os-input interact failed: ${message}`)
		}

		until(() => inspect(['--testid', 'counter.value']).data.controls[0]?.text === expectedCount)
		assert.equal(parsed.data.evidence.provenance.mechanism, 'os-input')
		return { state: 'passed', provenance: parsed.data.evidence.provenance }
	}

	let expectedCount = '2'
	if (osInput) {
		const outcome = attemptOsInput()
		osInputState = outcome.state
		if (outcome.state === 'passed') {
			evidence.push({
				check: 'counter 1 → 2 via scoped macOS Space — real OS input, distinct from dom-event',
				provenance: outcome.provenance,
			})
		} else {
			evidence.push({
				check: 'os-input blocked by console state — recorded, not passed',
				blocked: true,
			})
		}
	} else {
		evidence.push({
			check: 'os-input journey skipped — requires macOS headed Chromium',
			skipped: true,
		})
	}

	// -- failure honesty ------------------------------------------------------------------
	assert.equal(inspect(['--testid', 'missing-control']).error.code, 'not_found')

	assert.equal(inspect(['--testid', 'fixture.duplicate']).error.code, 'ambiguous_selection')

	const privateHost = inspect(['--id', 'fixture.private']).data
	assert.equal(privateHost.controls[0].text, '[redacted]')
	assert.ok(!JSON.stringify(privateHost).includes('PRIVATE_FIXTURE_VALUE'))
	const bounded = inspect(['--limit', '1']).data
	assert.equal(bounded.controls.length, 1)
	assert.ok(bounded.nextOffset !== null)
	const captureDenied = run(['capture', sessionId, '--json'])
	assert.equal(json(captureDenied).error.code, 'permission_denied')
	const captures = json(run(['evidence', 'list', '--kind', 'screenshot', '--json'])).data
	assert.equal(captures.evidence.length, 0)
	evidence.push({
		check: 'missing/duplicate/redacted/bounded inspection honesty; capture denied without grant',
	})

	// Granted capture writes a session-scoped artifact through the host.
	const capture = json(
		run(['capture', sessionId, '--json'], { env: { XPLAT_PERMISSIONS: 'visual-capture' } }),
	).data

	assert.ok(existsSync(capture.evidence.artifactPath))
	evidence.push({ check: 'granted capture records a session-scoped artifact with provenance' })

	// -- automatic dev-action discovery + invocation ----------------------------------------
	const registry = until(() => {
		const { instances } = json(run(['actions', 'list', '--json'])).data
		return instances.find((instance) =>
			instance.actions.some((action) => action.id === 'fixture.describe-counter'),
		)
	})

	const invoke = json(
		run([
			'actions',
			'invoke',
			'--instance',
			registry.appInstanceId,
			'--revision',
			String(registry.revision),
			'--action',
			'fixture.describe-counter',
			'--json',
		]),
	).data

	const action = jobDone(invoke.job.jobId)
	assert.equal(action.result.outcome.result.label, 'starter-counter')
	const actionStatus = json(run(['actions', 'status', invoke.job.jobId, '--json'])).data
	assert.equal(actionStatus.job.state, 'succeeded')
	assert.equal(
		inspect(['--testid', 'counter.value']).data.controls[0].text,
		osInputState === 'passed' ? '2' : '1',
	)

	evidence.push({
		check: 'bridge-announced action discovered + invoked; app state asserted separately',
	})

	// -- logs + owned cleanup -------------------------------------------------------------------
	const logs = json(run(['logs', '--session', sessionId, '--limit', '20', '--json'])).data
	assert.ok(logs.records.length)
	const ended = json(run(['session', 'end', sessionId, '--json'])).data
	assert.ok(ended.result.released.some((item) => item.includes('chromium')))
	assert.ok(ended.result.released.some((item) => item.includes('vite')))
	assert.equal(inspect([]).error.code, 'stale_identity')
	until(() => pidGone(browserPid), 15000)
	const leakedProfiles = readdirSync(tmpdir()).filter(
		(name) => name.startsWith(PROFILE_PREFIX) && !profilesBefore.has(name),
	)

	assert.deepEqual(leakedProfiles, [])
	evidence.push({
		check: 'owned browser/profile released; browser pid gone; stopped identity refused',
		result: ended.result,
	})

	// -- selection persistence --------------------------------------------------------
	const selected = json(run(['app', 'select', '.', '--json'])).data
	assert.equal(selected.bound.id, '.')
	assert.ok(existsSync(selected.preference.path))
	const rebound = json(run(['status', '--json'])).data
	assert.equal(rebound.identity.selection.reason, 'preference')
	evidence.push({ check: 'app select persists a client/workspace preference' })

	// -- honest errors -----------------------------------------------------------------
	check('missing project reports selection state, never invents an app', () => {
		const empty = json(run(['status', '--project', join(work, 'not-an-app'), '--json'])).data
		assert.equal(empty.identity.selection.state, 'none')
	})

	check('invalid input exits 2 with a contract error', () => {
		const bad = run(['status', '--bogus', '--json'])
		assert.equal(bad.code, 2)
		assert.equal(json(bad).error.code, 'invalid_selection')

		const boundless = run(['docs', 'search', 'x', '--project', join(work, 'not-an-app'), '--json'])
		assert.equal(boundless.code, 2)
		assert.equal(json(boundless).error.code, 'invalid_selection')
	})

	evidence.push({ check: 'invalid/ambiguous selections fail honestly with exit 2' })

	check('--json stdout stays pure; diagnostics stay on stderr', () => {
		const out = run(['status', '--json'])
		assert.equal(out.code, 0)
		json(out)
		assert.equal(out.stderr, '')
	})

	writeFileSync(
		join(work, 'packed-agent-consumer.json'),
		JSON.stringify({ evidence, completedAt: new Date().toISOString() }, null, '\t') + '\n',
	)

	console.log(`packed agent consumer lane passed — ${evidence.length} evidence entries`)
} catch (error) {
	// The host outlives this process — end the owned session so a mid-lane
	// failure never leaves a dev server or browser behind.
	if (sessionId) {
		try {
			run(['session', 'end', sessionId, '--json'])
		} catch {}
	}

	if (browserPid && !pidGone(browserPid)) {
		try {
			process.kill(browserPid, 'SIGKILL')
		} catch {}
	}

	console.error('PACKED AGENT LANE FAILED:', error)
	writeFileSync(
		join(work, 'packed-agent-consumer.json'),
		JSON.stringify(
			{ evidence, failed: error.message, completedAt: new Date().toISOString() },
			null,
			'\t',
		) + '\n',
	)

	process.exit(1)
}
