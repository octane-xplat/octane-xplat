import { startWebApp } from '../../src/client.web'
import { catalog } from './routes.web.tsrx'
export { App, loads, guards, moduleLoads } from './routes.web.tsrx'
export function start(overrides: Record<string, unknown> = {}) {
	return startWebApp({ catalog, buildId: 'test', ...overrides })
}
