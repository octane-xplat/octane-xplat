/** @jsxImportSource @octane-xplat/jsx */
import { type ContentOwner } from './owned-content'
import { hostGlobal } from '../../internal/platform/host-bridge'
import { LayerDepthProvider, useLayerDismissal } from './layer-dismissal.tsrx'
import { GtkSheetPanel } from './BottomSheet.gtk'
import type {
	BottomSheetHandle,
	BottomSheetOpenOptions,
	ModalOpenResult,
	OpenBottomSheet,
} from '../../props'

/** Imperative content gets the same handle, chrome and dismissal layer as
 *  a declaration (the macOS ImperativeSheetPanel equivalent). Escape and
 *  the swipe's slide-out close through `props.close`. */
function GtkServiceSheet(props: {
	component: any
	params: any
	options: BottomSheetOpenOptions
	close: (result?: ModalOpenResult) => void
}) @{
	const dismissal = useLayerDismissal({
		active: true,
		dismiss: () => props.close(),
		restoreFocus: false,
	})

	<GtkSheetPanel
		label={props.options.label ?? 'Sheet'}
		snapPoints={props.options.snapPoints}
		// The service carries no height budget — the panel sizes to content
		// unless snap stops fix it (same as the native service).
		height="hug"
		layerDepth={dismissal.depth}
		requestDismiss={() => props.close()}
	>
		<LayerDepthProvider value={dismissal.depth}>
			<{props.component} params={props.params} close={props.close} />
		</LayerDepthProvider>
	</GtkSheetPanel>
}

interface ActiveSheet {
	finish: (result?: ModalOpenResult) => void
}

const active = new Set<ActiveSheet>()

/** Close the most recently opened bottom sheet (resolve with `result`). */
export function closeBottomSheet(result?: ModalOpenResult): void {
	;[...active].pop()?.finish(result)
}

/** GTK sheets present inside overlay layers, not an exposed host view —
 *  the macOS leaf's answer, for harness callers that share the shape. */
export function bottomSheetHost(): null {
	return null
}

/** Imperative in-window bottom sheet: a dedicated service root inside a
 *  bottom-docked modal overlay layer on the most recent live root (the
 *  macOS `presentSurface` equivalent). Resolves when the sheet closes. */
export const openBottomSheet: OpenBottomSheet = (Component, params, options) =>
	openBottomSheetWithOwner(null, Component, params, options)

/** Internal presenter shared by standalone services and declaring-tree outlets. */
export function openBottomSheetWithOwner(
	owner: ContentOwner | null,
	...[Component, params, options = {}]: Parameters<OpenBottomSheet>
): BottomSheetHandle {
	if (owner?.disposed) {
		return Object.assign(Promise.reject(new Error('The content outlet has been removed')), {
			close() {},
		}) as BottomSheetHandle
	}

	let closeSheet: ((result?: ModalOpenResult) => void) | undefined
	const handle = new Promise<ModalOpenResult>((resolve) => {
		const host = hostGlobal<Record<string, any>>('__octaneGtkHost')
		if (!host?.createOverlayLayer || !host.mountServiceRoot) {
			console.warn('[openBottomSheet] linux-gtk overlay host is not mounted — sheet skipped')
			resolve(undefined)
			return
		}

		let finished = false
		let layer: any = null
		let contentRoot: { render?: (component: any, props: any) => void; unmount?: () => void } | null =
			null
		const entry: ActiveSheet = {
			finish(result) {
				if (finished) {
					return
				}

				finished = true
				active.delete(entry)
				try {
					contentRoot?.unmount?.()
				} finally {
					try {
						layer?.dispose()
					} catch { }
					resolve(result)
				}
			},
		}

		// The owner's own root hosts the layer when the call comes through
		// `useImperativeBottomSheet`; the standalone service lands on the
		// bridge's most recent live root.
		const createLayer = (owner?.host as any)?.createOverlayLayer ?? host.createOverlayLayer
		layer = createLayer({
			modal: options.hasScrim ?? true,
			scrim: options.hasScrim ?? true,
			align: { h: 'fill', v: 'end' },
			onScrimPress: () => entry.finish(),
		})

		const props = {
			component: Component,
			params,
			options,
			close: (result?: ModalOpenResult) => entry.finish(result),
		}

		if (owner) {
			const cr = owner.createRoot(layer.target, () => entry.finish())
			cr.render(GtkServiceSheet, props)
			contentRoot = cr
		} else {
			contentRoot = host.mountServiceRoot(layer, GtkServiceSheet, props)
		}

		// Content can close synchronously during its first render.
		if (!finished) {
			layer.setVisible(true)
			active.add(entry)
		}
		closeSheet = entry.finish
	}) as BottomSheetHandle

	handle.close = (result?: ModalOpenResult) => closeSheet?.(result)
	return handle
}
