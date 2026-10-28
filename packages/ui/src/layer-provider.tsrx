/** @jsxImportSource @octane-xplat/jsx */
import { createContext, useContext, useMemo } from 'octane'
import type { LayerContextValue, LayerProviderProps, LayerToastConfig } from './props'
import { ToastViewport } from './toast-viewport'

/** Context published by `LayerProvider` — `null` means no provider, in
 *  which case toasts lazily self-mount a default viewport. */
export const LayerContext = createContext<LayerContextValue | null>(null)
export const LayerProviderContext: any = LayerContext

/** Read the nearest `LayerProvider` value, or `null` outside one. */
export function useLayerContext(): LayerContextValue | null {
	return useContext(LayerContext)
}

const DEFAULT_TOAST_CONFIG: LayerToastConfig = {}

/** App-level provider for layer systems (Astryx `LayerProvider`) — mounts a
 *  `ToastViewport` configured by `toast` around the subtree so `useToast()`/
 *  `showToast()` calls dock there. Optional; nested providers pass through
 *  (the outermost wins). One shared leaf: `ToastViewport` already carries
 *  the per-platform stack behavior. */
export function LayerProvider(props: LayerProviderProps) @{
	const existing = useLayerContext()
	const toast = props.toast ?? DEFAULT_TOAST_CONFIG
	const value = useMemo<LayerContextValue>(
		() => ({ toastConfig: toast, isProvider: true }),
		[toast],
	)

	if (existing) {
		return <>{props.children}</>
	}

	return (
		<LayerProviderContext value={value}>
			<ToastViewport position={toast.position} maxVisible={toast.maxVisible} inset={toast.inset}>
				{props.children}
			</ToastViewport>
		</LayerProviderContext>
	)
}
