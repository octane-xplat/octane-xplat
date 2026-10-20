import { createRenderRouterHost } from './render-router-host'
import { createRouterRenderScope } from './router-render-scope'
import type { ClientRouterHost, RouterHost, RouterHostChange, RouterInstance } from './props'

/** Compose independent rendered panes with explicitly selected native Frames.
 * Flow kind is stable for the host lifetime; late Frame readiness must not
 * silently turn a Frame flow into a rendered pane. Without Frames every flow
 * renders in its declaring outlet, as on AppKit. */
export function createPaneRouterHost(
	options: {
		frames?: ClientRouterHost
		frameFlows?: readonly string[]
		/** Explicit renderer declaration, consulted at the first outlet mount. */
		isFrameFlow?(flow: string): boolean
	} = {},
) {
	const frames = options.frames
	if (frames && frames.host.history !== 'independent')
		{throw new TypeError('Pane composition requires independent Frame histories')}
	const frameFlows = new Set(options.frameFlows ?? ['root'])
	const declaredFrameFlows = new Map<string, boolean>()
	const panes = createRenderRouterHost()
	const listeners = new Set<(change?: RouterHostChange) => void>()
	let instance: RouterInstance<any> | undefined
	let disposed = false
	const isFrame = (flow: string) => !!frames && (declaredFrameFlows.get(flow) ?? frameFlows.has(flow))
	const declareFlow = (flow: string) => {
		if (!declaredFrameFlows.has(flow)) {declaredFrameFlows.set(flow, frameFlows.has(flow) || options.isFrameFlow?.(flow) === true)}
	}
	const selected = (flow: string) => (isFrame(flow) ? frames!.host : panes.host)
	const notify = (change?: RouterHostChange) => {
		for (const listener of [...listeners]) {listener(change)}
	}
	const detachFrames = frames?.host.subscribe(notify)
	const detachPanes = panes.host.subscribe(notify)
	const host: RouterHost = {
		history: 'independent',
		canReset: panes.host.canReset && (frames?.host.canReset ?? true),
		getSnapshot: (flow) => selected(flow).getSnapshot(flow),
		subscribe(listener) {
			listeners.add(listener)
			return () => {
				listeners.delete(listener)
			}
		},
		commit(command) {
			if (disposed) {return Promise.resolve({ status: 'cancelled', reason: 'disposed' })}
			return selected(command.flow).commit(command)
		},
		dispose() {
			if (disposed) {return}
			disposed = true
			detachFrames?.()
			detachPanes()
			panes.host.dispose?.()
			frames?.host.dispose?.()
			listeners.clear()
			instance = undefined
		},
	}
	return {
		host,
		attach(router) {
			if (instance || disposed) {throw new Error('Pane host cannot be attached')}
			frames?.attach(router)
			panes.attach(router)
			instance = router
		},
		scope(flow) {
			if (!instance) {throw new Error('Pane host is not attached')}
			return createRouterRenderScope(instance, flow)
		},
		getRenderHost(flow) {
			declareFlow(flow)
			return isFrame(flow) ? frames?.getRenderHost?.(flow) : panes
		},
		mount(flow, owner) {
			if (disposed) {throw new Error('Pane host is disposed')}
			declareFlow(flow)
			return isFrame(flow) ? frames!.mount(flow, owner) : () => {}
		},
	} satisfies ClientRouterHost
}
