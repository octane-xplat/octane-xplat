import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { test } from 'node:test'
import worker from './src/worker.ts'

const report = {
	goal: 'Share state between routed screens',
	expected: 'Both screens show the updated count',
	expectation_basis: 'The state-sharing documentation example',
	actual: 'The second screen retained the previous value',
	target: 'ios',
	impact: 'investigation',
}

function setup(t) {
	const db = new DatabaseSync(':memory:')
	t.after(() => db.close())
	db.exec(readFileSync(new URL('./migrations/0001_feedback.sql', import.meta.url), 'utf8'))
	const keys = []
	const env = {
		FEEDBACK: {
			prepare(sql) {
				return {
					bind(...values) {
						return {
							async run() {
								db.prepare(sql).run(...values)
								return { success: true }
							},
						}
					},
				}
			},
		},
		FEEDBACK_RATE_LIMITER: {
			async limit({ key }) {
				keys.push(key)
				return { success: true }
			},
		},
	}
	const send = (body = report, init = {}, path = '/api/feedback') =>
		worker.fetch(
			new Request(`https://octane-xplat.goddardai.org${path}`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(body),
				...init,
			}),
			env,
		)
	return { db, env, keys, send }
}

test('persists the report and returns a receipt after insertion', async (t) => {
	const { db, send, keys } = setup(t)
	const full = {
		...report,
		evidence: "A value containing ' SQL quotes",
		workaround: 'Read at each consumer',
	}
	const response = await send(full, {
		headers: { 'content-type': 'application/json; charset=utf-8', 'cf-connecting-ip': '192.0.2.1' },
	})
	assert.equal(response.status, 201)
	assert.equal(response.headers.get('cache-control'), 'no-store')
	assert.equal(response.headers.get('access-control-allow-origin'), null)
	const receipt = await response.json()
	assert.match(receipt.id, /^[0-9a-f-]{36}$/)
	assert.equal(new Date(receipt.created_at).toISOString(), receipt.created_at)
	assert.deepEqual(
		{ ...db.prepare('SELECT * FROM feedback_observations').get() },
		{ ...receipt, ...full },
	)
	assert.deepEqual(keys, ['192.0.2.1'])
})

test('optional fields become NULL and separate reports remain distinct', async (t) => {
	const { db, send } = setup(t)
	assert.equal((await send()).status, 201)
	assert.equal((await send()).status, 201)
	const rows = db.prepare('SELECT * FROM feedback_observations').all()
	assert.equal(rows.length, 2)
	assert.notEqual(rows[0].id, rows[1].id)
	assert.equal(rows[0].evidence, null)
	assert.equal(rows[0].workaround, null)
})

test('rejects unsupported routes, reads, and non-JSON content', async (t) => {
	const { send } = setup(t)
	assert.equal((await send(report, {}, '/elsewhere')).status, 404)
	const read = await send(undefined, { method: 'GET', body: undefined })
	assert.equal(read.status, 405)
	assert.equal(read.headers.get('allow'), 'POST')
	assert.equal((await send(report, { headers: { 'content-type': 'text/plain' } })).status, 415)
})

test('rejects malformed and invalid reports without inserting rows', async (t) => {
	const { db, send } = setup(t)
	for (const body of [
		null,
		[],
		{},
		{ ...report, goal: ' ' },
		{ ...report, actual: 42 },
		{ ...report, target: 'tv' },
		{ ...report, impact: 'critical' },
		{ ...report, evidence: null },
		{ ...report, goal: 'x'.repeat(2001) },
		{ ...report, repository_url: 'private' },
	]) {
		const response = await send(body)
		assert.equal(response.status, 400)
		assert.equal((await response.json()).error, 'invalid-report')
	}
	assert.equal((await send(report, { body: '{' })).status, 400)
	assert.equal((await send(report, { body: new Uint8Array([0xff]) })).status, 400)
	assert.equal(db.prepare('SELECT COUNT(*) AS n FROM feedback_observations').get().n, 0)
})

test('bounds declared and streamed payloads, including multibyte text', async (t) => {
	const { db, send } = setup(t)
	assert.equal(
		(
			await send(report, {
				headers: { 'content-type': 'application/json', 'content-length': '32769' },
			})
		).status,
		413,
	)
	const bytes = new TextEncoder().encode(JSON.stringify({ ...report, actual: '🦊'.repeat(9000) }))
	let cancelled = false
	const stream = new ReadableStream({
		pull(controller) {
			controller.enqueue(bytes)
		},
		cancel() {
			cancelled = true
		},
	})
	assert.equal((await send(report, { body: stream, duplex: 'half' })).status, 413)
	assert.equal(cancelled, true)
	assert.equal(db.prepare('SELECT COUNT(*) AS n FROM feedback_observations').get().n, 0)
})

test('rate limits before persistence and fails closed if the limiter fails', async (t) => {
	const { db, env, send } = setup(t)
	env.FEEDBACK_RATE_LIMITER.limit = async () => ({ success: false })
	const limited = await send()
	assert.equal(limited.status, 429)
	assert.equal(limited.headers.get('retry-after'), '60')
	env.FEEDBACK_RATE_LIMITER.limit = async () => {
		throw new Error('limiter unavailable')
	}
	assert.equal((await send()).status, 503)
	assert.equal(db.prepare('SELECT COUNT(*) AS n FROM feedback_observations').get().n, 0)
})

test('storage failures never produce a receipt or expose database details', async (t) => {
	const { env, send } = setup(t)
	env.FEEDBACK.prepare = () => {
		throw new Error('private database details')
	}
	const response = await send()
	assert.equal(response.status, 503)
	assert.deepEqual(await response.json(), { error: 'temporarily-unavailable' })
	env.FEEDBACK.prepare = () => ({ bind: () => ({ run: async () => ({ success: false }) }) })
	assert.equal((await send()).status, 503)
})
