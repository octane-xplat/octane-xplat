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
import { existsSync, realpathSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const work = process.argv[2] && resolve(process.argv[2])
if (!work) {
	throw new Error('Supply the prepare-packed-consumer.mjs work directory.')
}

const manifest = JSON.parse(readFileSync(join(work, 'packed-consumer.json'), 'utf8'))
const { appDir } = manifest
const evidence = []

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
			'catalog', 'status', 'app select', 'capabilities', 'permissions', 'targets',
			'docs search', 'docs read', 'guidance', 'code search', 'code read',
		]) {
			assert.ok(names.includes(expected), `missing ${expected}`)
		}

		assert.ok(data.planned.some((p) => p.mcpTool === 'xplat_launch'))
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
			run(['docs', 'read', '--package', '@octane-xplat/ui', '--version', '0.9.0', '--path', 'docs/verify/test-identifiers.md', '--json']),
		).data

		assert.equal(outside.status, 'unavailable')
		assert.equal(outside.reason, 'tag-absent')
	})

	check('offline docs report unavailable with installed-source fallback', () => {
		const offline = json(
			run(['docs', 'read', '--package', '@octane-xplat/ui', '--path', 'docs/verify/test-identifiers.md', '--json'], {
				env: {
					XPLAT_DOCS_REPO: 'file:///nonexistent/xplat-release',
					XPLAT_MCP_CACHE: join(work, 'docs-cache-offline'),
				},
			}),
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
	console.error('PACKED AGENT LANE FAILED:', error)
	writeFileSync(
		join(work, 'packed-agent-consumer.json'),
		JSON.stringify({ evidence, failed: error.message, completedAt: new Date().toISOString() }, null, '\t') + '\n',
	)

	process.exit(1)
}
