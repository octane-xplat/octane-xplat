import { configureLayerKeys, dispatchLayerKey } from './layer-stack'
import { hostGlobal } from './host-bridge'

// GTK windows dispatch Escape through the shared layer stack: the renderer's
// `__octaneGtkHost` installs a bubble-phase key monitor on the root window
// widget, which forwards Escape here so the topmost registered overlay or
// dialog layer handles it. Popover sessions keep their popup-events path.
configureLayerKeys(() => {
	const host = hostGlobal<Record<string, any>>('__octaneGtkHost')
	return (
		host?.installKeyMonitor?.((event: any) => dispatchLayerKey(event)) ?? (() => {})
	)
})

/** GTK sessions dispatch Escape through the shared layer stack after native
 * editor handling. The declaring host owns focus capture and restoration. */
export function captureLayerFocus(getTarget?: () => any, host?: any): () => void {
	return host?.captureLayerFocus?.(getTarget) ?? (() => {})
}
