// Opt-in, nonvisual acceptance against an independently scaffolded consumer.
// The supplied app uses the starter counter and declares fixture.describe-counter.
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { readdirSync, readFileSync } from 'node:fs'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { createCodeService } from '@octane-xplat/cli/mcp/code-service'
import { createXplatMcpServer } from '../dist/server.js'
import { createWorkspaceContext } from '../dist/status.js'

const appArgument = process.argv.slice(2).find((arg) => !arg.startsWith('--'))
if (!appArgument) {
	throw new Error('Supply the scaffolded app directory and optionally --os-input.')
}

const workspaceRoot = resolve(appArgument)
const osInput = process.argv.includes('--os-input')
const context = createWorkspaceContext({
	workspaceRoot,
	code: createCodeService({ workspaceRoot, workspaceKind: 'consumer' }),
})

const { server, shutdown } = createXplatMcpServer(context)
const [ct, st] = InMemoryTransport.createLinkedPair()
const client = new Client({ name: 'consumer-acceptance', version: '1' })
const evidence = []
let sessionId
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

try {
	await Promise.all([server.connect(st), client.connect(ct)])
	const status = await call('xplat_project_status')
	assert.equal(status.identity.selection.state, 'bound')
	const docs = await call('xplat_docs_search', { query: 'testID', package: '@octane-xplat/ui' })
	assert.ok(docs.results.length, JSON.stringify(docs))
	const page = await call('xplat_docs_read', { ref: docs.results[0].ref, limit: 2000 })
	assert.equal(page.provenance.match, 'exact')
	evidence.push({ check: 'bound docs search/read', provenance: page.provenance })
	const code = await call('xplat_code_search', {
		query: 'counter.increment',
		corpus: 'app',
		mode: 'exact',
	})

	assert.ok(code.results.length)
	await call('xplat_code_read', { ref: code.results[0].ref })
	evidence.push({ check: 'current app code search/read' })
	const build = await call('xplat_build', { platform: 'web' })
	await jobDone(build.job.jobId)
	const productionSources = (dir) =>
		readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
			entry.isDirectory()
				? productionSources(`${dir}/${entry.name}`)
				: [readFileSync(`${dir}/${entry.name}`, 'utf8')],
		)

	assert.ok(
		!productionSources(`${workspaceRoot}/dist`).some(
			(source) => source.includes('fixture.describe-counter') || source.includes('starter-counter'),
		),
	)

	evidence.push({ check: 'consumer web build', jobId: build.job.jobId })
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

	evidence.push({ check: 'owned launch/readiness', sessionId, result: launched.result })
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
	const input = await call('xplat_interact', {
		sessionId,
		documentId: control.documentId,
		control: { kind: 'testID', name: 'counter.increment' },
		mechanism: osInput ? 'os-input' : 'dom-event',
		key: 'Space',
	})

	await until(async () => (await inspect('counter.value')).controls[0].text === '1')
	assert.equal(input.evidence.provenance.mechanism, osInput ? 'os-input' : 'dom-event')
	evidence.push({ check: 'counter 0 → 1', provenance: input.evidence.provenance })
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
	assert.equal(context.evidence.list({ kind: 'screenshot' }).length, 0)
	evidence.push({
		check:
			'missing/duplicate controls fail; private content redacted; pagination bounded; no visual grant means no capture',
	})

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
	assert.equal((await inspect('counter.value')).controls[0].text, '1')
	evidence.push({
		check: 'automatically linked declared action and separate state assertion',
		jobId: invoke.job.jobId,
	})

	const logs = await call('xplat_diagnostics', { sessionId, limit: 20 })
	assert.ok(logs.logs.records.length)
	const ended = await call('xplat_session_end', { sessionId })
	assert.ok(ended.result.released.some((item) => item.includes('chromium')))
	assert.ok(ended.result.released.some((item) => item.includes('vite')))
	const stopped = await client.callTool({ name: 'xplat_inspect', arguments: { sessionId } })
	assert.equal(stopped.structuredContent.error.code, 'stale_identity')
	evidence.push({
		check: 'owned browser/server/profile cleanup; stopped identity refused',
		result: ended.result,
	})

	console.log(
		JSON.stringify(
			{ passed: true, target: 'Chromium', mechanism: osInput ? 'os-input' : 'dom-event', evidence },
			null,
			2,
		),
	)
} catch (error) {
	console.error(
		JSON.stringify({
			error: error.message,
			lastObservation,
			sessionId,
			logs: sessionId ? context.runtime.readLogs({ sessionId, limit: 12 }) : null,
		}),
	)

	throw error
} finally {
	await shutdown()
	await client.close()
	await server.close()
}
