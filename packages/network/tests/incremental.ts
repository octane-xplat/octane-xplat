import { fixtureOrigin } from './fixture-origin'
import { requestStream } from '@octane-xplat/network'
import { decodeNdjson } from 'rouzer/ndjson'
import type { ProbeContext } from '../../../scripts/probe/context'

export async function run(ctx: ProbeContext) {
	const origin = fixtureOrigin(ctx.target)
	const result = await requestStream(`${origin}/stream`)
	ctx.assert('status', result.status, 200)
	if (typeof TextDecoder === 'function') {
		const values = decodeNdjson<{ text: string }>(result.body)[Symbol.asyncIterator]()
		ctx.assert('Rouzer decodes streamed Unicode record', (await values.next()).value?.text, 'é')
		const marker = await requestStream(`${origin}/state`)
		ctx.assert(
			'server still open after first record',
			((await marker.json()) as { finished: boolean }).finished,
			false,
		)

		await values.return?.()
	} else {
		const reader = result.body.getReader()
		ctx.assert('first bytes before completion', (await reader.read()).done, false)
		const marker = await requestStream(`${origin}/state`)
		ctx.assert(
			'server still open after first bytes',
			((await marker.json()) as { finished: boolean }).finished,
			false,
		)

		await reader.cancel()
		reader.releaseLock()
		ctx.record(
			'Rouzer decoder',
			'unavailable: host has no global TextDecoder; raw stream and owned text/JSON codec tested',
		)
	}
	const uploaded = await requestStream(`${origin}/upload`, {
		method: 'PUT',
		headers: { 'content-type': 'application/octet-stream', 'x-fixture': 'synthetic' },
		body: new Uint8Array([0, 255, 1, 127]),
	})
	const bytes = (await uploaded.json()) as { bytes: number[]; header: string }
	ctx.assert('exact binary upload', JSON.stringify(bytes.bytes), '[0,255,1,127]')
	ctx.assert('request header', bytes.header, 'synthetic')
	const failure = await requestStream(`${origin}/failure`)
	ctx.assert('non-2xx status preserved', failure.status, 503)
	ctx.assert(
		'non-2xx remains readable',
		((await failure.json()) as { unavailable: boolean }).unavailable,
		true,
	)
	const controller = new AbortController()
	const pending = await requestStream(`${origin}/stream`, { signal: controller.signal })
	const reader = pending.body.getReader()
	controller.abort()
	let aborted = false
	try {
		await reader.read()
	} catch (cause) {
		aborted = cause instanceof Error && cause.name === 'AbortError'
	} finally {
		reader.releaseLock()
	}
	ctx.assert('abort rejects body consumption', aborted, true)
}
