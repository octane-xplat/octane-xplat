import { createStore } from './store'
import { createRouterRenderScope } from './router-render-scope'
import type {
	PreparedRouteMatch,
	RouterHostContent,
	RouterHostResult,
	RouterInstance,
} from './props'

/** Renderer receipt, not an animation or passive-effect completion signal. */
export function createClientRouteEntry(
	instance: RouterInstance<any>,
	flow: string,
	id: string,
	route: PreparedRouteMatch,
	content: RouterHostContent,
) {
	const match = createStore<PreparedRouteMatch | null>(route)
	let settle!: (result: RouterHostResult) => void
	let reject!: (error: unknown) => void
	let settled = false
	const committed = new Promise<RouterHostResult>((resolve, fail) => {
		reject = fail
		settle = resolve
	})
	const finish = (result: RouterHostResult) => {
		if (settled) {return}
		settled = true
		settle(result)
	}
	return {
		id,
		flow,
		route,
		content,
		scope: createRouterRenderScope(instance, flow, match),
		committed,
		rendered() {
			finish({ status: 'committed', route })
		},
		failed(error: unknown) {
			if (settled) {return}
			settled = true
			reject(error)
		},
		cancel() {
			finish({ status: 'cancelled', reason: 'disposed' })
		},
	}
}
export type ClientRouteEntry = ReturnType<typeof createClientRouteEntry>
