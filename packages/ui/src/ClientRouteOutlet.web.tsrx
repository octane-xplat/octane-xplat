/** @jsxImportSource octane */
import { RouterOutletBoundary } from './router-outlet-boundary.tsrx'
import { createPortal, useLayoutEffect, useMemo, useRef, useSyncExternalStore } from 'octane'
import { ClientRouteView } from './ClientRouteView.tsrx'
import { RouterRenderScopeProvider } from './router-hooks.tsrx'
import type { BrowserRouterHost } from './browser-router-host.web'
import type { ClientRouteEntry } from './client-route-entry'
import { isolateModalFocus } from './modal-focus.web'
import { useThemeScheme } from './theme/theme-scheme'

/** One focus owner per modal flow, retained while its screens are replaced.
 * Body portals let the existing overlay manager make the presenter inert. */
function BrowserRouteModal(props: {
	entry?: ClientRouteEntry
	staged: readonly ClientRouteEntry[]
}): any {
	const dark = useThemeScheme() === 'dark'
	const layer = useRef<HTMLDivElement | null>(null)
	const panel = useRef<HTMLDivElement | null>(null)
	const dismiss = useRef<(() => unknown) | undefined>(undefined)
	const navigator = props.entry?.scope.navigator
	dismiss.current = navigator ? () => navigator.dismiss() : undefined
	const shown = !!props.entry
	useLayoutEffect(() => {
		if (!shown || !layer.current || !panel.current) {
			return
		}

		return isolateModalFocus(
			layer.current,
			panel.current,
			() => {
				void dismiss.current?.()
			},
			undefined,
			(trigger) =>
				trigger?.isConnected ? trigger : trigger?.id ? document.getElementById(trigger.id) : null,
		)
	}, [shown])

	useLayoutEffect(() => {
		// Replacing a screen can remove the focused control. Keep focus in this
		// flow without replacing its original return target or focusing staging.
		if (shown && panel.current && !panel.current.contains(document.activeElement)) {
			panel.current.focus({ preventScroll: true })
		}
	}, [props.entry?.id])

	const entries = [
		...(props.entry ? [{ entry: props.entry, staged: false }] : []),
		...props.staged.map((entry) => ({ entry, staged: true })),
	]

	return createPortal(
		<div
			ref={layer}
			data-vx-modal-layer={shown ? '' : undefined}
			className={dark ? 'vx-modalroute dark' : 'vx-modalroute'}
			style={{ display: shown ? undefined : 'none' }}
		>
			<div
				ref={panel}
				className="vx-modalroute-body"
				role={shown ? 'dialog' : undefined}
				aria-modal={shown ? true : undefined}
				aria-label={props.entry?.content.head?.title ?? 'Dialog'}
			>
				@for (const item of entries; key item.entry.id) {
					<div style={{ display: item.staged ? 'none' : 'contents' }}>
						<ClientRouteView entry={item.entry} />
					</div>
				}
			</div>
		</div>,
		document.body,
	)
}

/** Internal browser outlet. Public RouteOutlet wiring follows after adapters
 * expose the same instance/owner behavior on native targets. */
function OwnedClientRouteOutlet(props: {
	host: BrowserRouterHost
	flow?: string
	children?: any
}): any {
	const flow = props.flow ?? 'root'
	const host = props.host
	const scope = useMemo(() => ({ ...host.scope(flow), host }), [host, flow])
	useLayoutEffect(() => host.mount(flow), [host, flow])
	const snapshot = useSyncExternalStore(
		host.views.subscribe,
		host.views.getSnapshot,
		host.views.getSnapshot,
	)

	const entry = snapshot.main?.flow === flow ? snapshot.main : null
	const entries = [
		...(entry ? [{ entry, staged: false }] : []),
		...(snapshot.staged ?? [])
			.filter((stage) => !stage.modal && stage.entry.flow === flow)
			.map((stage) => ({ ...stage, staged: true })),
	]

	const modalFlows = new Map<string, { entry?: ClientRouteEntry; staged: ClientRouteEntry[] }>()
	if (flow === 'root') {
		for (const modal of snapshot.modals) {
			modalFlows.set(modal.flow, { entry: modal.entry, staged: [] })
		}

		for (const stage of snapshot.staged ?? []) {
			if (!stage.modal) {
				continue
			}

			const modal: { entry?: ClientRouteEntry; staged: ClientRouteEntry[] } = modalFlows.get(
				stage.entry.flow,
			) ?? { staged: [] }

			modal.staged.push(stage.entry)
			modalFlows.set(stage.entry.flow, modal)
		}
	}

	const modals = Array.from(modalFlows, ([key, modal]) => ({ key, ...modal }))

	return (
		<RouterRenderScopeProvider scope={scope}>
			<div
				ref={(element: HTMLDivElement | null) => host.entryElement('base:' + flow, element)}
				style={{ display: entry ? 'none' : 'contents' }}
			>
				{props.children}
			</div>
			@for (const item of entries; key item.entry.id) {
				<div
					ref={(element: HTMLDivElement | null) => host.entryElement(item.entry.id, element)}
					style={{ display: item.staged ? 'none' : 'contents' }}
				>
					<ClientRouteView entry={item.entry} />
				</div>
			}
			@for (const modal of modals; key modal.key) {
				<BrowserRouteModal entry={modal.entry} staged={modal.staged} />
			}
		</RouterRenderScopeProvider>
	)
}

export function ClientRouteOutlet(props: {
	host: BrowserRouterHost
	flow?: string
	children?: any
}): any {
	return (
		<RouterOutletBoundary host={props.host} flow={props.flow ?? 'root'} base={props.children}>
			<OwnedClientRouteOutlet {...props} />
		</RouterOutletBoundary>
	)
}
