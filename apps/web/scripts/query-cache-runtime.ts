// Local Chromium qualification. No screenshots or browser installation.
import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { octane } from '@octanejs/vite-plugin'
import { xplatDevBridge } from '@octane-xplat/cli/vite'
import { chromium } from 'playwright'
import type { QueryInspectionSnapshot } from '@octane-xplat/ui/data/dev'

const execute = promisify(execFile)
const root = fileURLToPath(new URL('../tests/fixtures/query-cache/', import.meta.url))
const appRoot = fileURLToPath(new URL('../', import.meta.url))
const workspace = fileURLToPath(new URL('../../../', import.meta.url))
const cli = fileURLToPath(new URL('../../../packages/cli/dist/cli.js', import.meta.url))
const platform =
	'/@fs' + fileURLToPath(new URL('../../../packages/platform/src/dev-actions.ts', import.meta.url))
const server = await createServer({
	root,
	configFile: false,
	plugins: [...octane(), xplatDevBridge({ appRoot })],
	resolve: {
		conditions: ['web'],
		extensions: ['.web.tsrx', '.tsrx', '.web.ts', '.ts', '.mjs', '.js', '.json'],
	},
	server: { host: '127.0.0.1', port: 0 },
})
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined
const errors: string[] = []
let assertions = 0
function check(condition: unknown, message: string): asserts condition {
	assert.ok(condition, message)
	assertions++
}
async function until<T>(
	predicate: () => T | Promise<T>,
	timeoutMs = 30_000,
): Promise<NonNullable<T>> {
	const deadline = Date.now() + timeoutMs
	while (Date.now() < deadline) {
		const value = await predicate()
		if (value) { return value as NonNullable<T> }
		await new Promise((resolve) => setTimeout(resolve, 50))
	}
	throw new Error('Query workflow condition timed out')
}
async function command<T>(args: string[]): Promise<T> {
	const { stdout } = await execute(
		process.execPath,
		[cli, ...args, '--project', workspace, '--app', 'apps/web', '--json'],
		{
			env: { ...process.env, XPLAT_PERMISSIONS: 'runtime-actions' },
			maxBuffer: 4 * 1024 * 1024,
			timeout: 30_000,
		},
	)
	const result = JSON.parse(stdout)
	assert.equal(result.ok, true, 'CLI command succeeds')
	return result.data as T
}
type Instance = { appInstanceId: string; revision: number; actions: { id: string }[] }
type Job = {
	jobId: string
	state: string
	result?: { outcome?: { status: string; result?: { snapshot?: string } } }
}

try {
	await server.listen()
	const base = server.resolvedUrls?.local[0]
	assert.ok(base)
	browser = await chromium.launch({ headless: true })
	const context = await browser.newContext()
	const page = await context.newPage()
	page.on('pageerror', (error) => errors.push(error.message))
	await page.goto(new URL('/cached-users', base).href)
	await page.locator('#cached-user-1').waitFor()
	check((await page.locator('#cached-user-1').textContent()) === 'Ada user 1', 'first page renders')
	await page.locator('#cached-more').click()
	await page.locator('#cached-user-6').waitFor()
	await page.locator('#cached-user-1').click()
	await page.locator('#cached-name').waitFor()
	await page.locator('#cached-reject').click()
	await until(async () =>
		(await page.locator('#cached-save-status').textContent())?.includes('Save rejected.'),
	)
	check((await page.locator('#cached-name').textContent()) === 'Ada user 1', 'rejection rolls back')
	await page.locator('#cached-save').click()
	await until(async () =>
		(await page.locator('#cached-save-status').textContent())?.includes('Saved.'),
	)
	await page.locator('#cached-back').click()
	await page.locator('#cached-user-6').waitFor()
	check(
		(await page.locator('#cached-user-1').textContent()) === 'Ada user 1!',
		'confirmed edit and pages survive navigation',
	)

	const instanceId = await page.evaluate(
		async (url) => (await import(url)).startDevActionBridge().instanceId,
		platform,
	)
	async function snapshot(): Promise<QueryInspectionSnapshot> {
		const instance = await until(async () => {
			const view = await command<{ instances: Instance[] }>(['actions', 'list'])
			return view.instances.find(
				(instance) =>
					instance.appInstanceId === instanceId &&
					instance.actions.some((action) => action.id.startsWith('queries.inspect.')),
			)
		})
		const action = instance.actions.find((action) => action.id.startsWith('queries.inspect.'))!
		const accepted = await command<{ job: Job }>([
			'actions',
			'invoke',
			'--action',
			action.id,
			'--instance',
			instanceId,
			'--revision',
			String(instance.revision),
			'--input',
			'{}',
		])
		const job = await until(async () => {
			const status = await command<{ job: Job }>(['actions', 'status', accepted.job.jobId])
			if (['failed', 'cancelled'].includes(status.job.state)) {
					throw new Error('Inspection action failed')
				}
			return status.job.result?.outcome ? status.job : undefined
		})
		assert.equal(job.result?.outcome?.status, 'succeeded')
		return JSON.parse(job.result?.outcome?.result?.snapshot ?? '')
	}
	const before = await snapshot()
	const feed = before.queries.find((query) => query.label === 'demo.feed')!
	check(feed.observers === 1, 'CLI inspects the mounted feed')
	check(
		!JSON.stringify(before).includes('Ada user') &&
			!JSON.stringify(before).includes('public-demo') &&
			!JSON.stringify(before).includes('demo-users'),
		'inspection omits values, namespace and keys',
	)
	const loads = before.events.filter(
		(event) => event.queryId === feed.queryId && event.type === 'load',
	).length
	await context.setOffline(true)
	await page.locator('#cached-refresh').click()
	await until(
		async () => (await page.locator('#cached-network').textContent()) === 'Request: paused',
	)
	check(
		(await page.locator('#cached-user-1').textContent()) === 'Ada user 1!',
		'offline refresh retains data',
	)
	await context.setOffline(false)
	await until(async () => (await page.locator('#cached-network').textContent()) === 'Request: idle')
	const recovered = await snapshot()
	check(
		recovered.events.filter((event) => event.queryId === feed.queryId && event.type === 'load')
			.length ===
			loads + 1,
		'browser reconnect resumes one shared request',
	)
	await page.locator('#cached-restart').click()
	await until(async () => (await page.locator('#cached-user-1').textContent()) === 'Ada user 1!')
	check(
		(await page.locator('#cached-user-6').count()) === 1,
		'new client restores the retained feed',
	)
	await page.reload()
	await page.locator('#cached-user-6').waitFor()
	check(
		(await page.locator('#cached-user-1').textContent()) === 'Ada user 1!',
		'page reload restores confirmed records',
	)
	await page.locator('#cached-switch').click()
	await until(async () => (await page.locator('#cached-user-1').textContent()) === 'Grace user 1')
	check(
		!(await page.locator('#root').textContent())?.includes('Ada user'),
		'account replacement hides old records',
	)
	check(errors.length === 0, 'no unhandled browser errors: ' + errors.join('; '))
	console.log(
		JSON.stringify({
			target: 'chromium',
			status: 'pass',
			assertions,
			capabilities: {
				reconnect: 'browser-offline-event',
				navigation: 'real-router',
				inspection: 'CLI-action',
				activity: 'not-qualified',
			},
		}),
	)
} finally {
	await browser?.close()
	await server.close()
}
