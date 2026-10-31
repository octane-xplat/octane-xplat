/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useEffect, useId, useMemo, useRef, useState } from 'octane'
import type { ToastPosition, ToastViewportProps } from '../../props'
import { ToastViewportProvider, type ToastViewportContextValue } from './toast-context'
import { registerToastViewport, toastStore } from './toast-store'
import { GtkToastSurface, TOAST_EDGE_ALIGN, TOAST_POSITIONS } from './toast-surface.gtk'

/** Toast stack container (Astryx `ToastViewport`), GTK leaf. Toasts render
 *  on corner-docked, nonmodal overlay layers above the root content — one
 *  layer per edge so empty window regions never claim input. The viewport
 *  owns routing config (`position`, `maxVisible`) so `useToast` inside it
 *  docks there; `inset` applies as extra edge margin and `isTopLayer`
 *  stays web semantics. */
export function ToastViewport(props: ToastViewportProps) @{
	const id = useId()
	const sentinel = useRef<any>(null)
	const [layers, setLayers] = useState<Partial<Record<ToastPosition, any>> | null>(null)
	const ctx = useMemo<ToastViewportContextValue>(
		() => ({ id, position: props.position ?? 'bottomEnd', maxVisible: props.maxVisible ?? 5 }),
		[id, props.position, props.maxVisible],
	)

	useEffect(() => {
		const unregister = registerToastViewport(id)
		return () => {
			unregister()
			// Orphaned entries drain to the fallback stack — wake it.
			toastStore.set([...toastStore.getSnapshot()])
		}
	}, [id])

	useEffect(() => {
		const view = sentinel.current
		if (!view) {
			return
		}

		const map: Partial<Record<ToastPosition, any>> = {}
		for (const position of TOAST_POSITIONS) {
			const layer = view.createOverlayLayer({
				modal: false,
				scrim: false,
				align: TOAST_EDGE_ALIGN[position],
			})
			layer.setVisible(true)
			map[position] = layer
		}
		setLayers(map)
		return () => {
			for (const layer of Object.values(map)) {
				;(layer as any).dispose()
			}
		}
	}, [id])

	<>
		<ToastViewportProvider value={ctx}>{props.children}</ToastViewportProvider>
		<masonview
			ref={(v: any) => {
				sentinel.current = v
			}}
			style={mergeStyle(
				{ flexDirection: 'column' },
				mergeStyle({ display: 'flex' }, { width: 0, height: 0 }),
			)}
		/>
		{layers ? (
			<GtkToastSurface
				viewportId={id}
				position={ctx.position}
				maxVisible={ctx.maxVisible}
				inset={props.inset}
				layers={layers}
			/>
		) : null}
	</>
}
