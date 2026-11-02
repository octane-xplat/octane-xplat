import { createWebHandler, createWebRenderer } from '@octane-xplat/web-host/server'
import { catalog, requestContext } from './routes.web.tsrx'
import { Document } from './Document.web.tsrx'

export const handle = createWebHandler({
	catalog,
	context: requestContext,
	buildId: 'example-v1',
	Document,
	assets: { scripts: ['/client.js'] },
	transfer: (match) => ({
		data: match.contract === 'declared' ? match.data : null,
		context: {},
	}),
	mode: (request) => (new URL(request.url).searchParams.has('client') ? 'client' : 'server'),
})

// Static output is a separate opt-in; request-time responses remain private by default.
export const staticRenderer = createWebRenderer({
	catalog,
	context: requestContext,
	buildId: 'example-v1',
	Document,
	assets: { scripts: ['/client.js'] },
	transfer: (match) => ({
		data: match.contract === 'declared' ? match.data : null,
		context: {},
	}),
	response: () => ({ headers: { 'Cache-Control': 'public, max-age=60' } }),
})
