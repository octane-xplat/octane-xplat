import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = await readFile(new URL('../examples/reporting.web.ts', import.meta.url), 'utf8')
const compiled = ts.transpile(source, {
	module: ts.ModuleKind.CommonJS,
	target: ts.ScriptTarget.ES2022,
})
function fixture() {
	let options,
		captured = 0,
		closed = 0
	const sdk = {
		init: (value) => {
			options = value
		},
		addBreadcrumb: () => {},
		captureException: () => {
			captured++
			return 'event-id'
		},
		close: async () => {
			closed++
			return true
		},
	}
	const exports = {}
	vm.runInNewContext(compiled, { exports, require: () => sdk })
	return { helper: exports, options: () => options, captured: () => captured, closed: () => closed }
}
const config = {
	dsn: 'https://public@example.test/1',
	release: 'packing@1+1',
	dist: 'web-1',
	environment: 'staging',
}

test('no reports are captured before explicit enablement; initialization is owned once', () => {
	const f = fixture()
	assert.equal(f.helper.reportDeliveryCheck(), null)
	f.helper.startReporting(config)
	f.helper.startReporting(config)
	assert.equal(f.helper.reportDeliveryCheck(), 'event-id')
	assert.equal(f.captured(), 1)
	assert.equal(f.options().release, config.release)
	assert.equal(f.options().dataCollection.userInfo, false)
})

test('filter removes free-form data while retaining build identity and readable source positions', () => {
	const f = fixture()
	const event = f.helper.filterError({
		event_id: 'e',
		release: config.release,
		dist: config.dist,
		user: { email: 'private@example.test' },
		request: { url: 'https://example.test/?token=private' },
		extra: { token: 'private' },
		exception: {
			values: [
				{
					value: 'private error',
					stacktrace: {
						frames: [
							{
								filename: 'https://example.test/assets/app.js?token=private',
								lineno: 4,
								colno: 9,
								vars: { secret: 'private' },
							},
						],
					},
				},
			],
		},
		breadcrumbs: [
			{ category: 'fetch', message: 'private URL' },
			{ category: 'app-action', message: 'report-delivery-check', data: { secret: 'private' } },
		],
		debug_meta: { images: [{ type: 'sourcemap', debug_id: 'debug-1' }] },
	})
	assert.equal(event.user, undefined)
	assert.equal(event.request, undefined)
	assert.equal(event.extra, undefined)
	assert.equal(event.exception.values[0].value, 'Application error')
	assert.equal(
		event.exception.values[0].stacktrace.frames[0].filename,
		'https://example.test/assets/app.js',
	)
	assert.equal(event.exception.values[0].stacktrace.frames[0].lineno, 4)
	assert.equal(event.exception.values[0].stacktrace.frames[0].vars, undefined)
	assert.equal(event.debug_meta.images[0].debug_id, 'debug-1')
	assert.equal(event.breadcrumbs.length, 1)
	assert.equal(event.breadcrumbs[0].data, undefined)
	assert.ok(!JSON.stringify(event).includes('private'))
})

test('collection withdrawal immediately drops new events and breadcrumbs, then closes the client', async () => {
	const f = fixture()
	f.helper.startReporting(config)
	const stopping = f.helper.stopReporting()
	assert.equal(f.options().beforeSend({ message: 'private' }), null)
	assert.equal(
		f.options().beforeBreadcrumb({ category: 'app-action', message: 'report-delivery-check' }),
		null,
	)
	assert.equal(f.helper.reportDeliveryCheck(), null)
	assert.equal(await stopping, true)
	assert.equal(f.closed(), 1)
})
