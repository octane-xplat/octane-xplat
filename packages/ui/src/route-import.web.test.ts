// @vitest-environment node
import { expect, it } from 'vitest'
import { router, configureRouter } from './default-router.web'
import { defineRoutes } from './route-table'

it('imports client routing without a DOM and refuses client state on the server', () => {
	expect(typeof window).toBe('undefined')
	expect(() => router.getSnapshot()).toThrow('Configure routes')
	configureRouter({ catalog: defineRoutes([]) })
	expect(() => router.getSnapshot()).toThrow('requires a browser')
})
