import { createWebHandler, createWebRenderer } from '../../src/server.web'
import { catalog } from './routes.web.tsrx'
export { App, loads, guards, Document } from './routes.web.tsrx'
export function handler(overrides: Record<string, unknown> = {}) {
	return createWebHandler({
		catalog,
		buildId: 'test',
		assets: { scripts: ['/client.js'], styles: ['/app.css'] },
		context: (request) => ({
			viewer: request.headers.get('X-Viewer') ?? 'server',
			secret: 'private-secret',
			service: () => {},
		}),
		transfer: (match) => ({ data: match.data as any, context: {} }),
		...overrides,
	})
}

export function renderer(overrides: Record<string, unknown> = {}) {
	return createWebRenderer({
		catalog,
		buildId: 'test',
		assets: { scripts: ['/client.js'] },
		context: () => ({ viewer: 'static', secret: 'private-secret' }),
		transfer: (match) => ({ data: match.data as any, context: {} }),
		response: () => ({ headers: { 'Cache-Control': 'public, max-age=60' } }),
		...overrides,
	})
}
