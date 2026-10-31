/** @jsxImportSource @octane-xplat/jsx */
import { createContext, useContext, useMemo } from 'octane'
import type { LayerContextValue, LayerProviderProps, LayerToastConfig } from '../../props'

export const LayerContext = createContext<LayerContextValue | null>(null)
export const LayerProviderContext: any = LayerContext

export function useLayerContext(): LayerContextValue | null {
	return useContext(LayerContext)
}

const DEFAULT_TOAST_CONFIG: LayerToastConfig = {}

/** App-level provider for layer systems (Astryx `LayerProvider`), GTK leaf —
 *  provides the layer/toast context values. The shared leaf's `ToastViewport`
 *  is the nativescript `RootLayout` path (toast family is slice D3), so this
 *  leaf ships the context surface only; viewport registration lands with D3. */
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

	return <LayerContext value={value}>{props.children}</LayerContext>
}
